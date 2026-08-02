import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL!);

// Check quiz questions for Marketing module
const [questions] = await connection.execute(
  'SELECT pq.id, pq.sectionId, pq.question, ps.sectionType FROM piQuizQuestions pq JOIN piModuleSections ps ON pq.sectionId = ps.id WHERE ps.moduleId = 30003 LIMIT 10'
);

console.log('Marketing Module Quiz Questions:');
console.log(JSON.stringify(questions, null, 2));

// Check all sections for Marketing
const [sections] = await connection.execute(
  'SELECT id, moduleId, sectionType FROM piModuleSections WHERE moduleId = 30003'
);

console.log('\nMarketing Module Sections:');
console.log(JSON.stringify(sections, null, 2));

await connection.end();
