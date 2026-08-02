import mysql from 'mysql2/promise';

const url = new URL(process.env.DATABASE_URL);
const conn = await mysql.createConnection({
  host: url.hostname, port: Number(url.port) || 3306,
  user: url.username, password: url.password,
  database: url.pathname.slice(1), ssl: { rejectUnauthorized: false }
});

console.log('Connected. Cleaning up and rebuilding PI data...');

// Step 1: Delete all existing PI data and start fresh
await conn.execute('DELETE FROM piScenarioChallenges');
await conn.execute('DELETE FROM piQuizQuestions');
await conn.execute('DELETE FROM piFlashcards');
await conn.execute('DELETE FROM piModuleSections');
await conn.execute('DELETE FROM piLearningModules');
console.log('Cleared all PI data.');

// Step 2: Insert 4 modules
const [mktResult] = await conn.execute(`
  INSERT INTO piLearningModules (piId, cluster, instructionalArea, performanceIndicator, level, createdAt, updatedAt)
  VALUES ('MKT-SEG-001', 'Marketing', 'Market Planning', 'Explain market segmentation and its importance in identifying target audiences', 'Intermediate', NOW(), NOW())
`);
const mktId = mktResult.insertId;

const [finResult] = await conn.execute(`
  INSERT INTO piLearningModules (piId, cluster, instructionalArea, performanceIndicator, level, createdAt, updatedAt)
  VALUES ('FIN-FSA-001', 'Finance', 'Financial Analysis', 'Interpret and analyze financial statements to assess business performance', 'Intermediate', NOW(), NOW())
`);
const finId = finResult.insertId;

const [bmResult] = await conn.execute(`
  INSERT INTO piLearningModules (piId, cluster, instructionalArea, performanceIndicator, level, createdAt, updatedAt)
  VALUES ('BM-OPS-001', 'Business Management', 'Operations Management', 'Optimize business processes and operational efficiency', 'Intermediate', NOW(), NOW())
`);
const bmId = bmResult.insertId;

const [hspResult] = await conn.execute(`
  INSERT INTO piLearningModules (piId, cluster, instructionalArea, performanceIndicator, level, createdAt, updatedAt)
  VALUES ('HSP-CS-001', 'Hospitality', 'Customer Relations', 'Deliver exceptional customer service experiences in hospitality settings', 'Beginner', NOW(), NOW())
`);
const hspId = hspResult.insertId;

console.log(`Inserted modules: Marketing=${mktId}, Finance=${finId}, Business=${bmId}, Hospitality=${hspId}`);

// Helper to insert a section and return its id
let sectionOrder = 0;
async function insertSection(moduleId, sectionType, title, content) {
  sectionOrder++;
  const [r] = await conn.execute(
    'INSERT INTO piModuleSections (moduleId, sectionType, title, content, `order`, createdAt) VALUES (?, ?, ?, ?, ?, NOW())',
    [moduleId, sectionType, title, content || '', sectionOrder]
  );
  return r.insertId;
}

// Helper to insert flashcards
async function insertFlashcards(sectionId, cards) {
  for (const c of cards) {
    await conn.execute(
      'INSERT INTO piFlashcards (sectionId, question, answer, type, createdAt) VALUES (?, ?, ?, ?, NOW())',
      [sectionId, c.q, c.a, 'basic']
    );
  }
}

// Helper to insert quiz questions
async function insertQuizQuestions(sectionId, questions) {
  for (const q of questions) {
    await conn.execute(
      'INSERT INTO piQuizQuestions (sectionId, question, options, correctAnswer, explanation, createdAt) VALUES (?, ?, ?, ?, ?, NOW())',
      [sectionId, q.question, JSON.stringify(q.options), q.correct, q.explanation || '']
    );
  }
}

// Helper to insert scenarios
async function insertScenarios(sectionId, scenarios) {
  for (const s of scenarios) {
    await conn.execute(
      'INSERT INTO piScenarioChallenges (sectionId, scenario, difficulty, expectedAnswer, createdAt) VALUES (?, ?, ?, ?, NOW())',
      [sectionId, s.scenario, s.difficulty, s.expected]
    );
  }
}

// ============================================================
// MARKETING MODULE - Market Segmentation
// ============================================================
const mktTheory = await insertSection(mktId, 'theory', 'Understanding Market Segmentation', `Market segmentation is the process of dividing a broad consumer or business market into sub-groups of consumers based on shared characteristics. It is a fundamental marketing strategy that allows businesses to tailor their products, services, and marketing messages to specific groups rather than trying to appeal to everyone at once.

There are four primary bases for segmentation: demographic (age, gender, income, education), geographic (location, climate, region), psychographic (lifestyle, values, personality), and behavioral (purchase habits, brand loyalty, usage rate). Each base provides a different lens through which to understand customers.

For a segment to be viable and worth targeting, it must meet four criteria: it must be measurable (you can quantify its size and purchasing power), accessible (you can reach it through marketing channels), substantial (it is large enough to be profitable), and actionable (you can develop effective programs to serve it).

In DECA competitions, understanding segmentation is critical because it underlies virtually every marketing decision — from product development to pricing to promotional strategy. A company that segments poorly wastes resources; one that segments well gains competitive advantage by serving customers better than rivals.`);

const mktVocab = await insertSection(mktId, 'vocabulary', 'Market Segmentation Vocabulary', `Market Segmentation: The process of dividing a market into distinct groups of buyers with different needs, characteristics, or behaviors
Target Market: A specific group of consumers at whom a company aims its products and services
Demographics: Statistical data relating to the population and particular groups within it (age, gender, income, education)
Psychographics: The study of consumers based on their activities, interests, and opinions (lifestyle, values, personality)
Geographic Segmentation: Dividing a market based on location such as country, region, city, or climate
Behavioral Segmentation: Dividing consumers based on their knowledge, attitudes, uses, or responses to a product
Market Niche: A small, specialized segment of the market that has specific needs not being fully addressed
Positioning: The process of establishing the image or identity of a brand in the minds of customers
Undifferentiated Marketing: A strategy that targets the whole market with one offer (mass marketing)
Differentiated Marketing: A strategy that targets several market segments and designs separate offers for each`);

