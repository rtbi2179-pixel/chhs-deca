import { readFile } from "node:fs/promises";
import mysql from "mysql2/promise";

const sourcePath = "/home/ubuntu/upload/DECA_11000_HARD_QUESTIONS_ULTIMATE_FINAL.json";
const backupTable = "questions_backup_before_hard_20260821";
const batchSize = 250;
const apply = process.argv.includes("--apply");
const supportedClusters = new Set(["Marketing", "Business Management & Administration", "Finance", "Hospitality & Tourism"]);
const columns = [
  "id", "cluster", "instructional_area", "performance_indicator_focus", "cognitive_level", "difficulty", "stem",
  "option_a", "option_b", "option_c", "option_d", "correct_answer", "rationale",
  "distractor_rationale_a", "distractor_rationale_b", "distractor_rationale_c", "distractor_rationale_d",
  "concept_tag", "source_status",
];

function optional(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function required(value, label, id) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`Question ${id}: ${label} is required.`);
  return value.trim();
}

function mapQuestion(question) {
  const id = required(question?.id, "id", "unknown");
  const cluster = required(question?.cluster, "cluster", id);
  if (!supportedClusters.has(cluster)) throw new Error(`Question ${id}: unsupported cluster ${cluster}.`);
  const options = question?.options ?? {};
  const correct = required(question?.correct, "correct answer", id);
  if (!["A", "B", "C", "D"].includes(correct)) throw new Error(`Question ${id}: correct answer must be A, B, C, or D.`);
  if (question?.difficulty !== "Hard") throw new Error(`Question ${id}: expected Hard difficulty.`);
  const distractors = question?.distractor_rationales ?? {};
  return [
    id, cluster, required(question?.instructional_area, "instructional area", id), optional(question?.performance_indicator_focus), optional(question?.cognitive_level), "Hard", required(question?.stem, "stem", id),
    required(options.A, "option A", id), required(options.B, "option B", id), required(options.C, "option C", id), required(options.D, "option D", id), correct, optional(question?.rationale),
    optional(distractors.A), optional(distractors.B), optional(distractors.C), optional(distractors.D), optional(question?.concept_tag), optional(question?.source_status),
  ];
}

function comparable(row) {
  return JSON.stringify(row.map((value) => value ?? null));
}

const raw = JSON.parse(await readFile(sourcePath, "utf8"));
if (!Array.isArray(raw.questions) || raw.questions.length !== 11_000) throw new Error("Expected exactly 11,000 uploaded questions.");
const rows = raw.questions.map(mapQuestion);
const ids = rows.map((row) => row[0]);
if (new Set(ids).size !== rows.length) throw new Error("Uploaded question IDs are not unique.");

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  await connection.query("CREATE TEMPORARY TABLE imported_hard_question_ids (id varchar(50) PRIMARY KEY)");
  for (let offset = 0; offset < ids.length; offset += batchSize) {
    await connection.query("INSERT INTO imported_hard_question_ids (id) VALUES ?", [ids.slice(offset, offset + batchSize).map((id) => [id])]);
  }
  const [[existing]] = await connection.query("SELECT COUNT(*) AS count FROM questions q INNER JOIN imported_hard_question_ids i ON i.id = q.id");
  if (Number(existing.count) !== rows.length) throw new Error(`Expected all 11,000 IDs to exist in the live bank; found ${existing.count}.`);
  const [liveRows] = await connection.query(`SELECT ${columns.map((column) => `q.\`${column}\` AS \`${column}\``).join(", ")} FROM questions q INNER JOIN imported_hard_question_ids i ON i.id = q.id ORDER BY q.id`);
  const incomingById = new Map(rows.map((row) => [row[0], row]));
  let changed = 0;
  for (const live of liveRows) {
    const incoming = incomingById.get(live.id);
    const liveValues = columns.map((column) => live[column]);
    if (!incoming || comparable(incoming) !== comparable(liveValues)) changed += 1;
  }
  const clusterCounts = Object.fromEntries([...supportedClusters].map((cluster) => [cluster, rows.filter((row) => row[1] === cluster).length]));
  const report = { sourcePath, total: rows.length, existingIds: Number(existing.count), changedRows: changed, unchangedRows: rows.length - changed, clusters: clusterCounts, mode: apply ? "apply" : "dry-run" };
  if (!apply) {
    console.log(JSON.stringify(report, null, 2));
    process.exitCode = 0;
  } else {
    await connection.beginTransaction();
    try {
      await connection.query(`CREATE TABLE IF NOT EXISTS \`${backupTable}\` LIKE \`questions\``);
      await connection.query(`INSERT IGNORE INTO \`${backupTable}\` SELECT q.* FROM \`questions\` q INNER JOIN imported_hard_question_ids i ON i.id = q.id`);
      const assignments = columns.slice(1).map((column) => `\`${column}\` = VALUES(\`${column}\`)`).join(", ");
      const insertSql = `INSERT INTO \`questions\` (${columns.map((column) => `\`${column}\``).join(", ")}) VALUES ? ON DUPLICATE KEY UPDATE ${assignments}`;
      for (let offset = 0; offset < rows.length; offset += batchSize) await connection.query(insertSql, [rows.slice(offset, offset + batchSize)]);
      const [[verified]] = await connection.query("SELECT COUNT(*) AS count FROM questions q INNER JOIN imported_hard_question_ids i ON i.id = q.id WHERE q.difficulty = 'Hard'");
      if (Number(verified.count) !== rows.length) throw new Error(`Post-import verification found ${verified.count} hard questions, expected 11,000.`);
      await connection.commit();
      console.log(JSON.stringify({ ...report, backupTable, verifiedHardRows: Number(verified.count) }, null, 2));
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  }
} finally {
  await connection.end();
}
