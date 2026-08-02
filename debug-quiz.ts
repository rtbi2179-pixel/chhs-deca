import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL!);

// Check quiz questions for section 30020
const [questions] = await connection.execute(
  'SELECT * FROM piQuizQuestions WHERE sectionId = 30020 LIMIT 3'
);

console.log('Quiz questions for section 30020:');
console.log(JSON.stringify(questions, null, 2));

// Check if the table structure is correct
const [structure] = await connection.execute('DESCRIBE piQuizQuestions');
console.log('\npiQuizQuestions structure:');
console.log(JSON.stringify(structure, null, 2));

await connection.end();