const mktFlashcards = await insertSection(mktId, 'flashcards', 'Market Segmentation Flashcards', '');
await insertFlashcards(mktFlashcards, [
  { q: 'What is market segmentation?', a: 'The process of dividing a broad market into distinct sub-groups of consumers with shared characteristics' },
  { q: 'What are the four bases of market segmentation?', a: 'Demographic, Geographic, Psychographic, and Behavioral' },
  { q: 'What does demographic segmentation include?', a: 'Age, gender, income, education, family size, occupation, and ethnicity' },
  { q: 'What is psychographic segmentation?', a: 'Dividing consumers based on lifestyle, values, personality, and social class' },
  { q: 'What is behavioral segmentation?', a: 'Dividing consumers based on purchase behavior, usage rate, brand loyalty, and benefits sought' },
  { q: 'What are the four criteria for a viable market segment?', a: 'Measurable, Accessible, Substantial, and Actionable' },
  { q: 'What is a target market?', a: 'A specific group of consumers at whom a company aims its products and marketing efforts' },
  { q: 'What is undifferentiated marketing?', a: 'A strategy that targets the entire market with a single offer (mass marketing)' },
  { q: 'What is differentiated marketing?', a: 'A strategy targeting multiple segments with separate offers tailored to each' },
  { q: 'What is concentrated marketing?', a: 'Focusing all marketing efforts on one specific market segment' },
  { q: 'What is micromarketing?', a: 'Tailoring products and marketing to the needs of specific individuals or local customer groups' },
  { q: 'What is market positioning?', a: 'Establishing the image or identity of a brand in the minds of the target market' },
  { q: 'What is a market niche?', a: 'A small, specialized segment with specific needs not fully addressed by mainstream providers' },
  { q: 'What is geographic segmentation?', a: 'Dividing a market based on location — country, region, city, climate, or population density' },
  { q: 'Why do companies segment markets?', a: 'To allocate resources efficiently, tailor messaging, and serve customer needs better than competitors' },
  { q: 'What is the difference between a segment and a niche?', a: 'A segment is a larger group; a niche is a narrower, more specialized sub-segment' },
  { q: 'What is benefit segmentation?', a: 'Grouping consumers based on the specific benefits they seek from a product' },
  { q: 'What is usage rate segmentation?', a: 'Dividing consumers into light, medium, and heavy users of a product' },
  { q: 'What is the 80/20 rule in segmentation?', a: '80% of a company\'s sales often come from 20% of its customers (heavy users)' },
  { q: 'What is a buyer persona?', a: 'A semi-fictional representation of an ideal customer based on market research and real data' },
]);

const mktQuiz = await insertSection(mktId, 'quiz', 'Market Segmentation Quiz', '');
await insertQuizQuestions(mktQuiz, [
  { question: 'Which of the following is NOT one of the four primary bases of market segmentation?', options: ['A) Demographic', 'B) Psychographic', 'C) Temporal', 'D) Behavioral'], correct: 'C', explanation: 'The four bases are Demographic, Geographic, Psychographic, and Behavioral. Temporal is not a standard segmentation base.' },
  { question: 'A company divides its market by age, income, and education level. This is an example of:', options: ['A) Geographic segmentation', 'B) Demographic segmentation', 'C) Psychographic segmentation', 'D) Behavioral segmentation'], correct: 'B', explanation: 'Age, income, and education are demographic variables — measurable population statistics.' },
  { question: 'For a market segment to be worth targeting, it must be measurable, accessible, substantial, and:', options: ['A) Profitable', 'B) Actionable', 'C) Competitive', 'D) Diverse'], correct: 'B', explanation: 'The four criteria for a viable segment are Measurable, Accessible, Substantial, and Actionable.' },
  { question: 'A sports apparel company targets athletes who value performance over price. This is an example of:', options: ['A) Geographic segmentation', 'B) Demographic segmentation', 'C) Psychographic segmentation', 'D) Behavioral segmentation'], correct: 'C', explanation: 'Targeting based on values and lifestyle is psychographic segmentation.' },
  { question: 'Which marketing strategy targets the entire market with a single offer?', options: ['A) Differentiated marketing', 'B) Concentrated marketing', 'C) Undifferentiated marketing', 'D) Micromarketing'], correct: 'C', explanation: 'Undifferentiated (mass) marketing ignores segment differences and targets the whole market with one offer.' },
  { question: 'A company that focuses all its marketing resources on one specific segment is using:', options: ['A) Undifferentiated marketing', 'B) Differentiated marketing', 'C) Concentrated marketing', 'D) Micromarketing'], correct: 'C', explanation: 'Concentrated marketing focuses on a single segment, allowing a company to achieve a strong market position in that niche.' },
  { question: 'Grouping consumers by their purchase frequency (light, medium, heavy users) is an example of:', options: ['A) Demographic segmentation', 'B) Psychographic segmentation', 'C) Geographic segmentation', 'D) Behavioral segmentation'], correct: 'D', explanation: 'Usage rate is a behavioral variable — it relates to how consumers interact with the product.' },
  { question: 'The 80/20 rule in marketing suggests that:', options: ['A) 80% of customers are unprofitable', 'B) 80% of sales come from 20% of customers', 'C) 80% of the market is demographic', 'D) 20% of products generate 80% of complaints'], correct: 'B', explanation: 'The Pareto Principle (80/20 rule) states that roughly 80% of effects come from 20% of causes — in marketing, 80% of sales often come from the top 20% of customers.' },
  { question: 'A retailer opens stores only in urban areas with populations over 500,000. This is:', options: ['A) Demographic segmentation', 'B) Psychographic segmentation', 'C) Geographic segmentation', 'D) Behavioral segmentation'], correct: 'C', explanation: 'Targeting based on population size and location is geographic segmentation.' },
  { question: 'Which of the following best describes a market niche?', options: ['A) A broad segment with millions of potential customers', 'B) A small, specialized segment with specific unmet needs', 'C) The total addressable market for a product', 'D) A segment defined only by demographics'], correct: 'B', explanation: 'A niche is a narrowly defined segment with specific needs that are not well-served by mainstream providers.' },
  { question: 'A company creates three different product lines for teens, adults, and seniors. This is:', options: ['A) Undifferentiated marketing', 'B) Concentrated marketing', 'C) Differentiated marketing', 'D) Micromarketing'], correct: 'C', explanation: 'Differentiated marketing targets multiple segments with separate offers tailored to each group.' },
  { question: 'Which segmentation variable would a company use if it wants to target consumers who prioritize eco-friendly products?', options: ['A) Demographic', 'B) Geographic', 'C) Psychographic', 'D) Behavioral'], correct: 'C', explanation: 'Values and environmental attitudes are psychographic variables — they relate to lifestyle and beliefs.' },
  { question: 'What is the primary benefit of market segmentation for a business?', options: ['A) It eliminates the need for market research', 'B) It allows for more efficient resource allocation and targeted marketing', 'C) It guarantees higher profit margins', 'D) It reduces the number of competitors in the market'], correct: 'B', explanation: 'Segmentation allows businesses to focus resources on the most promising groups and tailor messages for maximum effectiveness.' },
  { question: 'A company segments its market by dividing customers into those who have never bought, first-time buyers, and repeat buyers. This is:', options: ['A) Demographic segmentation', 'B) Geographic segmentation', 'C) Psychographic segmentation', 'D) Behavioral segmentation'], correct: 'D', explanation: 'Segmenting by purchase history and loyalty status is behavioral segmentation.' },
  { question: 'Which of the following is the BEST example of micromarketing?', options: ['A) A national TV ad campaign targeting all adults', 'B) A loyalty program for all customers', 'C) Personalized product recommendations based on individual purchase history', 'D) Offering two product lines for men and women'], correct: 'C', explanation: 'Micromarketing tailors products and marketing to individual customers or very small local groups — personalized recommendations are a prime example.' },
]);

