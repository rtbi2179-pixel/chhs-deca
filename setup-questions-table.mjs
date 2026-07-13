import mysql from 'mysql2/promise';

async function setupTable() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  // Parse connection string
  const url = new URL(dbUrl);
  const connection = await mysql.createConnection({
    host: url.hostname,
    port: url.port || 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('Dropping existing questions table...');
    await connection.query('DROP TABLE IF EXISTS questions');
    console.log('✓ Table dropped');

    console.log('Creating new questions table...');
    await connection.query(`
      CREATE TABLE questions (
        id VARCHAR(50) PRIMARY KEY,
        cluster VARCHAR(255) NOT NULL,
        instructional_area VARCHAR(255) NOT NULL,
        performance_indicator_focus VARCHAR(500),
        cognitive_level VARCHAR(100),
        difficulty VARCHAR(50) NOT NULL,
        stem LONGTEXT NOT NULL,
        option_a LONGTEXT NOT NULL,
        option_b LONGTEXT NOT NULL,
        option_c LONGTEXT NOT NULL,
        option_d LONGTEXT NOT NULL,
        correct_answer VARCHAR(1) NOT NULL,
        rationale LONGTEXT,
        distractor_rationale_a LONGTEXT,
        distractor_rationale_b LONGTEXT,
        distractor_rationale_c LONGTEXT,
        distractor_rationale_d LONGTEXT,
        concept_tag VARCHAR(255),
        source_status LONGTEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        INDEX idx_cluster (cluster),
        INDEX idx_difficulty (difficulty),
        INDEX idx_cognitive_level (cognitive_level)
      )
    `);
    console.log('✓ Table created successfully');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

setupTable();
