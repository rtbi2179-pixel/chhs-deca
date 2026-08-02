import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL!);

// Get the flashcards section ID (should be 30019 from previous insert)
const flashcardSectionId = 30019;
const quickReviewSectionId = 30020;
const comprehensiveSectionId = 30021;
const scenarioSectionId = 30022;

// Insert 20 flashcards
const flashcards = [
  ['What is market segmentation?', 'Dividing a market into smaller subsets with similar needs', 'fill_in_the_blank'],
  ['Name 4 segmentation bases', 'Demographic, Psychographic, Behavioral, Geographic', 'multiple_choice'],
  ['What is demographic segmentation?', 'Dividing by age, gender, income, education', 'fill_in_the_blank'],
  ['Define psychographic segmentation', 'Dividing by lifestyle, values, attitudes', 'fill_in_the_blank'],
  ['What is behavioral segmentation?', 'Dividing by purchase patterns and usage', 'fill_in_the_blank'],
  ['What is geographic segmentation?', 'Dividing by location and region', 'fill_in_the_blank'],
  ['What is a target market?', 'The specific segment a company chooses to serve', 'fill_in_the_blank'],
  ['Why segment markets?', 'To focus marketing, allocate resources, increase ROI', 'fill_in_the_blank'],
  ['What makes a segment viable?', 'Measurable, accessible, substantial, actionable', 'multiple_choice'],
  ['Define niche market', 'A smaller, specific segment within a larger market', 'fill_in_the_blank'],
  ['What is market positioning?', 'How a brand is perceived vs competitors', 'fill_in_the_blank'],
  ['How does segmentation help product development?', 'Develop products meeting specific segment needs', 'fill_in_the_blank'],
  ['What is market penetration?', 'Increasing sales within existing segment', 'fill_in_the_blank'],
  ['Describe a customer persona', 'Detailed profile of ideal customer', 'fill_in_the_blank'],
  ['Benefit of segmentation?', 'Improved marketing efficiency and targeting', 'fill_in_the_blank'],
  ['Segmentation vs targeting?', 'Segmentation divides market; targeting selects segments', 'fill_in_the_blank'],
  ['Example of demographic segmentation', 'Luxury cars to high-income professionals', 'fill_in_the_blank'],
  ['How does behavioral data help?', 'Identifies distinct customer groups by actions', 'fill_in_the_blank'],
  ['Benefit of psychographic data?', 'Reveals values and lifestyle for personalization', 'fill_in_the_blank'],
  ['How to select target segment?', 'Evaluate size, growth, profitability, advantage', 'fill_in_the_blank']
];

console.log('Inserting flashcards...');
for (const [question, answer, type] of flashcards) {
  await connection.execute(
    'INSERT INTO `piFlashcards` (`sectionId`, `question`, `answer`, `type`) VALUES (?, ?, ?, ?)',
    [flashcardSectionId, question, answer, type]
  );
}
console.log('✓ 20 flashcards inserted');

// Insert 10 quick-review questions
const quickReviewQuestions = [
  ['Which is NOT a segmentation base?', JSON.stringify(['Demographic', 'Psychographic', 'Temporal', 'Behavioral']), 'C', 'The four bases are demographic, psychographic, behavioral, and geographic.'],
  ['Segmentation helps with:', JSON.stringify(['Identifying customer groups', 'Targeting marketing', 'Allocating resources', 'All of above']), 'D', 'Segmentation helps with all these activities.'],
  ['A viable segment must be:', JSON.stringify(['Measurable, accessible, substantial, actionable', 'Large and profitable', 'Young and educated', 'Urban and digital']), 'A', 'These are the four criteria for viable segments.'],
  ['Psychographic focuses on:', JSON.stringify(['Income', 'Lifestyle', 'Location', 'Age']), 'B', 'Psychographic segmentation focuses on lifestyle and values.'],
  ['Targeting "health-conscious millennials" uses:', JSON.stringify(['Demographic only', 'Psychographic only', 'Both demographic and psychographic', 'Geographic only']), 'C', 'This requires both demographic (millennials) and psychographic (health-conscious).'],
  ['Main benefit of segmentation:', JSON.stringify(['Eliminate competition', 'Increase prices', 'Targeted marketing and efficiency', 'Simplify sales']), 'C', 'Segmentation enables targeted marketing and better resource allocation.'],
  ['Customer persona is:', JSON.stringify(['Real customer', 'Ideal customer profile', 'Marketing slogan', 'Product feature']), 'B', 'A persona is a detailed profile of an ideal customer.'],
  ['Market penetration means:', JSON.stringify(['Enter new market', 'Increase sales in existing segment', 'Launch new product', 'Reduce competition']), 'B', 'Market penetration increases sales within existing segments.'],
  ['Behavioral segmentation best for:', JSON.stringify(['Luxury hotels', 'Online retailers', 'Geographic regions', 'Demographics']), 'B', 'Behavioral segmentation uses purchase history, ideal for online retailers.'],
  ['Segmentation and positioning:', JSON.stringify(['Same thing', 'Segmentation identifies; positioning differentiates', 'Positioning first', 'Unrelated']), 'B', 'Segmentation divides market; positioning shows differentiation.']
];

console.log('Inserting quick-review questions...');
for (const [question, options, correctAnswer, explanation] of quickReviewQuestions) {
  await connection.execute(
    'INSERT INTO `piQuizQuestions` (`sectionId`, `question`, `options`, `correctAnswer`, `explanation`) VALUES (?, ?, ?, ?, ?)',
    [quickReviewSectionId, question, options, correctAnswer, explanation]
  );
}
console.log('✓ 10 quick-review questions inserted');