const mktScenarios = await insertSection(mktId, 'scenario_challenge', 'Market Segmentation Scenarios', '');
await insertScenarios(mktScenarios, [
  { scenario: 'You are a marketing manager for a new energy drink brand. Your research shows that the total market includes casual drinkers, college students, professional athletes, and office workers. Your budget is limited. Explain how you would use market segmentation to choose your primary target market, and justify your decision using the four criteria for a viable segment.', difficulty: 'medium', expected: 'Identify college students or professional athletes as primary segment; apply measurable (quantifiable size), accessible (reachable via social media/gyms), substantial (large enough to be profitable), and actionable (can design effective campaigns) criteria to justify the choice.' },
  { scenario: 'A luxury hotel chain wants to expand into a new city. They have identified three potential segments: business travelers, leisure tourists, and local event hosts. Using psychographic and behavioral segmentation, describe how the hotel should differentiate its marketing approach for each segment.', difficulty: 'hard', expected: 'Business travelers: value efficiency, loyalty programs, fast Wi-Fi, meeting rooms — target via LinkedIn/corporate channels. Leisure tourists: value experience, amenities, Instagram-worthy spaces — target via travel influencers. Local event hosts: value capacity, catering, AV equipment — target via event planning networks.' },
  { scenario: 'A small organic food company currently uses undifferentiated marketing. Sales are flat. A consultant recommends switching to differentiated marketing. Explain what this means, describe two distinct segments the company could target, and outline the risks of this strategy change.', difficulty: 'easy', expected: 'Undifferentiated = one message for all; differentiated = separate offers for each segment. Two segments could be health-conscious millennials (value sustainability) and parents seeking healthy kids\' food (value safety/nutrition). Risks include higher costs, brand dilution, and resource strain.' },
]);

const mktRelated = await insertSection(mktId, 'examples', 'Related PIs & Common Mistakes', `Related Performance Indicators:
- MKT-SEG-002: Identify market segments for a given product
- MKT-POS-001: Develop a positioning strategy for a target market
- MKT-MIX-001: Explain the marketing mix (4 Ps)
- MKT-RES-001: Conduct market research to identify customer needs

Common Mistakes in DECA Competitions:
1. Confusing segmentation bases — psychographic is about values/lifestyle, NOT demographics like age
2. Forgetting that a segment must meet ALL four criteria (measurable, accessible, substantial, actionable)
3. Mixing up undifferentiated vs. concentrated marketing — concentrated focuses on ONE segment, undifferentiated ignores segments entirely
4. Claiming a segment is viable without evidence of its size or reachability
5. Treating "target market" and "market segment" as identical — a target market is the segment you choose to pursue`);

const mktTeachBack = await insertSection(mktId, 'ai_coach_feedback', 'Teach-Back Activity', `Explain market segmentation as if you were teaching it to a new DECA member. Your explanation should cover:
1. What market segmentation is and why businesses use it
2. The four bases of segmentation with a real-world example for each
3. The four criteria that make a segment worth targeting
4. The difference between undifferentiated, differentiated, and concentrated marketing strategies`);

console.log(`Marketing module complete: theory=${mktTheory}, vocab=${mktVocab}, flashcards=${mktFlashcards}, quiz=${mktQuiz}, scenarios=${mktScenarios}`);

// ============================================================
// FINANCE MODULE - Financial Statement Analysis
// ============================================================
const finTheory = await insertSection(finId, 'theory', 'Financial Statement Analysis', `Financial statement analysis is the process of reviewing and evaluating a company's financial statements to make better economic decisions. The three core financial statements are the income statement (profit & loss), the balance sheet, and the cash flow statement. Together, they provide a complete picture of a company's financial health.

The income statement shows revenues, expenses, and profit over a period. Key metrics include gross profit margin (gross profit / revenue), operating profit margin, and net profit margin. A healthy company typically shows consistent revenue growth with stable or improving margins.

The balance sheet is a snapshot of assets, liabilities, and equity at a specific point in time. The fundamental equation is: Assets = Liabilities + Equity. Key ratios include the current ratio (current assets / current liabilities, ideally > 2:1) and the debt-to-equity ratio (total debt / total equity).

The cash flow statement tracks actual cash inflows and outflows across three activities: operating (core business), investing (buying/selling assets), and financing (debt and equity transactions). A company can be profitable on paper but still fail if it runs out of cash — this is why cash flow analysis is critical.

In DECA, financial analysis questions test your ability to calculate and interpret these ratios, identify financial strengths and weaknesses, and make recommendations based on the data.`);

const finVocab = await insertSection(finId, 'vocabulary', 'Financial Analysis Vocabulary', `Income Statement: A financial report showing revenues, expenses, and profit or loss over a specific period
Balance Sheet: A financial snapshot showing assets, liabilities, and equity at a specific point in time
Cash Flow Statement: A report tracking actual cash inflows and outflows from operating, investing, and financing activities
Gross Profit Margin: (Gross Profit / Revenue) × 100 — measures profitability after cost of goods sold
Current Ratio: Current Assets / Current Liabilities — measures short-term liquidity (ideal: > 2:1)
Debt-to-Equity Ratio: Total Debt / Total Equity — measures financial leverage and risk
Return on Equity (ROE): Net Income / Shareholders' Equity — measures how efficiently equity generates profit
Liquidity: A company's ability to meet short-term financial obligations
Solvency: A company's ability to meet long-term financial obligations
Working Capital: Current Assets minus Current Liabilities — the net liquid assets available for operations`);

const finFlashcards = await insertSection(finId, 'flashcards', 'Financial Analysis Flashcards', '');
await insertFlashcards(finFlashcards, [
  { q: 'What are the three core financial statements?', a: 'Income Statement, Balance Sheet, and Cash Flow Statement' },
  { q: 'What does the income statement show?', a: 'Revenues, expenses, and net profit or loss over a specific period' },
  { q: 'What is the balance sheet equation?', a: 'Assets = Liabilities + Equity' },
  { q: 'What does the cash flow statement track?', a: 'Actual cash inflows and outflows from operating, investing, and financing activities' },
  { q: 'How do you calculate gross profit margin?', a: '(Gross Profit / Revenue) × 100' },
  { q: 'What is the current ratio formula?', a: 'Current Assets / Current Liabilities' },
  { q: 'What does a current ratio above 2:1 indicate?', a: 'The company has strong short-term liquidity — it can cover its short-term debts twice over' },
  { q: 'What is the debt-to-equity ratio?', a: 'Total Debt / Total Equity — measures financial leverage' },
  { q: 'What is Return on Equity (ROE)?', a: 'Net Income / Shareholders\' Equity — measures how efficiently the company generates profit from equity' },
  { q: 'What is working capital?', a: 'Current Assets minus Current Liabilities — the net liquid assets available for day-to-day operations' },
  { q: 'What is the difference between liquidity and solvency?', a: 'Liquidity is the ability to meet short-term obligations; solvency is the ability to meet long-term obligations' },
  { q: 'What does a negative cash flow from operations indicate?', a: 'The company is spending more cash than it generates from its core business — a warning sign' },
  { q: 'What is EBITDA?', a: 'Earnings Before Interest, Taxes, Depreciation, and Amortization — a measure of core operating profitability' },
  { q: 'What is the quick ratio?', a: '(Current Assets - Inventory) / Current Liabilities — a stricter measure of liquidity' },
  { q: 'What does a high debt-to-equity ratio indicate?', a: 'The company is heavily financed by debt, which increases financial risk' },
  { q: 'What is net profit margin?', a: '(Net Income / Revenue) × 100 — the percentage of revenue that becomes profit after all expenses' },
  { q: 'What is accounts receivable?', a: 'Money owed to the company by customers who have purchased on credit' },
  { q: 'What is accounts payable?', a: 'Money the company owes to suppliers for goods or services received but not yet paid for' },
  { q: 'What is depreciation?', a: 'The gradual reduction in the value of a fixed asset over its useful life' },
  { q: 'Why can a profitable company still fail?', a: 'Because profitability is measured on an accrual basis, but a company needs actual cash to pay bills — poor cash flow management can cause failure even when profits look good' },
]);

