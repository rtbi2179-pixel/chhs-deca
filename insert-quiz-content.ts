import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL!);

console.log('Adding quiz questions for all modules...');

// Section IDs for new modules (based on previous insert order)
// Finance: 60009 (flashcards), 60010 (quick), 60011 (comprehensive), 60012 (scenarios)
// BM: 60017 (flashcards), 60018 (quick), 60019 (comprehensive), 60020 (scenarios)
// Hosp: 60025 (flashcards), 60026 (quick), 60027 (comprehensive), 60028 (scenarios)

const modules = [
  { name: 'Finance', flashcardId: 60009, quickId: 60010, compId: 60011, scenarioId: 60012 },
  { name: 'Business Management', flashcardId: 60017, quickId: 60018, compId: 60019, scenarioId: 60020 },
  { name: 'Hospitality', flashcardId: 60025, quickId: 60026, compId: 60027, scenarioId: 60028 }
];

// Sample flashcards for each module
const flashcardSets = {
  Finance: [
    ['What are the three primary financial statements?', 'Income Statement, Balance Sheet, Cash Flow Statement', 'multiple_choice'],
    ['What does COGS stand for?', 'Cost of Goods Sold', 'fill_in_the_blank'],
    ['Define Net Income', 'Final profit after all expenses and taxes', 'fill_in_the_blank'],
    ['What is the accounting equation?', 'Assets = Liabilities + Equity', 'multiple_choice'],
    ['What does ROA measure?', 'How efficiently assets generate profit', 'fill_in_the_blank']
  ],
  'Business Management': [
    ['What is operations management?', 'Managing resources and processes efficiently', 'fill_in_the_blank'],
    ['Define lean manufacturing', 'Eliminating waste and improving efficiency', 'fill_in_the_blank'],
    ['What is Six Sigma?', 'A quality improvement methodology', 'multiple_choice'],
    ['What is supply chain management?', 'Managing flow of goods from supplier to customer', 'fill_in_the_blank'],
    ['Define workflow optimization', 'Improving process efficiency and speed', 'fill_in_the_blank']
  ],
  Hospitality: [
    ['What is customer service?', 'Meeting and exceeding guest expectations', 'fill_in_the_blank'],
    ['Define hospitality', 'Friendly and generous treatment of guests', 'fill_in_the_blank'],
    ['What is guest satisfaction?', 'Degree to which guest expectations are met', 'fill_in_the_blank'],
    ['What is service recovery?', 'Fixing problems and retaining unhappy customers', 'fill_in_the_blank'],
    ['Define empathy in service', 'Understanding and sharing guest feelings', 'fill_in_the_blank']
  ]
};

