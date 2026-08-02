import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL!);

const [rows] = await connection.execute(
  'SELECT m.id as moduleId, m.piId, m.performanceIndicator, s.id as sectionId, s.sectionType FROM piLearningModules m LEFT JOIN piModuleSections s ON m.id = s.moduleId ORDER BY m.id, s.order'
);

console.log('Module Sections:');
console.log(JSON.stringify(rows, null, 2));

await connection.end();
