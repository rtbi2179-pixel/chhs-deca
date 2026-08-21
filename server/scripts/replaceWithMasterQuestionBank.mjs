import { readFile } from "node:fs/promises";
import mysql from "mysql2/promise";

const sourcePath = "/home/ubuntu/upload/DECA_50000_MANUS_COMBINED_MASTER.json";
const backupTable = "questions_backup_before_master_50000_20260821";
const batchSize = 250;
const apply = process.argv.includes("--apply");
const referenceTables = [
  ["bookmarks", "questionId"],
  ["chapterExamActivity", "questionId"],
  ["sessionQuestions", "questionId"],
  ["userAnswers", "questionId"],
];
const columns = [
  "id", "cluster", "instructional_area", "performance_indicator_focus", "cognitive_level", "difficulty", "stem",
  "option_a", "option_b", "option_c", "option_d", "correct_answer", "rationale",
  "distractor_rationale_a", "distractor_rationale_b", "distractor_rationale_c", "distractor_rationale_d",
  "concept_tag", "source_status",
];

function optional(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function required(value, label, combinedId) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`Question ${combinedId}: ${label} is required.`);
  return value.trim();
}

function mapQuestion(question) {
  const id = required(question?.combined_id, "combined_id", "unknown");
  const sourceBank = required(question?.source_bank, "source_bank", id);
  if (!id.startsWith(sourceBank === "core_39000_master" ? "CORE::" : "HARD::")) throw new Error(`Question ${id}: combined identifier does not match source bank.`);
  const cluster = required(question?.cluster, "cluster", id);
  if (!["Marketing", "Business Management & Administration", "Finance", "Hospitality & Tourism"].includes(cluster)) throw new Error(`Question ${id}: unsupported cluster ${cluster}.`);
  const correctAnswer = required(question?.correct, "correct answer", id);
  if (!["A", "B", "C", "D"].includes(correctAnswer)) throw new Error(`Question ${id}: correct answer must be A, B, C, or D.`);
  if (!["Easy", "Medium", "Hard"].includes(question?.difficulty)) throw new Error(`Question ${id}: invalid difficulty.`);
  const options = question?.options ?? {};
  const distractors = question?.distractor_rationales ?? {};
  return [
    id, cluster, required(question?.instructional_area, "instructional area", id), optional(question?.performance_indicator_focus), optional(question?.cognitive_level), question.difficulty, required(question?.stem, "stem", id),
    required(options.A, "option A", id), required(options.B, "option B", id), required(options.C, "option C", id), required(options.D, "option D", id), correctAnswer, optional(question?.rationale),
    optional(distractors.A), optional(distractors.B), optional(distractors.C), optional(distractors.D), optional(question?.concept_tag), optional(question?.source_status),
  ];
}

