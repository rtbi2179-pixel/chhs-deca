import fs from 'fs';
import mysql from 'mysql2/promise';

async function importQuestions() {
  // Read JSON file
  const jsonPath = '/home/ubuntu/upload/DECA_Cluster_Exam_39000_FINAL_AUDITED.json';
  console.log('Reading JSON file...');
  const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  const questions = jsonData.questions;
  console.log(`✓ Loaded ${questions.length} questions from JSON`);

  // Create database connection
  const dbUrl = process.env.DATABASE_URL;
  const url = new URL(dbUrl);
  const connection = await mysql.createConnection({
    host: url.hostname,
    port: url.port || 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
    ssl: { rejectUnauthorized: false },
    waitForConnections: true,
    connectionLimit: 1,
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
  const batchSize = 100;
  let imported = 0;
  let errors = 0;
  const startTime = Date.now();

  for (let i = 0; i < questions.length; i += batchSize) {
    const batch = questions.slice(i, Math.min(i + batchSize, questions.length));
    
    try {
      for (const question of batch) {
        const query = `
          INSERT INTO questions 
          (id, cluster, instructional_area, performance_indicator_focus, cognitive_level, difficulty, stem, option_a, option_b, option_c, option_d, correct_answer, rationale, distractor_rationale_a, distractor_rationale_b, distractor_rationale_c, distractor_rationale_d, concept_tag, source_status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const values = [
          question.id,
          question.cluster,
          question.instructional_area,
          question.performance_indicator_focus || null,
          question.cognitive_level || null,
          question.difficulty,
          question.stem,
          question.options.A,
          question.options.B,
          question.options.C,
          question.options.D,
          question.correct,
          question.rationale || null,
          question.distractor_rationales?.A || null,
          question.distractor_rationales?.B || null,
          question.distractor_rationales?.C || null,
          question.distractor_rationales?.D || null,
          question.concept_tag || null,
          question.source_status || null,
        ];

        await connection.execute(query, values);
        imported++;
      }

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const rate = (imported / (elapsed / 60)).toFixed(0);
      console.log(`Progress: ${imported}/${questions.length} (${(imported/questions.length*100).toFixed(1)}%) - ${rate} q/min - ${elapsed}s elapsed`);
    } catch (error) {
      console.error(`Error importing batch at ${i}:`, error.message);
      errors++;
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n✓ Import complete!`);
  console.log(`Total imported: ${imported}/${questions.length}`);
  console.log(`Errors: ${errors}`);
  console.log(`Time: ${totalTime}s`);

  await connection.end();
}

importQuestions().catch(console.error);
