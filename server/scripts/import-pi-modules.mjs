/**
 * Resumable importer for the Blue Blazer PI mastery package.
 *
 * This script never relies on bundled source code. It reads the validated JSON
 * dataset directly and upserts each module into the existing Blue Blazer schema.
 * Re-running it is safe: each PI is replaced atomically by its stable piId.
 *
 * Usage:
 *   PI_SEED_DATA_DIR=/absolute/path/to/blue_blazer_pi_mastery_modules node server/scripts/import-pi-modules.mjs
 * Optional filters:
 *   PI_SEED_CLUSTER="Marketing" PI_SEED_LIMIT=25 node server/scripts/import-pi-modules.mjs
 */
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const DEFAULT_DATA_DIR = "/home/ubuntu/pi-package-review/blue_blazer_pi_quizlet_complete/seed-data/blue_blazer_pi_mastery_modules";
const dataDir = path.resolve(process.env.PI_SEED_DATA_DIR ?? DEFAULT_DATA_DIR);
const clusterFilter = process.env.PI_SEED_CLUSTER?.trim();
const limit = Number.parseInt(process.env.PI_SEED_LIMIT ?? "0", 10) || 0;

const clusterPrefix = {
  Marketing: "MKT",
  Finance: "FIN",
  "Business Management & Administration": "BMA",
  "Hospitality & Tourism": "HT",
  "Business Administration Core": "BAC",
  Entrepreneurship: "ENT",
  "Personal Financial Literacy": "PFL",
};

function levelFor(sourceLevel) {
  if (["PQ", "CS"].includes(sourceLevel)) return "Foundation";
  if (["MN", "ON", "SU"].includes(sourceLevel)) return "Advanced";
  return "Intermediate";
}

function piIdFor(cluster, sourceCode) {
  const prefix = clusterPrefix[cluster];
  if (!prefix) throw new Error(`Unsupported cluster: ${cluster}`);
  return `${prefix}-${sourceCode.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "")}`.toUpperCase();
}

function assertModule(module, source) {
  if (!source) throw new Error(`Missing source index entry for ${module.id}`);
  if (module.vocabulary?.length !== 10) throw new Error(`${module.id}: expected 10 vocabulary terms.`);
  if (module.flashcards?.length !== 20) throw new Error(`${module.id}: expected 20 flashcards.`);
  if (module.quick_review?.questions?.length !== 10 || module.quick_review?.answers?.length !== 10) {
    throw new Error(`${module.id}: expected 10 quick-review questions and answers.`);
  }
  if (module.quiz?.length !== 15) throw new Error(`${module.id}: expected 15 quiz questions.`);
  if (module.scenario_challenges?.length !== 3) throw new Error(`${module.id}: expected 3 scenarios.`);
}

function theoryContent(module) {
  return [
    module.learning.plain_english,
    `Big Idea: ${module.learning.big_idea}`,
    module.learning.business_importance,
    `Business Example — ${module.business_example.company_or_business}`,
    module.business_example.situation,
    module.business_example.application,
    module.business_example.business_impact,
    `Memory Tool (${module.learning.memory_tool.type}): ${module.learning.memory_tool.content}`,
  ].join("\n\n");
}

function vocabularyContent(module) {
  return module.vocabulary
    .map(item => `${item.term}: ${item.definition} Example: ${item.practical_example}`)
    .join("\n");
}

function relatedContent(module) {
  return [
    "Related Performance Indicators:",
    ...module.related_pis.map(item => `- ${item.performance_indicator} — ${item.key_difference}`),
    "",
    "Common Mistakes:",
    ...module.common_mistakes.map(item => `- ${item.misconception} — ${item.correction}`),
  ].join("\n");
}

function teachBackContent(module) {
  return [
    module.teach_back.student_prompt,
    "",
    "A strong response should include:",
    ...module.teach_back.excellent_response_must_include.map(item => `- ${item}`),
    "",
    "AI Coach Study Signals:",
    "Strengths to build:",
    ...module.ai_coach.strengths.map(item => `- ${item}`),
    "Likely misconceptions:",
    ...module.ai_coach.likely_competition_mistakes.map(item => `- ${item}`),
    `Recommended next PI: ${module.ai_coach.recommended_next_pi}`,
    `Estimated readiness: ${module.ai_coach.estimated_readiness}`,
  ].join("\n");
}

function quickReviewContent(module) {
  return JSON.stringify({
    quickReview: module.quick_review.questions.map((question, index) => ({
      number: question.number,
      question: question.question,
      answer: module.quick_review.answers[index]?.answer ?? "",
    })),
  });
}

function scenarioDifficulty(level) {
  return level <= 1 ? "easy" : level === 2 ? "medium" : "hard";
}

async function findChunkFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await findChunkFiles(fullPath));
    if (
      entry.isFile() &&
      entry.name.endsWith(".json") &&
      !entry.name.endsWith("-all.json") &&
      !["manifest.json", "validation_report.json", "final_integrity_report.json", "pi_source_index.json"].includes(entry.name)
    ) files.push(fullPath);
  }
  return files.sort();
}

async function insertSection(connection, moduleId, sectionType, title, content, order) {
  const [result] = await connection.execute(
    "INSERT INTO `piModuleSections` (`moduleId`, `sectionType`, `title`, `content`, `order`) VALUES (?, ?, ?, ?, ?)",
    [moduleId, sectionType, title, content, order],
  );
  return result.insertId;
}

async function insertRows(connection, table, columns, rows) {
  if (!rows.length) return;
  const columnsSql = columns.map(column => `\`${column}\``).join(", ");
  const placeholders = rows.map(() => `(${columns.map(() => "?").join(", ")})`).join(", ");
  await connection.execute(
    `INSERT INTO \`${table}\` (${columnsSql}) VALUES ${placeholders}`,
    rows.flat(),
  );
}

