import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL!);

console.log('Adding quiz content for all modules...');

// Correct section IDs from database
const modules = [
  { name: 'Finance', flashcardId: 60003, quickId: 60004, compId: 60005, scenarioId: 60006 },
  { name: 'Business Management', flashcardId: 60011, quickId: 60012, compId: 60013, scenarioId: 60014 },
  { name: 'Hospitality', flashcardId: 60019, quickId: 60020, compId: 60021, scenarioId: 60022 }
];

// Sample quiz questions
const quizQuestions = {
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
  
  const questions = quizQuestions[module.name as keyof typeof quizQuestions] || [];
  
  // Add quick-review questions
  for (const [q, opts, ans, exp] of questions) {
    await connection.execute(
      'INSERT INTO `piQuizQuestions` (`sectionId`, `question`, `options`, `correctAnswer`, `explanation`) VALUES (?, ?, ?, ?, ?)',
      [module.quickId, q, opts, ans, exp]
    );
  }
  console.log(`  ✓ ${questions.length} quick-review questions added`);
  
  // Add comprehensive questions
  for (const [q, opts, ans, exp] of questions) {
    await connection.execute(
      'INSERT INTO `piQuizQuestions` (`sectionId`, `question`, `options`, `correctAnswer`, `explanation`) VALUES (?, ?, ?, ?, ?)',
      [module.compId, q, opts, ans, exp]
    );
  }
  console.log(`  ✓ ${questions.length} comprehensive questions added`);
}

console.log('\n✅ All quiz questions added successfully!');
await connection.end();