const finQuiz = await insertSection(finId, 'quiz', 'Financial Analysis Quiz', '');
await insertQuizQuestions(finQuiz, [
  { question: 'A company has current assets of $500,000 and current liabilities of $200,000. What is its current ratio?', options: ['A) 0.4', 'B) 2.0', 'C) 2.5', 'D) 5.0'], correct: 'C', explanation: 'Current Ratio = Current Assets / Current Liabilities = $500,000 / $200,000 = 2.5' },
  { question: 'Which financial statement shows a company\'s financial position at a specific point in time?', options: ['A) Income Statement', 'B) Cash Flow Statement', 'C) Balance Sheet', 'D) Statement of Retained Earnings'], correct: 'C', explanation: 'The balance sheet is a snapshot of assets, liabilities, and equity at a specific date.' },
  { question: 'A company has revenue of $1,000,000 and cost of goods sold of $600,000. What is its gross profit margin?', options: ['A) 40%', 'B) 60%', 'C) 16.7%', 'D) 6%'], correct: 'A', explanation: 'Gross Profit = $1,000,000 - $600,000 = $400,000. Gross Profit Margin = $400,000 / $1,000,000 = 40%' },
  { question: 'The balance sheet equation states that:', options: ['A) Revenue = Expenses + Profit', 'B) Assets = Liabilities + Equity', 'C) Cash = Assets - Liabilities', 'D) Equity = Assets + Liabilities'], correct: 'B', explanation: 'The fundamental accounting equation is Assets = Liabilities + Equity.' },
  { question: 'Which section of the cash flow statement shows cash from selling equipment?', options: ['A) Operating Activities', 'B) Financing Activities', 'C) Investing Activities', 'D) Capital Activities'], correct: 'C', explanation: 'Buying and selling long-term assets like equipment falls under Investing Activities.' },
  { question: 'A company has a debt-to-equity ratio of 3.0. This indicates:', options: ['A) The company has more equity than debt', 'B) The company is heavily financed by debt, increasing risk', 'C) The company has excellent liquidity', 'D) The company is highly profitable'], correct: 'B', explanation: 'A high D/E ratio means the company relies heavily on borrowed money, which increases financial risk.' },
  { question: 'Which of the following is the BEST indicator of a company\'s ability to pay short-term debts?', options: ['A) Net profit margin', 'B) Return on equity', 'C) Current ratio', 'D) Debt-to-equity ratio'], correct: 'C', explanation: 'The current ratio measures short-term liquidity — the ability to cover current liabilities with current assets.' },
  { question: 'A company reports net income of $200,000 on revenue of $2,000,000. What is its net profit margin?', options: ['A) 10%', 'B) 20%', 'C) 40%', 'D) 1%'], correct: 'A', explanation: 'Net Profit Margin = Net Income / Revenue = $200,000 / $2,000,000 = 10%' },
  { question: 'EBITDA is used to measure:', options: ['A) A company\'s total assets', 'B) Core operating profitability before non-cash and financing charges', 'C) The company\'s cash on hand', 'D) Total shareholder returns'], correct: 'B', explanation: 'EBITDA (Earnings Before Interest, Taxes, Depreciation, and Amortization) strips out non-operating items to show core operating performance.' },
  { question: 'A company shows strong net income but negative cash flow from operations. This most likely means:', options: ['A) The company is growing rapidly', 'B) Revenue recognition is outpacing actual cash collection', 'C) The company has no debt', 'D) The company is highly liquid'], correct: 'B', explanation: 'Accrual accounting can show profit before cash is received. Negative operating cash flow with positive net income often signals collection problems.' },
  { question: 'Working capital is calculated as:', options: ['A) Total Assets - Total Liabilities', 'B) Current Assets - Current Liabilities', 'C) Revenue - Operating Expenses', 'D) Net Income + Depreciation'], correct: 'B', explanation: 'Working Capital = Current Assets - Current Liabilities. It represents the net liquid assets available for operations.' },
  { question: 'Which financial ratio measures how efficiently a company generates profit from shareholders\' equity?', options: ['A) Current Ratio', 'B) Debt-to-Equity Ratio', 'C) Return on Equity (ROE)', 'D) Gross Profit Margin'], correct: 'C', explanation: 'ROE = Net Income / Shareholders\' Equity. It shows how much profit is generated for each dollar of equity invested.' },
  { question: 'Depreciation appears on which financial statements?', options: ['A) Income Statement only', 'B) Balance Sheet only', 'C) Income Statement and Cash Flow Statement', 'D) Income Statement, Balance Sheet, and Cash Flow Statement'], correct: 'D', explanation: 'Depreciation reduces asset value on the balance sheet, is an expense on the income statement, and is added back in the operating section of the cash flow statement.' },
  { question: 'A quick ratio of 0.8 indicates:', options: ['A) The company has excellent liquidity', 'B) The company may struggle to meet short-term obligations without selling inventory', 'C) The company is highly profitable', 'D) The company has no short-term debt'], correct: 'B', explanation: 'A quick ratio below 1.0 means the company cannot cover its current liabilities with its most liquid assets (excluding inventory).' },
  { question: 'Which of the following would INCREASE a company\'s current ratio?', options: ['A) Taking on a long-term bank loan and using proceeds to pay off current liabilities', 'B) Purchasing inventory on credit', 'C) Paying dividends to shareholders', 'D) Buying equipment with cash'], correct: 'A', explanation: 'Using long-term debt proceeds to pay current liabilities reduces current liabilities without reducing current assets, increasing the current ratio.' },
]);

const finScenarios = await insertSection(finId, 'scenario_challenge', 'Financial Analysis Scenarios', '');
await insertScenarios(finScenarios, [
  { scenario: 'You are a financial analyst reviewing two competing retail companies. Company A has a current ratio of 1.2 and a net profit margin of 15%. Company B has a current ratio of 3.5 and a net profit margin of 8%. A client wants to invest in the more financially healthy company. Which would you recommend and why? Consider both liquidity and profitability in your analysis.', difficulty: 'hard', expected: 'Neither is clearly superior — it depends on the investment goal. Company A is more profitable but has liquidity risk (current ratio barely above 1). Company B is very liquid but less profitable. A well-rounded answer acknowledges both dimensions and asks about the client\'s risk tolerance and investment horizon.' },
  { scenario: 'A startup shows $500,000 in net income for its first year but is running out of cash. The CEO is confused — "We\'re profitable, why are we broke?" Explain this paradox using financial statement concepts, and recommend what the CEO should monitor going forward.', difficulty: 'medium', expected: 'Profitability (income statement) uses accrual accounting — revenue is recorded when earned, not when cash is received. The company may have large accounts receivable or capital expenditures. The CEO should monitor the cash flow statement, specifically operating cash flow, and manage accounts receivable collection aggressively.' },
  { scenario: 'A manufacturing company has the following data: Revenue $2M, COGS $1.2M, Operating Expenses $400K, Net Income $200K, Current Assets $800K, Current Liabilities $400K, Total Debt $600K, Total Equity $400K. Calculate the gross profit margin, net profit margin, current ratio, and debt-to-equity ratio. Then assess the company\'s financial health.', difficulty: 'hard', expected: 'Gross Profit Margin = 40%, Net Profit Margin = 10%, Current Ratio = 2.0 (healthy), D/E Ratio = 1.5 (moderately leveraged). Overall: solid profitability and good liquidity, but the D/E ratio warrants monitoring — the company relies more on debt than equity financing.' },
]);