const bank = JSON.parse(await readFile(sourcePath, "utf8"));
if (!Array.isArray(bank.questions) || bank.questions.length !== 50_000) throw new Error("Expected exactly 50,000 master question records.");
if (bank.metadata?.total_records !== 50_000 || bank.metadata?.core_master_records !== 39_000 || bank.metadata?.hard_tier_records !== 11_000) throw new Error("Master-bank metadata does not match the expected 39,000 core plus 11,000 hard-tier structure.");
const rows = bank.questions.map(mapQuestion);
if (new Set(rows.map((row) => row[0])).size !== rows.length) throw new Error("Combined question identifiers must be unique.");
const coreRows = bank.questions.filter((question) => question.source_bank === "core_39000_master");
const hardRows = bank.questions.filter((question) => question.source_bank === "hard_11000_tier");
if (coreRows.length !== 39_000 || hardRows.length !== 11_000) throw new Error("Master bank must contain 39,000 core and 11,000 hard-tier records.");

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  await connection.query("CREATE TEMPORARY TABLE master_question_id_map (legacy_id varchar(50) PRIMARY KEY, combined_id varchar(70) NOT NULL)");
  const idMappings = coreRows.map((question) => [question.id, question.combined_id]);
  for (let offset = 0; offset < idMappings.length; offset += batchSize) await connection.query("INSERT INTO master_question_id_map (legacy_id, combined_id) VALUES ?", [idMappings.slice(offset, offset + batchSize)]);

  const [[currentCount]] = await connection.query("SELECT COUNT(*) AS count FROM questions");
  const [missingLiveReferences] = await connection.query(`
    SELECT refs.source, COUNT(*) AS count
    FROM (
      ${referenceTables.map(([table, column]) => `SELECT '${table}' AS source, \`${column}\` AS questionId FROM \`${table}\` WHERE \`${column}\` IS NOT NULL AND \`${column}\` NOT LIKE 'CORE::%' AND \`${column}\` NOT LIKE 'HARD::%'`).join(" UNION ALL ")}
    ) refs
    LEFT JOIN master_question_id_map m ON m.legacy_id = refs.questionId
    INNER JOIN questions q ON q.id = refs.questionId
    WHERE m.combined_id IS NULL
    GROUP BY refs.source
  `);
  if (missingLiveReferences.length) throw new Error(`Cannot replace the bank because live referenced questions are absent from the master core bank: ${JSON.stringify(missingLiveReferences)}`);
  const [staleReferenceCounts] = await connection.query(`
    SELECT refs.source, COUNT(*) AS count
    FROM (
      ${referenceTables.map(([table, column]) => `SELECT '${table}' AS source, \`${column}\` AS questionId FROM \`${table}\` WHERE \`${column}\` IS NOT NULL AND \`${column}\` NOT LIKE 'CORE::%' AND \`${column}\` NOT LIKE 'HARD::%'`).join(" UNION ALL ")}
    ) refs
    LEFT JOIN master_question_id_map m ON m.legacy_id = refs.questionId
    LEFT JOIN questions q ON q.id = refs.questionId
    WHERE m.combined_id IS NULL AND q.id IS NULL
    GROUP BY refs.source
  `);
  const [referenceCounts] = await connection.query(`
    SELECT refs.source, COUNT(*) AS count
    FROM (
      ${referenceTables.map(([table, column]) => `SELECT '${table}' AS source, \`${column}\` AS questionId FROM \`${table}\` WHERE \`${column}\` IS NOT NULL AND \`${column}\` NOT LIKE 'CORE::%' AND \`${column}\` NOT LIKE 'HARD::%'`).join(" UNION ALL ")}
    ) refs
    INNER JOIN master_question_id_map m ON m.legacy_id = refs.questionId
    GROUP BY refs.source
  `);
  const report = {
    sourcePath,
    currentQuestionCount: Number(currentCount.count),
    total: rows.length,
    coreRecords: coreRows.length,
    hardRecords: hardRows.length,
    referencedRowsToRemap: referenceCounts,
    staleOrphanedReferencesToRemove: staleReferenceCounts,
    mode: apply ? "apply" : "dry-run",
  };
  if (!apply) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    await connection.beginTransaction();
    try {
      await connection.query(`CREATE TABLE IF NOT EXISTS \`${backupTable}\` LIKE \`questions\``);
      const [[backupCount]] = await connection.query(`SELECT COUNT(*) AS count FROM \`${backupTable}\``);
      if (Number(backupCount.count) === 0) await connection.query(`INSERT INTO \`${backupTable}\` SELECT * FROM \`questions\``);
      for (const [table, column] of referenceTables) {
        await connection.query(`DELETE r FROM \`${table}\` r LEFT JOIN master_question_id_map m ON m.legacy_id = r.\`${column}\` LEFT JOIN questions q ON q.id = r.\`${column}\` WHERE r.\`${column}\` IS NOT NULL AND r.\`${column}\` NOT LIKE 'CORE::%' AND r.\`${column}\` NOT LIKE 'HARD::%' AND m.combined_id IS NULL AND q.id IS NULL`);
        await connection.query(`UPDATE \`${table}\` r INNER JOIN master_question_id_map m ON m.legacy_id = r.\`${column}\` SET r.\`${column}\` = m.combined_id WHERE r.\`${column}\` NOT LIKE 'CORE::%' AND r.\`${column}\` NOT LIKE 'HARD::%'`);
      }
      await connection.query("DELETE FROM questions");
      const insertSql = `INSERT INTO questions (${columns.map((column) => `\`${column}\``).join(", ")}) VALUES ?`;
      for (let offset = 0; offset < rows.length; offset += batchSize) await connection.query(insertSql, [rows.slice(offset, offset + batchSize)]);
      const [[verifiedTotal]] = await connection.query("SELECT COUNT(*) AS count FROM questions");
      const [verifiedDistribution] = await connection.query("SELECT cluster, difficulty, COUNT(*) AS count FROM questions GROUP BY cluster, difficulty ORDER BY cluster, difficulty");
      const [[orphanedReferences]] = await connection.query(`
        SELECT COUNT(*) AS count FROM (
          ${referenceTables.map(([table, column]) => `SELECT \`${column}\` AS questionId FROM \`${table}\` WHERE \`${column}\` IS NOT NULL`).join(" UNION ALL ")}
        ) refs LEFT JOIN questions q ON q.id = refs.questionId WHERE q.id IS NULL
      `);
      if (Number(verifiedTotal.count) !== 50_000) throw new Error(`Post-import expected 50,000 questions, found ${verifiedTotal.count}.`);
      if (Number(orphanedReferences.count) !== 0) throw new Error(`Post-import found ${orphanedReferences.count} orphaned historical references.`);
      await connection.commit();
      console.log(JSON.stringify({ ...report, backupTable, verifiedTotal: Number(verifiedTotal.count), verifiedDistribution, orphanedReferences: Number(orphanedReferences.count) }, null, 2));
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  }
} finally {
  await connection.end();
}
