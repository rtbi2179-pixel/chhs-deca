import { readFile, writeFile } from "node:fs/promises";
import mysql from "mysql2/promise";

const sourcePath = "/home/ubuntu/upload/DECA_50000_MANUS_COMBINED_MASTER.json";
const outputPath = "/home/ubuntu/question-master-50000-audit.json";
const bank = JSON.parse(await readFile(sourcePath, "utf8"));
const questions = Array.isArray(bank.questions) ? bank.questions : [];
const requiredClusters = new Set(["Marketing", "Business Management & Administration", "Finance", "Hospitality & Tourism"]);
const combinedIds = new Set();
const rawIds = new Set();
const byRawId = new Map();
const clusters = {};
const difficulties = {};
const banks = {};
const invalid = [];

for (const question of questions) {
  const issues = [];
  if (typeof question?.combined_id !== "string" || !question.combined_id.trim()) issues.push("missing combined_id");
  if (combinedIds.has(question?.combined_id)) issues.push("duplicate combined_id");
  combinedIds.add(question?.combined_id);
  if (typeof question?.id !== "string" || !question.id.trim()) issues.push("missing raw id");
  rawIds.add(question?.id);
  if (!requiredClusters.has(question?.cluster)) issues.push(`unsupported cluster: ${String(question?.cluster)}`);
  if (!["Easy", "Medium", "Hard"].includes(question?.difficulty)) issues.push(`invalid difficulty: ${String(question?.difficulty)}`);
  if (!["A", "B", "C", "D"].includes(question?.correct)) issues.push("invalid correct answer");
  if (!["A", "B", "C", "D"].every((key) => typeof question?.options?.[key] === "string" && question.options[key].trim())) issues.push("incomplete answer choices");
  if (typeof question?.stem !== "string" || !question.stem.trim()) issues.push("missing stem");
  if (issues.length) invalid.push({ combinedId: question?.combined_id ?? "missing", issues });
  clusters[question?.cluster ?? "missing"] = (clusters[question?.cluster ?? "missing"] ?? 0) + 1;
  difficulties[question?.difficulty ?? "missing"] = (difficulties[question?.difficulty ?? "missing"] ?? 0) + 1;
  banks[question?.source_bank ?? "missing"] = (banks[question?.source_bank ?? "missing"] ?? 0) + 1;
  const variants = byRawId.get(question?.id) ?? [];
  variants.push(question);
  byRawId.set(question?.id, variants);
}

const duplicateRawIds = [...byRawId.entries()].filter(([, variants]) => variants.length > 1);
const crossBankVariantDifferences = duplicateRawIds.filter(([, variants]) => new Set(variants.map((question) => `${question.stem}\u0000${question.correct}\u0000${question.difficulty}`)).size > 1).length;
let referenceSummary = [];
let currentQuestionCount = null;
if (process.env.DATABASE_URL) {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const [[count]] = await connection.query("SELECT COUNT(*) AS count FROM questions");
  currentQuestionCount = Number(count.count);
  const [references] = await connection.query(`SELECT table_name AS tableName, column_name AS columnName
    FROM information_schema.columns
    WHERE table_schema = DATABASE() AND column_name IN ('questionId', 'question_id')
    ORDER BY table_name, column_name`);
  for (const reference of references) {
    const [[referenceCount]] = await connection.query(`SELECT COUNT(*) AS count FROM \`${reference.tableName}\` WHERE \`${reference.columnName}\` IS NOT NULL`);
    referenceSummary.push({ ...reference, referencedRows: Number(referenceCount.count) });
  }
  await connection.end();
}

const audit = {
  sourcePath,
  metadata: bank.metadata ?? null,
  totalRecords: questions.length,
  uniqueCombinedIds: combinedIds.size,
  uniqueRawIds: rawIds.size,
  duplicateRawIdCount: duplicateRawIds.length,
  crossBankVariantDifferences,
  clusters,
  difficulties,
  sourceBanks: banks,
  invalidCount: invalid.length,
  invalidSamples: invalid.slice(0, 20),
  currentQuestionCount,
  referenceSummary,
};
await writeFile(outputPath, JSON.stringify(audit, null, 2));
console.log(JSON.stringify(audit, null, 2));