const finRelated = await insertSection(finId, 'examples', 'Related PIs & Common Mistakes', `Related Performance Indicators:
- FIN-FSA-002: Calculate and interpret financial ratios
- FIN-BUD-001: Develop and manage budgets
- FIN-INV-001: Evaluate investment opportunities
- FIN-ACC-001: Apply accounting principles to business decisions

Common Mistakes in DECA Competitions:
1. Confusing the income statement (period) with the balance sheet (point in time)
2. Forgetting that cash flow ≠ profit — a profitable company can still be cash-poor
3. Misidentifying which cash flow section an activity belongs to (operating vs. investing vs. financing)
4. Using the wrong formula for ratios — memorize: Current Ratio = CA/CL, not the reverse
5. Failing to interpret what a ratio means in context — a high current ratio isn't always good (may signal idle assets)`);

const finTeachBack = await insertSection(finId, 'ai_coach_feedback', 'Teach-Back Activity', `Explain financial statement analysis as if presenting to a small business owner who has never studied accounting. Your explanation should cover:
1. The purpose of each of the three financial statements
2. Two key ratios and what they tell you about a business
3. Why a profitable business can still fail (the cash flow paradox)
4. One specific recommendation for how a business owner should use financial statements to make better decisions`);

console.log(`Finance module complete.`);

// ============================================================
// BUSINESS MANAGEMENT MODULE - Operations Management
// ============================================================
const bmTheory = await insertSection(bmId, 'theory', 'Operations Management', `Operations management is the administration of business practices to create the highest level of efficiency possible within an organization. It involves converting materials and labor into goods and services as efficiently as possible to maximize profit. It encompasses planning, organizing, and supervising processes, and making necessary improvements for higher profitability.

Key areas of operations management include supply chain management (coordinating the flow of goods from suppliers to customers), quality management (ensuring products meet standards), capacity planning (matching production capacity to demand), and process improvement (eliminating waste and inefficiencies).

Lean management, derived from Toyota's production system, focuses on eliminating waste (called "muda") in seven categories: overproduction, waiting, transportation, over-processing, inventory, motion, and defects. Six Sigma is a complementary methodology that uses statistical tools to reduce defects to fewer than 3.4 per million opportunities.

In DECA competitions, operations questions often involve analyzing a business scenario, identifying inefficiencies, and recommending improvements. Understanding the trade-offs between cost, quality, speed, and flexibility is essential for competitive success.`);

const bmVocab = await insertSection(bmId, 'vocabulary', 'Operations Management Vocabulary', `Supply Chain Management: Coordinating and overseeing the flow of goods, information, and finances from raw materials to end customer
Lean Management: A methodology focused on eliminating waste and maximizing value in all business processes
Six Sigma: A data-driven methodology for eliminating defects, aiming for fewer than 3.4 defects per million opportunities
Capacity Planning: Determining the production capacity needed to meet changing demands for products
Just-In-Time (JIT): An inventory strategy where materials are ordered and received only as needed for production
Key Performance Indicator (KPI): A measurable value that demonstrates how effectively a company is achieving key objectives
Process Improvement: Systematic approach to identifying and eliminating inefficiencies in business processes
Quality Control: Procedures used to ensure that a manufactured product adheres to defined quality criteria
Bottleneck: A point of congestion in a production system that limits overall throughput
Outsourcing: Contracting out a business function to a third-party provider rather than performing it in-house`);

const bmFlashcards = await insertSection(bmId, 'flashcards', 'Operations Management Flashcards', '');
await insertFlashcards(bmFlashcards, [
  { q: 'What is operations management?', a: 'The administration of business practices to maximize efficiency in converting inputs (materials, labor) into outputs (goods, services)' },
  { q: 'What are the seven wastes in Lean management?', a: 'Overproduction, Waiting, Transportation, Over-processing, Inventory, Motion, and Defects (TIMWOOD)' },
  { q: 'What is Six Sigma\'s defect target?', a: 'Fewer than 3.4 defects per million opportunities' },
  { q: 'What is Just-In-Time (JIT) inventory?', a: 'An inventory strategy where materials are ordered and received only as they are needed for production' },
  { q: 'What is a bottleneck in operations?', a: 'A constraint in a production process that limits the overall throughput or output rate' },
  { q: 'What is supply chain management?', a: 'Coordinating the flow of goods, information, and finances from raw materials through production to the end customer' },
  { q: 'What is capacity planning?', a: 'Determining the production capacity needed to meet current and future demand for products or services' },
  { q: 'What is a KPI?', a: 'Key Performance Indicator — a measurable value showing how effectively a company achieves key business objectives' },
  { q: 'What is outsourcing?', a: 'Contracting a business function to an external third-party provider rather than performing it in-house' },
  { q: 'What is quality control?', a: 'Procedures used to ensure products or services meet defined quality standards before reaching the customer' },
  { q: 'What is the difference between efficiency and effectiveness?', a: 'Efficiency is doing things right (minimizing waste); effectiveness is doing the right things (achieving goals)' },
  { q: 'What is process mapping?', a: 'A visual representation of the steps in a business process, used to identify inefficiencies and improvement opportunities' },
  { q: 'What is vertical integration?', a: 'A strategy where a company controls multiple stages of its supply chain, from raw materials to retail' },
  { q: 'What is economies of scale?', a: 'Cost advantages gained by increasing production volume — the more you produce, the lower the per-unit cost' },
  { q: 'What is Total Quality Management (TQM)?', a: 'A management approach focused on continuous improvement of quality across all organizational processes and functions' },
  { q: 'What is a Gantt chart?', a: 'A bar chart that illustrates a project schedule, showing start/end dates for each task' },
  { q: 'What is the critical path in project management?', a: 'The longest sequence of dependent tasks that determines the minimum project duration' },
  { q: 'What is benchmarking?', a: 'Comparing a company\'s processes and performance metrics to industry best practices or competitors' },
  { q: 'What is a service level agreement (SLA)?', a: 'A contract defining the expected level of service between a provider and customer, including performance metrics' },
  { q: 'What is continuous improvement (Kaizen)?', a: 'A Japanese philosophy of making small, incremental improvements to processes on an ongoing basis' },
]);

