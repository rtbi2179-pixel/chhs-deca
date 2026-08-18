import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { validateAndMapQuestionBank, type QuestionImportRow, type UploadedQuestionBank } from "../questionBankImport";

const SOURCE_PATH = "/home/ubuntu/upload/DECA_Cluster_Exam_39000_FIRE_FINAL(1).json";
const OUTPUT_DIRECTORY = "/home/ubuntu/question-bank-import";
const BATCH_SIZE = 250;
const columns = [
  "id", "cluster", "instructional_area", "performance_indicator_focus", "cognitive_level", "difficulty", "stem",
  "option_a", "option_b", "option_c", "option_d", "correct_answer", "rationale",
  "distractor_rationale_a", "distractor_rationale_b", "distractor_rationale_c", "distractor_rationale_d",
  "concept_tag", "source_status",
] as const;

function sqlValue(value: string | null): string {
  if (value === null) return "NULL";
  return `'${value.replaceAll("\\", "\\\\").replaceAll("'", "\\'").replaceAll("\u0000", "")}'`;
}

function tuple(row: QuestionImportRow): string {
  return [
    row.id, row.cluster, row.instructionalArea, row.performanceIndicatorFocus, row.cognitiveLevel, row.difficulty, row.stem,
    row.optionA, row.optionB, row.optionC, row.optionD, row.correctAnswer, row.rationale,
    row.distractorRationaleA, row.distractorRationaleB, row.distractorRationaleC, row.distractorRationaleD,
    row.conceptTag, row.sourceStatus,
  ].map(sqlValue).join(", ");
}

async function main() {
  const bank = JSON.parse(await readFile(SOURCE_PATH, "utf8")) as UploadedQuestionBank;
  const { rows, summary } = validateAndMapQuestionBank(bank);
  await mkdir(OUTPUT_DIRECTORY, { recursive: true });

  const updateAssignments = columns.slice(1).map((column) => `\`${column}\` = VALUES(\`${column}\`)`).join(", ");
  const filenames: string[] = [];
  for (let start = 0; start < rows.length; start += BATCH_SIZE) {
    const batch = rows.slice(start, start + BATCH_SIZE);
    const sql = `INSERT INTO \`questions\` (${columns.map((column) => `\`${column}\``).join(", ")}) VALUES\n${batch.map((row) => `(${tuple(row)})`).join(",\n")}\nON DUPLICATE KEY UPDATE ${updateAssignments};\n`;
    const filename = `questions-upsert-${String(start / BATCH_SIZE + 1).padStart(3, "0")}.sql`;
    await writeFile(path.join(OUTPUT_DIRECTORY, filename), sql);
    filenames.push(filename);
  }

  await writeFile(path.join(OUTPUT_DIRECTORY, "manifest.json"), JSON.stringify({
    source: SOURCE_PATH,
    generatedAt: new Date().toISOString(),
    batchSize: BATCH_SIZE,
    batches: filenames,
    summary,
  }, null, 2));
  console.log(JSON.stringify({ batches: filenames.length, summary }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
