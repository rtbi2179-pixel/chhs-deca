import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function importQuestions() {
  // Read JSON file
  const jsonPath = '/home/ubuntu/upload/DECA_Cluster_Exam_39000_FINAL_AUDITED.json';
  const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

  // Create database connection
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'blue_blazer',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  console.log('Connected to database');

  // Check if questions already exist
  const [existingQuestions] = await connection.query('SELECT COUNT(*) as count FROM questions');
  const existingCount = existingQuestions[0].count;
  console.log(`Existing questions in database: ${existingCount}`);

  if (existingCount > 0) {
    console.log('Questions already exist. Skipping import to avoid duplicates.');
    await connection.end();
    return;
  }

  // Prepare batch insert
  const batchSize = 500;
  let imported = 0;
  let errors = 0;

  for (let i = 0; i < jsonData.length; i += batchSize) {
    const batch = jsonData.slice(i, i + batchSize);
    
    try {
      for (const question of batch) {
        const query = `
          INSERT INTO questions 
          (id, cluster, instructional_area, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, difficulty)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE id=id
        `;
        
        const values = [
          question.id,
          question.cluster,
          question.instructional_area,
          question.stem,
          question.options.A,
          question.options.B,
          question.options.C,
          question.options.D,
          question.correct,
          question.rationale,
          question.difficulty,
        ];

        await connection.execute(query, values);
        imported++;
      }

      console.log(`Progress: ${imported}/${jsonData.length} questions imported`);
    } catch (error) {
      console.error(`Error importing batch at ${i}:`, error.message);
      errors++;
    }
  }

  console.log(`\nImport complete!`);
  console.log(`Total imported: ${imported}`);
  console.log(`Errors: ${errors}`);

  await connection.end();
}

importQuestions().catch(console.error);