const bmQuiz = await insertSection(bmId, 'quiz', 'Operations Management Quiz', '');
await insertQuizQuestions(bmQuiz, [
  { question: 'Which of the following is NOT one of the seven wastes in Lean management?', options: ['A) Overproduction', 'B) Innovation', 'C) Waiting', 'D) Defects'], correct: 'B', explanation: 'The seven Lean wastes (TIMWOOD) are: Transportation, Inventory, Motion, Waiting, Overproduction, Over-processing, Defects. Innovation is not a waste.' },
  { question: 'A factory produces 1,000 units per hour but its packaging line can only handle 600 units per hour. The packaging line is a:', options: ['A) KPI', 'B) Bottleneck', 'C) Benchmark', 'D) Process map'], correct: 'B', explanation: 'A bottleneck is any constraint that limits the overall throughput of a system.' },
  { question: 'Six Sigma aims to reduce defects to fewer than:', options: ['A) 1 per thousand', 'B) 3.4 per million', 'C) 10 per hundred', 'D) 0.1 per billion'], correct: 'B', explanation: 'Six Sigma\'s goal is fewer than 3.4 defects per million opportunities, representing 99.99966% quality.' },
  { question: 'A company orders raw materials only when a production order is received, keeping no inventory. This is:', options: ['A) Six Sigma', 'B) Total Quality Management', 'C) Just-In-Time inventory', 'D) Benchmarking'], correct: 'C', explanation: 'Just-In-Time (JIT) is an inventory strategy that minimizes inventory by ordering materials only as needed.' },
  { question: 'Which of the following best describes supply chain management?', options: ['A) Managing employee performance reviews', 'B) Coordinating the flow of goods from raw materials to end customer', 'C) Setting financial budgets for operations', 'D) Designing marketing campaigns'], correct: 'B', explanation: 'Supply chain management oversees the entire flow of goods, information, and finances from suppliers to customers.' },
  { question: 'A company compares its customer service response times to the industry leader. This is an example of:', options: ['A) Outsourcing', 'B) Capacity planning', 'C) Benchmarking', 'D) Process mapping'], correct: 'C', explanation: 'Benchmarking is comparing your performance metrics to industry best practices or top competitors.' },
  { question: 'Economies of scale means that as production volume increases:', options: ['A) Per-unit costs increase', 'B) Per-unit costs decrease', 'C) Quality decreases', 'D) Lead times increase'], correct: 'B', explanation: 'Economies of scale occur when increasing production volume leads to lower per-unit costs due to spreading fixed costs over more units.' },
  { question: 'A company decides to hire an external firm to handle its IT support rather than maintaining an in-house team. This is:', options: ['A) Vertical integration', 'B) Outsourcing', 'C) Benchmarking', 'D) Lean management'], correct: 'B', explanation: 'Outsourcing is contracting a business function to an external third-party provider.' },
  { question: 'Total Quality Management (TQM) focuses on:', options: ['A) Maximizing production speed at all costs', 'B) Continuous improvement of quality across all organizational processes', 'C) Reducing the workforce to cut costs', 'D) Outsourcing non-core functions'], correct: 'B', explanation: 'TQM is a management philosophy centered on continuous quality improvement involving all employees and processes.' },
  { question: 'The critical path in project management determines:', options: ['A) The most expensive tasks in a project', 'B) The minimum time needed to complete the project', 'C) The tasks that can be outsourced', 'D) The quality standards for deliverables'], correct: 'B', explanation: 'The critical path is the longest sequence of dependent tasks — it determines the minimum project duration.' },
  { question: 'Kaizen is a Japanese term for:', options: ['A) Just-In-Time inventory', 'B) Six Sigma methodology', 'C) Continuous improvement through small, incremental changes', 'D) Total Quality Management'], correct: 'C', explanation: 'Kaizen means "change for better" in Japanese and refers to the philosophy of making small, continuous improvements.' },
  { question: 'A company that owns its own farms, processing plants, and retail stores is practicing:', options: ['A) Outsourcing', 'B) Benchmarking', 'C) Vertical integration', 'D) Lean management'], correct: 'C', explanation: 'Vertical integration means controlling multiple stages of the supply chain, from raw materials to retail.' },
  { question: 'Which tool would a project manager use to visually display the timeline of project tasks?', options: ['A) Balance sheet', 'B) Gantt chart', 'C) SWOT analysis', 'D) Process map'], correct: 'B', explanation: 'A Gantt chart is a bar chart showing project tasks, their durations, and start/end dates on a timeline.' },
  { question: 'A service level agreement (SLA) primarily defines:', options: ['A) Employee compensation packages', 'B) Expected service performance standards between provider and customer', 'C) Product pricing strategies', 'D) Marketing campaign objectives'], correct: 'B', explanation: 'An SLA is a contract specifying the expected level of service, including performance metrics and remedies for non-compliance.' },
  { question: 'Which of the following is the BEST example of process improvement?', options: ['A) Hiring more employees to handle increased workload', 'B) Analyzing a workflow to eliminate unnecessary steps and reduce cycle time', 'C) Increasing the advertising budget', 'D) Expanding into new markets'], correct: 'B', explanation: 'Process improvement involves systematically analyzing and redesigning workflows to eliminate waste and increase efficiency.' },
]);

const bmScenarios = await insertSection(bmId, 'scenario_challenge', 'Operations Management Scenarios', '');
await insertScenarios(bmScenarios, [
  { scenario: 'You are an operations consultant for a restaurant chain. The owner complains that customers wait 25 minutes for food during lunch rush, but the kitchen is idle for 40% of the day. Using Lean management principles, identify at least two types of waste present and recommend specific improvements to reduce wait times without hiring additional staff.', difficulty: 'medium', expected: 'Waste types: Waiting (customers waiting), Uneven demand/capacity mismatch. Improvements: Implement a prep schedule aligned with peak hours (capacity planning), create a standardized "rush menu" with fewer options to reduce complexity, use a visual order management system to eliminate motion waste, and cross-train staff to eliminate bottlenecks at specific stations.' },
  { scenario: 'A manufacturing company has a defect rate of 5% on its main product line, costing $200,000 per year in rework and returns. The operations manager proposes implementing Six Sigma. The CEO asks: "Is this worth the $50,000 implementation cost?" Provide a quantitative and qualitative analysis to support or oppose the investment.', difficulty: 'hard', expected: 'Quantitative: If Six Sigma reduces defects by 80%, annual savings = $160,000, ROI in under 4 months. Qualitative benefits: improved customer satisfaction, reduced warranty claims, stronger brand reputation. Recommendation: Yes, the investment is justified — the payback period is less than one year and long-term benefits compound.' },
  { scenario: 'A tech startup is deciding whether to build its own customer support team or outsource to a call center. The in-house option costs $300K/year but gives full control. Outsourcing costs $150K/year but the vendor has mixed reviews. What factors should the company consider, and what would you recommend?', difficulty: 'easy', expected: 'Factors: cost ($150K savings), quality control (mixed reviews = risk), brand alignment, scalability, data security, and strategic focus. Recommendation depends on stage: early-stage startups should likely outsource to conserve capital, but should negotiate strict SLAs and monitor quality closely. As the company scales, transitioning in-house may make sense.' },
]);

const bmRelated = await insertSection(bmId, 'examples', 'Related PIs & Common Mistakes', `Related Performance Indicators:
- BM-OPS-002: Apply project management techniques to business problems
- BM-OPS-003: Analyze supply chain strategies and their trade-offs
- BM-MAN-001: Describe management styles and their effectiveness
- BM-STR-001: Develop a strategic plan for a business

Common Mistakes in DECA Competitions:
1. Confusing efficiency (doing things right) with effectiveness (doing the right things)
2. Forgetting that JIT reduces inventory costs but increases supply chain risk
3. Misidentifying bottlenecks — the bottleneck is the SLOWEST step, not the most expensive
4. Treating outsourcing as always cost-effective — hidden costs (coordination, quality control) can erode savings
5. Overlooking the human element in process improvement — employee buy-in is critical for Lean/Six Sigma success`);

