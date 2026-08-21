import { readFile, writeFile } from "node:fs/promises";
import mysql from "mysql2/promise";

const sourcePath = "/home/ubuntu/upload/DECA_11000_HARD_QUESTIONS_ULTIMATE_FINAL.json";
const outputPath = "/home/ubuntu/question-data-audit.json";

const bank = JSON.parse(await readFile(sourcePath, "utf8"));
const questions = Array.isArray(bank.questions) ? bank.questions : [];
const ids = new Set();
const stems = new Set();
const duplicateIds = [];
const duplicateStems = [];
const invalid = [];
const clusters = {};
const difficulties = {};
const formats = {};

for (const question of questions) {
  if (!question?.id || ids.has(question.id)) duplicateIds.push(question?.id ?? "missing");
  ids.add(question?.id);
  const stemKey = typeof question?.stem === "string" ? question.stem.trim().toLocaleLowerCase() : "";
  if (!stemKey || stems.has(stemKey)) duplicateStems.push(question?.id ?? "missing");
  stems.add(stemKey);
  const choices = question?.options ?? {};
  const requiredChoices = ["A", "B", "C", "D"];
  const issues = [];
  if (!question?.id || typeof question.id !== "string") issues.push("missing id");
  if (!question?.cluster || typeof question.cluster !== "string") issues.push("missing cluster");
  if (!question?.instructional_area || typeof question.instructional_area !== "string") issues.push("missing instructional area");
  if (!question?.stem || typeof question.stem !== "string") issues.push("missing stem");
  if (!requiredChoices.every((key) => typeof choices[key] === "string" && choices[key].trim())) issues.push("incomplete choices");
  if (!requiredChoices.includes(question?.correct)) issues.push("invalid correct answer");
  if (question?.difficulty !== "Hard") issues.push(`unexpected difficulty: ${String(question?.difficulty)}`);
  if (issues.length) invalid.push({ id: question?.id ?? "missing", issues });
  clusters[question?.cluster ?? "missing"] = (clusters[question?.cluster ?? "missing"] ?? 0) + 1;
  difficulties[question?.difficulty ?? "missing"] = (difficulties[question?.difficulty ?? "missing"] ?? 0) + 1;
  formats[question?.question_format ?? "missing"] = (formats[question?.question_format ?? "missing"] ?? 0) + 1;
}

let database = null;
let existing = { total: null, overlappingIds: null, byCluster: [] };
if (process.env.DATABASE_URL) {
  database = await mysql.createConnection(process.env.DATABASE_URL);
  const [[total]] = await database.query("SELECT COUNT(*) AS count FROM questions");
  const [byCluster] = await database.query("SELECT cluster, COUNT(*) AS count FROM questions GROUP BY cluster ORDER BY cluster");
  await database.query("CREATE TEMPORARY TABLE uploaded_hard_question_ids (id varchar(50) PRIMARY KEY)");
  const allIds = [...ids];
  for (let offset = 0; offset < allIds.length; offset += 500) {
    await database.query("INSERT INTO uploaded_hard_question_ids (id) VALUES ?", [allIds.slice(offset, offset + 500).map((id) => [id])]);
  }
  const [[overlap]] = await database.query("SELECT COUNT(*) AS count FROM questions q INNER JOIN uploaded_hard_question_ids u ON u.id = q.id");
  existing = { total: Number(total.count), overlappingIds: Number(overlap.count), byCluster };
  await database.end();
}

const audit = {
  sourcePath,
  metadata: bank.metadata ?? null,
  totalQuestions: questions.length,
  clusters,
  difficulties,
  formats,
  duplicateIdCount: duplicateIds.length,
  duplicateStemCount: duplicateStems.length,
  invalidCount: invalid.length,
  invalidSamples: invalid.slice(0, 20),
  duplicateIdSamples: duplicateIds.slice(0, 20),
  duplicateStemSamples: duplicateStems.slice(0, 20),
  existing,
};

await writeFile(outputPath, JSON.stringify(audit, null, 2));
console.log(JSON.stringify(audit, null, 2));
