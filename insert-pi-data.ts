import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL!);

// Clear existing data
await connection.execute('DELETE FROM `userPiSectionProgress`');
await connection.execute('DELETE FROM `userPiProgress`');
await connection.execute('DELETE FROM `piScenarioChallenges`');
await connection.execute('DELETE FROM `piQuizQuestions`');
await connection.execute('DELETE FROM `piFlashcards`');
await connection.execute('DELETE FROM `piModuleSections`');
await connection.execute('DELETE FROM `piLearningModules`');

// Insert Marketing Module
const [moduleResult] = await connection.execute(
  'INSERT INTO `piLearningModules` (`piId`, `cluster`, `instructionalArea`, `performanceIndicator`, `level`) VALUES (?, ?, ?, ?, ?)',
  ['MKT-SEG-001', 'Marketing', 'Market Segmentation', 'Explain market segmentation and its importance in identifying target audiences', 'Intermediate']
);

const moduleId = (moduleResult as any).insertId;
console.log('Module inserted with ID:', moduleId);

// Insert sections
const sections = [
  [moduleId, 'theory', 'Market Segmentation Fundamentals', 'Market segmentation divides a large market into smaller subsets with similar needs and characteristics.', 1],
  [moduleId, 'vocabulary', 'Key Terms & Definitions', '1. Market Segmentation 2. Target Market 3. Demographic 4. Psychographic 5. Behavioral 6. Geographic 7. Niche Market 8. Positioning 9. Market Penetration 10. Customer Persona', 2],
  [moduleId, 'flashcards', 'Flashcard Review', 'Review key concepts about market segmentation', 3],
  [moduleId, 'quiz', 'Quick-Review Questions', 'Test your understanding of segmentation basics', 4],
  [moduleId, 'quiz', 'Comprehensive Quiz', 'Demonstrate mastery of all concepts', 5],
  [moduleId, 'scenario_challenge', 'Business Scenario Challenges', 'Apply your knowledge to real-world situations', 6],
  [moduleId, 'theory', 'Related PIs & Common Mistakes', 'Learn about related performance indicators and common pitfalls to avoid', 7],
  [moduleId, 'ai_coach_feedback', 'Teach-Back Activity & AI Coach', 'Demonstrate your mastery by teaching the concepts to others', 8]
];

for (const section of sections) {
  const [result] = await connection.execute(
    'INSERT INTO `piModuleSections` (`moduleId`, `sectionType`, `title`, `content`, `order`) VALUES (?, ?, ?, ?, ?)',
    section as any
  );
  console.log('Section inserted:', (result as any).insertId);
}

console.log('All data inserted successfully!');
await connection.end();