const bmTeachBack = await insertSection(bmId, 'ai_coach_feedback', 'Teach-Back Activity', `Explain operations management to a new business owner who is struggling with inefficiency. Your explanation should cover:
1. What operations management is and why it matters for profitability
2. One specific Lean waste you would look for in a retail store and how you would eliminate it
3. The difference between efficiency and effectiveness with a real example
4. How you would use KPIs to measure operational performance`);

console.log(`Business Management module complete.`);

// ============================================================
// HOSPITALITY MODULE - Customer Service
// ============================================================
const hspTheory = await insertSection(hspId, 'theory', 'Customer Service Excellence', `Customer service in hospitality is the cornerstone of business success. Unlike manufacturing industries where quality is embedded in a product, hospitality businesses deliver experiences — and experiences are created in real-time interactions between staff and guests. A single negative interaction can undo dozens of positive ones.

The service quality model (SERVQUAL) identifies five dimensions of service quality: Reliability (delivering promised service dependably), Assurance (knowledge and courtesy that inspire trust), Tangibles (physical facilities and appearance), Empathy (caring, individualized attention), and Responsiveness (willingness to help promptly). The acronym RATER helps remember these dimensions.

Service recovery — how a business responds when something goes wrong — is often more important than the original service. Research shows that customers who experience a problem that is resolved excellently often become more loyal than customers who never had a problem. This is the "service recovery paradox."

The Net Promoter Score (NPS) is a widely used metric that asks customers: "How likely are you to recommend us to a friend?" on a 0-10 scale. Promoters (9-10) are loyal enthusiasts; Passives (7-8) are satisfied but unenthusiastic; Detractors (0-6) are unhappy customers who can damage the brand. NPS = % Promoters - % Detractors.`);

const hspVocab = await insertSection(hspId, 'vocabulary', 'Customer Service Vocabulary', `SERVQUAL: A service quality model measuring five dimensions: Reliability, Assurance, Tangibles, Empathy, and Responsiveness
Service Recovery: The process of resolving a service failure and restoring customer satisfaction
Net Promoter Score (NPS): A metric measuring customer loyalty based on likelihood to recommend (NPS = % Promoters - % Detractors)
Customer Lifetime Value (CLV): The total revenue a business can expect from a single customer over their entire relationship
Empathy: Understanding and sharing the feelings of another person — a critical skill in hospitality service
Upselling: Encouraging customers to purchase a higher-end product or add-ons to increase the transaction value
Cross-selling: Recommending complementary products or services to a customer making a purchase
Moment of Truth: Any interaction between a customer and a business that can influence the customer's perception
Guest Experience: The overall impression a guest has from all touchpoints during their visit
Service Blueprint: A diagram that visualizes the service process, showing customer actions, staff actions, and support processes`);

const hspFlashcards = await insertSection(hspId, 'flashcards', 'Customer Service Flashcards', '');
await insertFlashcards(hspFlashcards, [
  { q: 'What does RATER stand for in SERVQUAL?', a: 'Reliability, Assurance, Tangibles, Empathy, Responsiveness' },
  { q: 'What is the service recovery paradox?', a: 'Customers who experience a well-resolved problem often become MORE loyal than customers who never had a problem' },
  { q: 'How is Net Promoter Score (NPS) calculated?', a: 'NPS = % Promoters (score 9-10) minus % Detractors (score 0-6)' },
  { q: 'What is a "moment of truth" in hospitality?', a: 'Any interaction between a customer and a business that can influence the customer\'s overall perception' },
  { q: 'What is Customer Lifetime Value (CLV)?', a: 'The total revenue a business expects from a single customer over the entire duration of their relationship' },
  { q: 'What is the difference between upselling and cross-selling?', a: 'Upselling encourages a higher-end version of the same product; cross-selling recommends complementary products' },
  { q: 'What is empathy in customer service?', a: 'Understanding and sharing the feelings of the customer — acknowledging their experience before offering solutions' },
  { q: 'What is a service blueprint?', a: 'A diagram visualizing the service process, showing customer actions, staff actions, and backstage support processes' },
  { q: 'What are the five SERVQUAL dimensions?', a: 'Reliability, Assurance, Tangibles, Empathy, Responsiveness' },
  { q: 'What is reliability in SERVQUAL?', a: 'The ability to perform the promised service dependably and accurately' },
  { q: 'What is assurance in SERVQUAL?', a: 'Knowledge and courtesy of employees and their ability to inspire trust and confidence' },
  { q: 'What are tangibles in SERVQUAL?', a: 'Physical facilities, equipment, and appearance of personnel' },
  { q: 'What is responsiveness in SERVQUAL?', a: 'Willingness to help customers and provide prompt service' },
  { q: 'What is a Detractor in NPS?', a: 'A customer who scores 0-6 on the NPS question — they are unhappy and may damage the brand through negative word-of-mouth' },
  { q: 'What is a Promoter in NPS?', a: 'A customer who scores 9-10 on the NPS question — they are loyal enthusiasts who will recommend the business' },
  { q: 'What is the first step in effective service recovery?', a: 'Acknowledge the problem and apologize sincerely — never argue or make excuses' },
  { q: 'What is a guest experience?', a: 'The overall impression a guest forms from all touchpoints during their visit, from booking to departure' },
  { q: 'Why is customer retention more profitable than acquisition?', a: 'Acquiring a new customer costs 5-7x more than retaining an existing one, and loyal customers spend more over time' },
  { q: 'What is the LAST acronym for service recovery?', a: 'Listen, Apologize, Solve, Thank — a four-step framework for resolving customer complaints' },
  { q: 'What is a service gap?', a: 'The difference between customer expectations and their perception of the actual service received' },
]);

