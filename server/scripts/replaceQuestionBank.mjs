import { readFile } from "node:fs/promises";
import mysql from "mysql2/promise";

const SOURCE_PATH = process.env.QUESTION_BANK_SOURCE ?? "/home/ubuntu/upload/DECA_Cluster_Exam_39000_FINAL_MASTER_RELEASE.json";
const BATCH_SIZE = 250;
const EXPECTED_CLUSTERS = [
  "Marketing",
  "Business Management & Administration",
  "Finance",
  "Hospitality & Tourism",
];

const COLUMNS = [
  "id", "cluster", "instructional_area", "performance_indicator_focus", "cognitive_level", "difficulty", "stem",
  "option_a", "option_b", "option_c", "option_d", "correct_answer", "rationale",
  "distractor_rationale_a", "distractor_rationale_b", "distractor_rationale_c", "distractor_rationale_d",
  "concept_tag", "source_status",
];

function required(value, label, id) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`Question ${id ?? "unknown"}: ${label} is required.`);
  return value.trim();
}

function optional(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function mapQuestion(question) {
  const id = required(question.id, "id");
  const cluster = required(question.cluster, "cluster", id);
  if (!EXPECTED_CLUSTERS.includes(cluster)) throw new Error(`Question ${id}: unsupported cluster ${cluster}.`);
  const difficulty = required(question.difficulty, "difficulty", id);
  if (!["Easy", "Medium", "Hard"].includes(difficulty)) throw new Error(`Question ${id}: unsupported difficulty ${difficulty}.`);
  const options = question.options ?? {};
  const correct = required(question.correct, "correct answer", id);
  if (!["A", "B", "C", "D"].includes(correct)) throw new Error(`Question ${id}: correct answer must be A, B, C, or D.`);
  const distractors = question.distractor_rationales ?? {};

  return [
    id, cluster, required(question.instructional_area, "instructional area", id), optional(question.performance_indicator_focus),
    optional(question.cognitive_level), difficulty, required(question.stem, "stem", id),
    required(options.A, "option A", id), required(options.B, "option B", id), required(options.C, "option C", id), required(options.D, "option D", id),
    correct, optional(question.rationale), optional(distractors.A), optional(distractors.B), optional(distractors.C), optional(distractors.D),
    optional(question.concept_tag), optional(question.source_status),
  ];
}

function validateBank(bank) {
  if (!Array.isArray(bank.questions) || bank.questions.length === 0) throw new Error("The source file does not contain a question array.");
  if (bank.metadata?.total_questions !== bank.questions.length) throw new Error(`Metadata declares ${bank.metadata?.total_questions} records; found ${bank.questions.length}.`);

  const ids = new Set();
  const clusterCounts = Object.fromEntries(EXPECTED_CLUSTERS.map((cluster) => [cluster, 0]));
  const rows = bank.questions.map((question) => {
    const row = mapQuestion(question);
    if (ids.has(row[0])) throw new Error(`Duplicate question id ${row[0]}.`);
    ids.add(row[0]);
    clusterCounts[row[1]] += 1;
    return row;
  });

  for (const cluster of EXPECTED_CLUSTERS) {
    if (clusterCounts[cluster] !== bank.metadata.questions_per_cluster?.[cluster]) {
      throw new Error(`${cluster} contains ${clusterCounts[cluster]} records; metadata expects ${bank.metadata.questions_per_cluster?.[cluster]}.`);
    }
  }

  return { rows, ids, clusterCounts };
}

async function readReferencedQuestionIds(connection) {
  const [rows] = await connection.query(`
    SELECT questionId AS id FROM userAnswers
    UNION SELECT questionId AS id FROM bookmarks
    UNION SELECT questionId AS id FROM sessionQuestions
    UNION SELECT questionId AS id FROM chapterExamActivity WHERE questionId IS NOT NULL
  `);
  return new Set(rows.map((row) => row.id));
}

async function main() {
  const apply = process.argv.includes("--apply");
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");

  const bank = JSON.parse(await readFile(SOURCE_PATH, "utf8"));
  const { rows, ids, clusterCounts } = validateBank(bank);
  const connection = await mysql.createConnection(process.env.DATABASE_URL);

  try {
    const [existingRows] = await connection.query("SELECT id FROM questions");
    const existingIds = new Set(existingRows.map((row) => row.id));
    const missingIds = [...ids].filter((id) => !existingIds.has(id));
    const staleIds = [...existingIds].filter((id) => !ids.has(id));
    const referencedIds = await readReferencedQuestionIds(connection);
    const referencedStaleIds = staleIds.filter((id) => referencedIds.has(id));

    const summary = {
      source: SOURCE_PATH,
      sourceQuestionCount: rows.length,
      sourceClusterCounts: clusterCounts,
      existingQuestionCount: existingIds.size,
      newQuestionIds: missingIds.length,
      staleQuestionIds: staleIds.length,
      referencedStaleQuestionIds: referencedStaleIds.length,
      mode: apply ? "apply" : "dry-run",
    };

    if (!apply) {
      console.log(JSON.stringify(summary, null, 2));
      return;
    }

    if (referencedStaleIds.length > 0) {
      throw new Error(`Replacement aborted: ${referencedStaleIds.length} current question IDs are referenced by member history but absent from the source file.`);
    }

    await connection.beginTransaction();
    try {
      const rowPlaceholders = `(${COLUMNS.map(() => "?").join(", ")})`;
      const updates = COLUMNS.slice(1).map((column) => `\`${column}\` = VALUES(\`${column}\`)`).join(", ");

      for (let offset = 0; offset < rows.length; offset += BATCH_SIZE) {
        const batch = rows.slice(offset, offset + BATCH_SIZE);
        const statement = `INSERT INTO \`questions\` (${COLUMNS.map((column) => `\`${column}\``).join(", ")}) VALUES ${batch.map(() => rowPlaceholders).join(", ")} ON DUPLICATE KEY UPDATE ${updates}`;
        await connection.query(statement, batch.flat());
      }

      if (staleIds.length > 0) {
        await connection.query(`DELETE FROM questions WHERE id IN (${staleIds.map(() => "?").join(", ")})`, staleIds);
      }

      const [postCountRows] = await connection.query("SELECT COUNT(*) AS count FROM questions");
      const [postClusterRows] = await connection.query("SELECT cluster, COUNT(*) AS count FROM questions GROUP BY cluster");
      const postClusters = Object.fromEntries(postClusterRows.map((row) => [row.cluster, Number(row.count)]));
      if (Number(postCountRows[0].count) !== rows.length) throw new Error(`Post-import count mismatch: expected ${rows.length}, found ${postCountRows[0].count}.`);
      for (const cluster of EXPECTED_CLUSTERS) {
        if (postClusters[cluster] !== clusterCounts[cluster]) throw new Error(`Post-import cluster mismatch for ${cluster}.`);
      }

      await connection.commit();
      console.log(JSON.stringify({ ...summary, imported: rows.length, postClusterCounts: postClusters }, null, 2));
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
