import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL!);

// Check table structure
const [structure] = await connection.execute('DESCRIBE piScenarioChallenges');
console.log('piScenarioChallenges structure:');
console.log(JSON.stringify(structure, null, 2));

// Check sample data
const [data] = await connection.execute('SELECT * FROM piScenarioChallenges LIMIT 1');
console.log('\nSample data:');
console.log(JSON.stringify(data, null, 2));

await connection.end();
