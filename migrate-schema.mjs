import mysql from 'mysql2/promise';

async function migrateSchema() {
  const dbUrl = process.env.DATABASE_URL;
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
    console.log('Migrating bookmarks table...');
    await connection.query(`
      ALTER TABLE bookmarks 
      MODIFY COLUMN questionId VARCHAR(50) NOT NULL
    `);
    console.log('✓ bookmarks table updated');

    console.log('Migrating sessionQuestions table...');
    await connection.query(`
      ALTER TABLE sessionQuestions 
      MODIFY COLUMN questionId VARCHAR(50) NOT NULL
    `);
    console.log('✓ sessionQuestions table updated');

    console.log('\n✓ Migration complete!');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

migrateSchema();