const hspQuiz = await insertSection(hspId, 'quiz', 'Customer Service Quiz', '');
await insertQuizQuestions(hspQuiz, [
  { question: 'In the SERVQUAL model, which dimension refers to the physical appearance of facilities and staff?', options: ['A) Reliability', 'B) Assurance', 'C) Tangibles', 'D) Empathy'], correct: 'C', explanation: 'Tangibles refers to the physical facilities, equipment, and appearance of personnel.' },
  { question: 'A hotel guest complains about a noisy room. The front desk upgrades them for free and sends a complimentary breakfast. This is an example of:', options: ['A) Upselling', 'B) Service recovery', 'C) Cross-selling', 'D) Benchmarking'], correct: 'B', explanation: 'Service recovery is the process of resolving a service failure and restoring — or exceeding — customer satisfaction.' },
  { question: 'Net Promoter Score is calculated as:', options: ['A) % Promoters + % Detractors', 'B) % Promoters - % Detractors', 'C) % Promoters × % Detractors', 'D) % Promoters / % Detractors'], correct: 'B', explanation: 'NPS = % Promoters (9-10) minus % Detractors (0-6). Passives (7-8) are not included in the calculation.' },
  { question: 'A customer who scores 7 on an NPS survey is classified as:', options: ['A) A Promoter', 'B) A Detractor', 'C) A Passive', 'D) An Advocate'], correct: 'C', explanation: 'Scores of 7-8 are Passives — satisfied but not enthusiastic enough to actively promote the business.' },
  { question: 'The service recovery paradox states that:', options: ['A) Service failures always reduce customer loyalty', 'B) Customers with well-resolved complaints can become more loyal than those who never had a problem', 'C) Service recovery is too expensive to be worthwhile', 'D) Customers never forgive service failures'], correct: 'B', explanation: 'Research shows that excellent service recovery can actually increase loyalty beyond what it would have been without the failure.' },
  { question: 'A waiter suggests a customer add a dessert to their order. This is an example of:', options: ['A) Cross-selling', 'B) Upselling', 'C) Service recovery', 'D) Empathy'], correct: 'A', explanation: 'Cross-selling recommends complementary products. Upselling would be suggesting a larger or premium version of what they already ordered.' },
  { question: 'Which SERVQUAL dimension involves the willingness to help customers promptly?', options: ['A) Reliability', 'B) Assurance', 'C) Empathy', 'D) Responsiveness'], correct: 'D', explanation: 'Responsiveness is the willingness to help customers and provide prompt service.' },
  { question: 'Customer Lifetime Value (CLV) is important because it helps businesses:', options: ['A) Determine how much to spend on acquiring and retaining customers', 'B) Calculate daily revenue', 'C) Measure employee performance', 'D) Set product prices'], correct: 'A', explanation: 'CLV tells you the total revenue a customer will generate, helping you decide how much to invest in acquiring and retaining them.' },
  { question: 'The LAST acronym for service recovery stands for:', options: ['A) Listen, Apologize, Solve, Thank', 'B) Learn, Act, Satisfy, Track', 'C) Locate, Assess, Support, Test', 'D) Listen, Analyze, Solve, Transfer'], correct: 'A', explanation: 'LAST: Listen to the customer, Apologize sincerely, Solve the problem, Thank the customer for their feedback.' },
  { question: 'A service blueprint is used to:', options: ['A) Design the physical layout of a restaurant', 'B) Visualize the service process including customer and staff actions', 'C) Calculate service costs', 'D) Train new employees on product knowledge'], correct: 'B', explanation: 'A service blueprint maps out the entire service process, showing what customers experience, what staff do visibly, and what happens backstage.' },
  { question: 'Which of the following best demonstrates empathy in customer service?', options: ['A) Offering a discount immediately', 'B) Saying "I understand how frustrating that must be" before offering a solution', 'C) Transferring the customer to a manager', 'D) Following the standard complaint procedure'], correct: 'B', explanation: 'Empathy means acknowledging the customer\'s feelings before jumping to solutions — it shows you understand their experience.' },
  { question: 'Why is customer retention generally more cost-effective than customer acquisition?', options: ['A) Existing customers always spend more', 'B) Acquiring new customers costs 5-7x more than retaining existing ones', 'C) Retention requires no marketing investment', 'D) New customers are less profitable by law'], correct: 'B', explanation: 'Research consistently shows that acquiring a new customer costs significantly more than retaining an existing one, making retention a high-ROI strategy.' },
  { question: 'A "moment of truth" in hospitality refers to:', options: ['A) The moment a customer decides to leave a review', 'B) Any interaction that can influence the customer\'s overall perception of the business', 'C) The final bill presentation', 'D) The moment a complaint is resolved'], correct: 'B', explanation: 'Jan Carlzon coined "moments of truth" — every customer touchpoint is an opportunity to either build or damage the relationship.' },
  { question: 'Which of the following is the BEST first response to a customer complaint?', options: ['A) Offer an immediate refund', 'B) Explain company policy', 'C) Listen fully and acknowledge the customer\'s experience', 'D) Transfer to a supervisor'], correct: 'C', explanation: 'The first step in service recovery is always to listen and acknowledge — customers need to feel heard before solutions are offered.' },
  { question: 'A hotel has 100 survey respondents: 60 Promoters, 25 Passives, 15 Detractors. What is the NPS?', options: ['A) 45', 'B) 60', 'C) 75', 'D) 85'], correct: 'A', explanation: 'NPS = % Promoters - % Detractors = 60% - 15% = 45. Passives are excluded from the calculation.' },
]);

const hspScenarios = await insertSection(hspId, 'scenario_challenge', 'Customer Service Scenarios', '');
await insertScenarios(hspScenarios, [
  { scenario: 'A guest at your hotel checks in and discovers their reserved ocean-view room has been given to another guest due to an overbooking error. The guest is visibly upset — they booked this room for their anniversary. You are the front desk manager. Walk through your service recovery process step by step, applying the LAST framework and the SERVQUAL dimensions.', difficulty: 'medium', expected: 'LAST: Listen without interrupting, Apologize sincerely (not defensively), Solve by offering the best available alternative (upgrade, complimentary amenities, future discount), Thank them for their patience. SERVQUAL: Reliability failed (didn\'t deliver promised service), so focus on Assurance (demonstrate competence), Empathy (acknowledge the anniversary significance), and Responsiveness (act immediately).' },
  { scenario: 'Your restaurant\'s NPS score dropped from +45 to +20 over the past quarter. Survey comments mention slow service and inconsistent food quality. As the operations manager, design a 90-day improvement plan using SERVQUAL dimensions to diagnose the problem and specific actions to address each gap.', difficulty: 'hard', expected: 'Diagnosis: Reliability gap (inconsistent food), Responsiveness gap (slow service). Plan: Week 1-2: Audit kitchen processes and service times. Month 1: Standardize recipes and implement timing KPIs. Month 2: Staff training on responsiveness and empathy. Month 3: Re-survey customers and measure NPS improvement. Track weekly NPS and adjust.' },
  { scenario: 'A loyal customer who has dined at your restaurant 50+ times complains that their steak was overcooked. They are calm but clearly disappointed. Calculate their approximate Customer Lifetime Value (assuming $80 average spend, twice monthly visits for 5 years), and explain why this calculation should influence how you handle their complaint.', difficulty: 'easy', expected: 'CLV = $80 × 2 × 12 × 5 = $9,600. This customer represents nearly $10,000 in future revenue. This justifies significant service recovery investment — a free meal ($80) is a 0.8% cost to protect $9,600 in future revenue. Loyal customers also generate referrals, multiplying the true value.' },
]);

const hspRelated = await insertSection(hspId, 'examples', 'Related PIs & Common Mistakes', `Related Performance Indicators:
- HSP-CS-002: Handle customer complaints effectively
- HSP-CS-003: Build customer loyalty programs
- HSP-MKT-001: Market hospitality services to target audiences
- HSP-OPS-001: Manage front-of-house operations

Common Mistakes in DECA Competitions:
1. Confusing upselling (premium version) with cross-selling (complementary product)
2. Forgetting the NPS formula — it's Promoters MINUS Detractors, not an average
3. Skipping the "Listen" step in service recovery — jumping to solutions before acknowledging feelings
4. Treating all SERVQUAL dimensions as equally important in every situation — context matters
5. Underestimating the value of loyal customers — CLV calculations should drive service recovery decisions`);

const hspTeachBack = await insertSection(hspId, 'ai_coach_feedback', 'Teach-Back Activity', `Explain customer service excellence in hospitality to a new hotel employee on their first day. Your explanation should cover:
1. Why customer service is the foundation of hospitality success
2. The RATER dimensions and one specific example of each in a hotel context
3. How to handle a guest complaint using the LAST framework
4. Why the service recovery paradox matters and how to use it to your advantage`);

console.log(`Hospitality module complete.`);
console.log('\n✅ All PI modules seeded successfully!');
await conn.end();
