import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL!);

const [columns] = await connection.execute('DESCRIBE piQuizQuestions');
console.log('piQuizQuestions columns:');
console.log(JSON.stringify(columns, null, 2));

await connection.end();
