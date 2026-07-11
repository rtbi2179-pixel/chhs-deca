import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

async function seed() {
  try {
    // Parse connection string
    const url = new URL(DATABASE_URL);
    const connection = await mysql.createConnection({
      host: url.hostname,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      port: url.port || 3306,
      ssl: {},
    });

    // Sample school codes - CUSTOMIZE THESE FOR YOUR SCHOOLS
    const codes = [
      { code: 'CHHS2024', schoolName: 'Carmel High School' },
      { code: 'CHHS-DECA', schoolName: 'Carmel High School DECA Chapter' },
      { code: 'TEST001', schoolName: 'Test School' },
    ];

    console.log('Seeding school codes...');

    for (const code of codes) {
      try {
        await connection.execute(
          'INSERT INTO schoolCodes (code, schoolName, isActive) VALUES (?, ?, 1)',
          [code.code, code.schoolName]
        );
        console.log(`✓ Added: ${code.code} - ${code.schoolName}`);
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`⊘ Already exists: ${code.code}`);
        } else {
          console.error(`✗ Error adding ${code.code}:`, error.message);
        }
      }
    }

    console.log('Seed complete!');
    await connection.end();
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
