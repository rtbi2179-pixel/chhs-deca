import { readFile } from "node:fs/promises";
import mysql from "mysql2/promise";
import { validateAndMapQuestionBank, type QuestionImportRow, type UploadedQuestionBank } from "../questionBankImport";

const SOURCE_PATH = "/home/ubuntu/upload/DECA_Cluster_Exam_39000_FIRE_FINAL(1).json";
const BACKUP_TABLE = "questions_backup_before_deca_20260818";
const BATCH_SIZE = 250;
const columns = [
  "id", "cluster", "instructional_area", "performance_indicator_focus", "cognitive_level", "difficulty", "stem",
  "option_a", "option_b", "option_c", "option_d", "correct_answer", "rationale",
  "distractor_rationale_a", "distractor_rationale_b", "distractor_rationale_c", "distractor_rationale_d",
  "concept_tag", "source_status",
] as const;

function valuesFor(row: QuestionImportRow) {
  return [
    row.id, row.cluster, row.instructionalArea, row.performanceIndicatorFocus, row.cognitiveLevel, row.difficulty, row.stem,
    row.optionA, row.optionB, row.optionC, row.optionD, row.correctAnswer, row.rationale,
    row.distractorRationaleA, row.distractorRationaleB, row.distractorRationaleC, row.distractorRationaleD,
    row.conceptTag, row.sourceStatus,
  ];
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for the import.");
  const bank = JSON.parse(await readFile(SOURCE_PATH, "utf8")) as UploadedQuestionBank;
  const { rows, summary } = validateAndMapQuestionBank(bank);
  const connection = await mysql.createConnection(process.env.DATABASE_URL);

  try {
    const [[current]] = await connection.query<mysql.RowDataPacket[]>("SELECT COUNT(*) AS count FROM `questions`");
    const [[existingBackup]] = await connection.query<mysql.RowDataPacket[]>(`SELECT COUNT(*) AS count FROM \`${BACKUP_TABLE}\``).catch(async () => {
      await connection.query(`CREATE TABLE \`${BACKUP_TABLE}\` LIKE \`questions\``);
      return connection.query<mysql.RowDataPacket[]>(`SELECT COUNT(*) AS count FROM \`${BACKUP_TABLE}\``);
    });
    if (Number(existingBackup.count) === 0) {
      await connection.query(`INSERT INTO \`${BACKUP_TABLE}\` SELECT * FROM \`questions\``);
    }

    await connection.query("CREATE TEMPORARY TABLE source_question_ids (id varchar(50) PRIMARY KEY)");
    for (let start = 0; start < rows.length; start += BATCH_SIZE) {
      await connection.query("INSERT INTO source_question_ids (id) VALUES ?", [rows.slice(start, start + BATCH_SIZE).map((row) => [row.id])]);
    }
    const [[unexpected]] = await connection.query<mysql.RowDataPacket[]>(
      "SELECT COUNT(*) AS count FROM `questions` q LEFT JOIN source_question_ids s ON s.id = q.id WHERE s.id IS NULL",
    );
    if (Number(unexpected.count) !== 0) {
      throw new Error(`Aborting replacement: ${unexpected.count} existing question IDs are not represented by the validated source and may have historical references.`);
    }
    if (Number(current.count) !== rows.length) {
      throw new Error(`Aborting replacement: production has ${current.count} questions but the validated source has ${rows.length}.`);
    }

    const assignments = columns.slice(1).map((column) => `\`${column}\` = VALUES(\`${column}\`)`).join(", ");
    const insertSql = `INSERT INTO \`questions\` (${columns.map((column) => `\`${column}\``).join(", ")}) VALUES ? ON DUPLICATE KEY UPDATE ${assignments}`;
    await connection.beginTransaction();
    for (let start = 0; start < rows.length; start += BATCH_SIZE) {
      await connection.query(insertSql, [rows.slice(start, start + BATCH_SIZE).map(valuesFor)]);
    }
    await connection.commit();
    console.log(JSON.stringify({ backupTable: BACKUP_TABLE, replaced: summary }, null, 2));
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
