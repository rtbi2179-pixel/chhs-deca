import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL!);

console.log('Adding PI modules for all clusters...');

// Insert Finance Module
const [financeResult] = await connection.execute(
  'INSERT INTO `piLearningModules` (`piId`, `cluster`, `instructionalArea`, `performanceIndicator`, `level`) VALUES (?, ?, ?, ?, ?)',
  ['FIN-FSA-001', 'Finance', 'Financial Analysis', 'Interpret and analyze financial statements to assess business performance', 'Intermediate']
);
const financeModuleId = (financeResult as any).insertId;
console.log('✓ Finance module inserted:', financeModuleId);

// Insert Business Management Module
const [bmResult] = await connection.execute(
  'INSERT INTO `piLearningModules` (`piId`, `cluster`, `instructionalArea`, `performanceIndicator`, `level`) VALUES (?, ?, ?, ?, ?)',
  ['BM-OPS-001', 'Business Management', 'Operations Management', 'Optimize business processes and operational efficiency', 'Intermediate']
);
const bmModuleId = (bmResult as any).insertId;
console.log('✓ Business Management module inserted:', bmModuleId);

// Insert Hospitality Module
const [hospResult] = await connection.execute(
  'INSERT INTO `piLearningModules` (`piId`, `cluster`, `instructionalArea`, `performanceIndicator`, `level`) VALUES (?, ?, ?, ?, ?)',
  ['HSP-CS-001', 'Hospitality', 'Customer Service', 'Deliver exceptional customer service experiences', 'Beginner']
);
const hospModuleId = (hospResult as any).insertId;
console.log('✓ Hospitality module inserted:', hospModuleId);

// Add sections for Finance
const financeSections = [
  [financeModuleId, 'theory', 'Financial Statement Analysis', 'The three primary statements: Income Statement, Balance Sheet, Cash Flow Statement...', 1],
  [financeModuleId, 'vocabulary', 'Financial Terms', '1. Revenue 2. Expense 3. Profit 4. Asset 5. Liability 6. Equity 7. Liquidity 8. Solvency 9. Ratio 10. Cash Flow', 2],
  [financeModuleId, 'flashcards', 'Finance Flashcards', 'Review financial concepts', 3],
  [financeModuleId, 'quiz', 'Quick-Review', 'Test knowledge', 4],
  [financeModuleId, 'quiz', 'Comprehensive', 'Mastery test', 5],
  [financeModuleId, 'scenario_challenge', 'Finance Scenarios', 'Apply skills', 6],
  [financeModuleId, 'theory', 'Related PIs', 'Common mistakes', 7],
  [financeModuleId, 'ai_coach_feedback', 'Teach-Back', 'Demonstrate mastery', 8]
];

for (const section of financeSections) {
  await connection.execute(
    'INSERT INTO `piModuleSections` (`moduleId`, `sectionType`, `title`, `content`, `order`) VALUES (?, ?, ?, ?, ?)',
    section as any
  );
}
console.log('✓ Finance sections added');

// Add sections for Business Management
const bmSections = [
  [bmModuleId, 'theory', 'Operations Management Fundamentals', 'Operations management focuses on efficiently managing resources and processes...', 1],
  [bmModuleId, 'vocabulary', 'Operations Terms', '1. Process 2. Efficiency 3. Quality 4. Supply Chain 5. Inventory 6. Lean 7. Six Sigma 8. Workflow 9. Optimization 10. Metrics', 2],
  [bmModuleId, 'flashcards', 'Operations Flashcards', 'Review operations concepts', 3],
  [bmModuleId, 'quiz', 'Quick-Review', 'Test knowledge', 4],
  [bmModuleId, 'quiz', 'Comprehensive', 'Mastery test', 5],
  [bmModuleId, 'scenario_challenge', 'Operations Scenarios', 'Apply skills', 6],
  [bmModuleId, 'theory', 'Related PIs', 'Common mistakes', 7],
  [bmModuleId, 'ai_coach_feedback', 'Teach-Back', 'Demonstrate mastery', 8]
];

for (const section of bmSections) {
  await connection.execute(
    'INSERT INTO `piModuleSections` (`moduleId`, `sectionType`, `title`, `content`, `order`) VALUES (?, ?, ?, ?, ?)',
    section as any
  );
}
console.log('✓ Business Management sections added');

// Add sections for Hospitality
const hospSections = [
  [hospModuleId, 'theory', 'Customer Service Excellence', 'Exceptional customer service is the foundation of the hospitality industry...', 1],
  [hospModuleId, 'vocabulary', 'Hospitality Terms', '1. Guest 2. Service 3. Hospitality 4. Satisfaction 5. Experience 6. Courtesy 7. Professionalism 8. Empathy 9. Resolution 10. Loyalty', 2],
  [hospModuleId, 'flashcards', 'Hospitality Flashcards', 'Review hospitality concepts', 3],
  [hospModuleId, 'quiz', 'Quick-Review', 'Test knowledge', 4],
  [hospModuleId, 'quiz', 'Comprehensive', 'Mastery test', 5],
  [hospModuleId, 'scenario_challenge', 'Service Scenarios', 'Apply skills', 6],
  [hospModuleId, 'theory', 'Related PIs', 'Common mistakes', 7],
  [hospModuleId, 'ai_coach_feedback', 'Teach-Back', 'Demonstrate mastery', 8]
];

for (const section of hospSections) {
  await connection.execute(
    'INSERT INTO `piModuleSections` (`moduleId`, `sectionType`, `title`, `content`, `order`) VALUES (?, ?, ?, ?, ?)',
    section as any
  );
}
console.log('✓ Hospitality sections added');

console.log('\n✅ All modules for all 4 clusters added successfully!');
await connection.end();