async function replaceModule(connection, module, source) {
  assertModule(module, source);
  const piId = piIdFor(module.cluster, source.pi_code);
  const level = levelFor(source.level);
  await connection.beginTransaction();
  try {
    const [upsert] = await connection.execute(
      `INSERT INTO \`piLearningModules\` (\`piId\`, \`cluster\`, \`instructionalArea\`, \`performanceIndicator\`, \`level\`)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         \`id\` = LAST_INSERT_ID(\`id\`),
         \`cluster\` = VALUES(\`cluster\`),
         \`instructionalArea\` = VALUES(\`instructionalArea\`),
         \`performanceIndicator\` = VALUES(\`performanceIndicator\`),
         \`level\` = VALUES(\`level\`),
         \`updatedAt\` = CURRENT_TIMESTAMP`,
      [piId, module.cluster, module.instructional_area, module.performance_indicator, level],
    );
    const moduleId = upsert.insertId;
    if (!moduleId) throw new Error(`Unable to resolve module id for ${piId}`);

    // Clear the prior generated version of this module while retaining module-level progress.
    await connection.execute(
      "DELETE usp FROM `userPiSectionProgress` usp INNER JOIN `piModuleSections` s ON s.`id` = usp.`sectionId` WHERE s.`moduleId` = ?",
      [moduleId],
    );
    await connection.execute(
      "DELETE f FROM `piFlashcards` f INNER JOIN `piModuleSections` s ON s.`id` = f.`sectionId` WHERE s.`moduleId` = ?",
      [moduleId],
    );
    await connection.execute(
      "DELETE q FROM `piQuizQuestions` q INNER JOIN `piModuleSections` s ON s.`id` = q.`sectionId` WHERE s.`moduleId` = ?",
      [moduleId],
    );
    await connection.execute(
      "DELETE c FROM `piScenarioChallenges` c INNER JOIN `piModuleSections` s ON s.`id` = c.`sectionId` WHERE s.`moduleId` = ?",
      [moduleId],
    );
    await connection.execute("DELETE FROM `piModuleSections` WHERE `moduleId` = ?", [moduleId]);

    await insertSection(connection, moduleId, "theory", "Lesson", theoryContent(module), 1);
    await insertSection(connection, moduleId, "vocabulary", "Vocabulary", vocabularyContent(module), 2);
    const flashcardsSectionId = await insertSection(connection, moduleId, "flashcards", "Flashcards", "Study all 20 flashcards before attempting the quiz.", 3);
    const quizSectionId = await insertSection(connection, moduleId, "quiz", "Quick Review and Quiz", quickReviewContent(module), 4);
    const scenariosSectionId = await insertSection(connection, moduleId, "scenario_challenge", "Scenario Challenges", "Apply the PI to three business and competition situations.", 5);
    await insertSection(connection, moduleId, "examples", "Related PIs and Common Mistakes", relatedContent(module), 6);
    await insertSection(connection, moduleId, "ai_coach_feedback", "Teach-Back", teachBackContent(module), 7);

    await insertRows(
      connection,
      "piFlashcards",
      ["sectionId", "question", "answer", "type"],
      module.flashcards.map(card => [flashcardsSectionId, card.front, card.back, String(card.type).slice(0, 64)]),
    );
    await insertRows(
      connection,
      "piQuizQuestions",
      ["sectionId", "question", "options", "correctAnswer", "explanation"],
      module.quiz.map(question => [
        quizSectionId,
        question.question,
        JSON.stringify([question.choices.A, question.choices.B, question.choices.C, question.choices.D]),
        question.correct_answer,
        question.explanation,
      ]),
    );
    await insertRows(
      connection,
      "piScenarioChallenges",
      ["sectionId", "scenario", "difficulty", "expectedAnswer"],
      module.scenario_challenges.map(scenario => [
        scenariosSectionId,
        `${scenario.scenario}\n\nStudent Task: ${scenario.student_task}`,
        scenarioDifficulty(scenario.level),
        [
          "Ideal Response Points:",
          ...scenario.ideal_response_points.map(item => `- ${item}`),
          "",
          "Evaluation Criteria:",
          ...scenario.evaluation_criteria.map(item => `- ${item}`),
        ].join("\n"),
      ]),
    );
    await connection.commit();
    return piId;
  } catch (error) {
    await connection.rollback();
    throw error;
  }
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
  if (!existsSync(dataDir)) throw new Error(`PI seed directory not found: ${dataDir}`);

  const sourceIndex = JSON.parse(await readFile(path.join(dataDir, "pi_source_index.json"), "utf8"));
  const sourceById = new Map(sourceIndex.map(source => [source.id, source]));
  const files = await findChunkFiles(dataDir);
  const pool = mysql.createPool(process.env.DATABASE_URL);
  const connection = await pool.getConnection();
  const seen = new Set();
  const totals = new Map();
  let processed = 0;

  try {
    for (const file of files) {
      const modules = JSON.parse(await readFile(file, "utf8"));
      for (const module of modules) {
        if (seen.has(module.id)) continue;
        seen.add(module.id);
        if (clusterFilter && module.cluster !== clusterFilter) continue;
        await replaceModule(connection, module, sourceById.get(module.id));
        processed += 1;
        totals.set(module.cluster, (totals.get(module.cluster) ?? 0) + 1);
        if (processed % 100 === 0) console.log(`Imported ${processed} PI modules...`);
        if (limit && processed >= limit) break;
      }
      if (limit && processed >= limit) break;
    }
    console.log(`PI import complete. Modules imported: ${processed}.`);
    console.table(Object.fromEntries(totals));
  } finally {
    connection.release();
    await pool.end();
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("PI import failed:", error);
    process.exit(1);
  });