// Insert 15 comprehensive quiz questions
const comprehensiveQuestions = [
  ['Smartphone price-point segmentation is:', JSON.stringify(['Demographic', 'Psychographic', 'Behavioral', 'Price-based']), 'D', 'Price-point segmentation is a distinct approach.'],
  ['Purpose of segmentation:', JSON.stringify(['Eliminate competition', 'Increase prices', 'Target specific groups with tailored marketing', 'Reduce products']), 'C', 'Segmentation identifies and targets specific customer groups.'],
  ['Two distinct customer groups found. Next step:', JSON.stringify(['Ignore differences', 'Use identical messages', 'Develop tailored strategies for each', 'Eliminate one group']), 'C', 'Develop different strategies for each segment.'],
  ['Geographic segmentation most relevant for:', JSON.stringify(['Global software', 'Regional restaurants', 'Online e-commerce', 'Digital subscription']), 'B', 'Geographic segmentation suits location-based businesses.'],
  ['TRUE about segmentation:', JSON.stringify(['All segments equal', 'Guarantees success', 'Requires understanding customer needs', 'Eliminates marketing']), 'C', 'Effective segmentation requires deep customer understanding.'],
  ['Luxury brand targeting wealthy 30-50 year-olds:', JSON.stringify(['Psychographic', 'Behavioral', 'Demographic', 'Geographic']), 'C', 'Age and income are demographic variables.'],
  ['Advantage of multiple segmentation bases:', JSON.stringify(['Easier', 'Deeper customer understanding', 'Lower costs', 'No research needed']), 'B', 'Multiple bases provide richer insights.'],
  ['"Substantial" segment means:', JSON.stringify(['Easy to reach', 'Large enough to be profitable', 'Growing rapidly', 'Geographic']), 'B', 'Substantial means large enough to justify targeting.'],
  ['Example of psychographic segmentation:', JSON.stringify(['Age 18-24', 'Income $100k+', 'Environmentally conscious', 'Urban areas']), 'C', 'Environmental consciousness is a value/lifestyle trait.'],
  ['Customer purchase history indicates:', JSON.stringify(['Demographic', 'Behavioral', 'Psychographic', 'Geographic']), 'B', 'Purchase history is behavioral data.'],
  ['Risk of over-segmentation:', JSON.stringify(['Segments too large', 'Too expensive and complex', 'Segments similar', 'All profitable']), 'B', 'Over-segmentation increases costs and complexity.'],
  ['Streaming subscription tiers based on:', JSON.stringify(['Price sensitivity and needs', 'Age and education', 'Location', 'Employment']), 'A', 'Tiers target different price sensitivities and feature needs.'],
  ['B2B software segmentation by:', JSON.stringify(['Age and gender', 'Hobbies', 'Company size and industry', 'Location only']), 'C', 'B2B segments by company characteristics.'],
  ['"Actionable" segment means:', JSON.stringify(['Can be counted', 'Company can reach and serve it', 'Growing', 'Profitable']), 'B', 'Actionable means the company can actually serve it.'],
  ['After targeting segment:', JSON.stringify(['Never revisit', 'Continuously monitor and adjust', 'Assume forever', 'Ignore feedback']), 'B', 'Markets change; continuously monitor and adjust.']
];

console.log('Inserting comprehensive quiz questions...');
for (const [question, options, correctAnswer, explanation] of comprehensiveQuestions) {
  await connection.execute(
    'INSERT INTO `piQuizQuestions` (`sectionId`, `question`, `options`, `correctAnswer`, `explanation`) VALUES (?, ?, ?, ?, ?)',
    [comprehensiveSectionId, question, options, correctAnswer, explanation]
  );
}
console.log('✓ 15 comprehensive quiz questions inserted');

// Insert 3 scenario challenges
const scenarios = [
  ['SCENARIO 1: Athletic apparel company with plateaued sales. Segment the market and develop different marketing strategies for each segment. Consider demographic, psychographic, and behavioral factors.', 'medium', 'Identify segments: Professional athletes (premium, performance), Fitness enthusiasts (quality, trends), Casual gym-goers (budget, convenience), Outdoor enthusiasts (durability, adventure). Develop tailored value propositions, pricing, and marketing channels for each.'],
  ['SCENARIO 2: Regional coffee chain expanding to new city with three neighborhoods: Downtown business district, College campus, Suburban residential. Use geographic and demographic segmentation for market entry strategy.', 'hard', 'Downtown: Premium, quick-service; Campus: Affordable, social; Suburban: Family-friendly, convenient. Different product mixes, pricing, store designs, and marketing for each neighborhood.'],
  ['SCENARIO 3: Online retailer analysis shows 20% of customers generate 80% of revenue. These high-value customers are frequent, high-spend, loyal. Use behavioral segmentation to maximize value from this segment while growing others.', 'medium', 'Create VIP loyalty program for high-value segment; analyze what makes them loyal; replicate in other segments; develop campaigns to move mid-value toward high-value; identify and address barriers for low-value customers.']
];

console.log('Inserting scenario challenges...');
for (const [scenario, difficulty, expectedAnswer] of scenarios) {
  await connection.execute(
    'INSERT INTO `piScenarioChallenges` (`sectionId`, `scenario`, `difficulty`, `expectedAnswer`) VALUES (?, ?, ?, ?)',
    [scenarioSectionId, scenario, difficulty, expectedAnswer]
  );
}
console.log('✓ 3 scenario challenges inserted');

console.log('\n✅ All PI Learning Module content inserted successfully!');
await connection.end();