// Sample quiz questions for each module
const quizSets = {
  Finance: [
    ['Which statement shows profitability?', JSON.stringify(['Balance Sheet', 'Income Statement', 'Cash Flow', 'Equity']), 'B', 'Income Statement shows revenues and expenses.'],
    ['Current Ratio of 2.0 means:', JSON.stringify(['$2 assets per $1 liability', 'Insolvent', 'Poor liquidity', 'Too much debt']), 'A', 'Ratio of 2.0 indicates good liquidity.'],
    ['What does Profit Margin measure?', JSON.stringify(['Efficiency', 'Profitability', 'Liquidity', 'Leverage']), 'B', 'Profit Margin = Net Income / Revenue.'],
    ['High Debt-to-Equity means:', JSON.stringify(['Low risk', 'High leverage and risk', 'Profitable', 'Good liquidity']), 'B', 'High ratio indicates higher financial risk.'],
    ['Operating cash flow is:', JSON.stringify(['Cash from investing', 'Cash from normal operations', 'Cash from financing', 'Total cash']), 'B', 'Operating cash flow is from core business.']
  ],
  'Business Management': [
    ['What is the goal of operations management?', JSON.stringify(['Maximize profit', 'Minimize costs', 'Optimize efficiency and quality', 'Increase sales']), 'C', 'Ops management aims for efficiency and quality.'],
    ['Lean manufacturing focuses on:', JSON.stringify(['Quality only', 'Speed only', 'Eliminating waste', 'Automation']), 'C', 'Lean eliminates waste and improves efficiency.'],
    ['What does Six Sigma target?', JSON.stringify(['Cost reduction', 'Quality improvement', 'Speed', 'Customer satisfaction']), 'B', 'Six Sigma is a quality improvement methodology.'],
    ['Supply chain management includes:', JSON.stringify(['Only manufacturing', 'Supplier to customer flow', 'Only distribution', 'Only sales']), 'B', 'Supply chain spans from supplier to customer.'],
    ['Process optimization means:', JSON.stringify(['Making it faster', 'Making it cheaper', 'Improving efficiency and effectiveness', 'Reducing staff']), 'C', 'Optimization improves both efficiency and effectiveness.']
  ],
  Hospitality: [
    ['Exceptional customer service means:', JSON.stringify(['Being polite', 'Meeting expectations', 'Exceeding expectations', 'Being fast']), 'C', 'Exceptional service exceeds expectations.'],
    ['Guest satisfaction depends on:', JSON.stringify(['Price only', 'Meeting expectations', 'Staff friendliness', 'Location']), 'B', 'Satisfaction is about meeting expectations.'],
    ['Service recovery involves:', JSON.stringify(['Ignoring complaints', 'Fixing problems and retaining customers', 'Offering discounts', 'Apologizing only']), 'B', 'Service recovery fixes problems and retains guests.'],
    ['Empathy in hospitality means:', JSON.stringify(['Being nice', 'Understanding guest feelings', 'Smiling', 'Being efficient']), 'B', 'Empathy is understanding guest perspectives.'],
    ['Guest loyalty is built through:', JSON.stringify(['Low prices', 'Consistent excellent service', 'Marketing', 'Location']), 'B', 'Loyalty comes from consistent excellent service.']
  ]
};

for (const module of modules) {
  console.log(`\nProcessing ${module.name}...`);
  
  // Add flashcards
  const flashcards = flashcardSets[module.name as keyof typeof flashcardSets] || [];
  for (const [q, a, t] of flashcards) {
    await connection.execute(
      'INSERT INTO `piFlashcards` (`sectionId`, `question`, `answer`, `type`) VALUES (?, ?, ?, ?)',
      [module.flashcardId, q, a, t]
    );
  }
  console.log(`  ✓ ${flashcards.length} flashcards added`);
  
  // Add quick-review questions
  const quickQuestions = quizSets[module.name as keyof typeof quizSets] || [];
  for (const [q, opts, ans, exp] of quickQuestions) {
    await connection.execute(
      'INSERT INTO `piQuizQuestions` (`sectionId`, `question`, `options`, `correctAnswer`, `explanation`) VALUES (?, ?, ?, ?, ?)',
      [module.quickId, q, opts, ans, exp]
    );
  }
  console.log(`  ✓ ${quickQuestions.length} quick-review questions added`);
  
  // Add comprehensive questions (same as quick for now)
  for (const [q, opts, ans, exp] of quickQuestions) {
    await connection.execute(
      'INSERT INTO `piQuizQuestions` (`sectionId`, `question`, `options`, `correctAnswer`, `explanation`) VALUES (?, ?, ?, ?, ?)',
      [module.compId, q, opts, ans, exp]
    );
  }
  console.log(`  ✓ ${quickQuestions.length} comprehensive questions added`);
  
  // Add scenario challenge
  const scenario = `Real-world scenario for ${module.name}. Apply your knowledge to solve this business challenge.`;
  await connection.execute(
    'INSERT INTO `piScenarioChallenges` (`sectionId`, `scenario`, `difficulty`, `expectedAnswer`) VALUES (?, ?, ?, ?)',
    [module.scenarioId, scenario, 'medium', 'Provide a detailed analysis and solution.']
  );
  console.log(`  ✓ 1 scenario challenge added`);
}

console.log('\n✅ All quiz content added successfully!');
await connection.end();
