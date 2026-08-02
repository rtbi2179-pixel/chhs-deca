-- Comprehensive PI Learning Module Database Seed
-- This script creates complete learning modules for each Performance Indicator
-- Each module includes: lesson, vocabulary, flashcards, quick-review questions, 
-- multiple-choice quiz, scenario challenges, related PIs, common mistakes, and teach-back

-- Clear existing data
DELETE FROM `userPiSectionProgress`;
DELETE FROM `userPiProgress`;
DELETE FROM `piScenarioChallenges`;
DELETE FROM `piQuizQuestions`;
DELETE FROM `piFlashcards`;
DELETE FROM `piModuleSections`;
DELETE FROM `piLearningModules`;

-- ============================================================================
-- MARKETING CLUSTER - Module 1: Market Segmentation & Target Audience
-- ============================================================================
INSERT INTO `piLearningModules` (`piId`, `cluster`, `instructionalArea`, `performanceIndicator`, `level`) VALUES
(1, 'MKT-SEG-001', 'Marketing', 'Explain market segmentation and its importance in identifying target audiences', 'Intermediate');

-- Theory/Lesson Section
INSERT INTO `piModuleSections` (`moduleId`, `sectionType`, `title`, `content`, `order`) VALUES
(1, 'theory', 'Market Segmentation Fundamentals', 
'Market segmentation is the process of dividing a large, heterogeneous market into smaller, more homogeneous subsets of consumers with similar needs, characteristics, or behaviors. This strategic approach allows businesses to tailor their marketing efforts, products, and services to specific customer groups.

KEY CONCEPTS:
• Segmentation divides markets into distinct groups based on shared characteristics
• Each segment has unique needs, preferences, and purchasing behaviors
• Effective segmentation enables targeted marketing and better resource allocation
• Segments must be measurable, accessible, substantial, and actionable

WHY IT MATTERS:
Segmentation helps businesses:
- Focus marketing efforts on high-value customer groups
- Develop products that meet specific customer needs
- Allocate marketing budgets more efficiently
- Increase customer satisfaction and loyalty
- Reduce marketing waste and improve ROI

SEGMENTATION BASES:
1. Demographic: Age, gender, income, education, family size
2. Psychographic: Lifestyle, values, attitudes, interests
3. Behavioral: Purchase history, usage rate, brand loyalty, benefits sought
4. Geographic: Location, climate, population density, region

EXAMPLE: A fitness equipment company might segment the market into:
- Budget-conscious home gym enthusiasts (low income, value-focused)
- Premium fitness enthusiasts (high income, quality-focused)
- Commercial gym operators (business segment, bulk purchases)
- Physical therapy clinics (professional segment, specialized equipment)', 1);

-- Vocabulary Section
INSERT INTO `piModuleSections` (`moduleId`, `sectionType`, `title`, `content`, `order`) VALUES
(1, 'vocabulary', 'Key Terms & Definitions', 
'1. MARKET SEGMENTATION: Dividing a market into distinct subsets with different needs and characteristics
2. TARGET MARKET: The specific segment a company chooses to serve with its marketing efforts
3. DEMOGRAPHIC SEGMENTATION: Dividing markets based on population characteristics (age, income, education)
4. PSYCHOGRAPHIC SEGMENTATION: Dividing markets based on lifestyle, values, and personality
5. BEHAVIORAL SEGMENTATION: Dividing markets based on purchase patterns and product usage
6. GEOGRAPHIC SEGMENTATION: Dividing markets based on location and regional characteristics
7. NICHE MARKET: A smaller, more specific segment within a larger market
8. POSITIONING: How a brand is perceived relative to competitors in a target segment
9. MARKET PENETRATION: Increasing sales within an existing market segment
10. CUSTOMER PERSONA: A detailed profile representing an ideal customer in a target segment', 2);

-- Flashcards Section (20 flashcards)
INSERT INTO `piModuleSections` (`moduleId`, `sectionType`, `title`, `content`, `order`) VALUES
(1, 'flashcards', 'Flashcard Review', 'Review key concepts about market segmentation', 3);

-- Insert 20 flashcards for this section
INSERT INTO `piFlashcards` (`sectionId`, `question`, `answer`, `type`) VALUES
(3, 'What is market segmentation?', 'The process of dividing a large market into smaller, more homogeneous subsets of consumers with similar needs and characteristics', 'fill_in_the_blank'),
(3, 'Name the four main bases for market segmentation.', 'Demographic, Psychographic, Behavioral, and Geographic', 'multiple_choice'),
(3, 'What does demographic segmentation focus on?', 'Population characteristics such as age, gender, income, education, and family size', 'fill_in_the_blank'),
(3, 'Define psychographic segmentation.', 'Dividing markets based on lifestyle, values, attitudes, interests, and personality traits', 'fill_in_the_blank'),
(3, 'What is behavioral segmentation based on?', 'Purchase patterns, usage rates, brand loyalty, and benefits sought by consumers', 'fill_in_the_blank'),
(3, 'How does geographic segmentation work?', 'Dividing markets based on location, climate, population density, and regional characteristics', 'fill_in_the_blank'),
(3, 'What is a target market?', 'The specific market segment a company chooses to serve with its marketing efforts and products', 'fill_in_the_blank'),
(3, 'Why is market segmentation important for businesses?', 'It allows focused marketing efforts, better resource allocation, improved customer satisfaction, and increased ROI', 'fill_in_the_blank'),
(3, 'What makes a market segment viable?', 'It must be measurable, accessible, substantial, and actionable', 'multiple_choice'),
(3, 'Define a niche market.', 'A smaller, more specific segment within a larger market with unique needs and characteristics', 'fill_in_the_blank'),
(3, 'What is market positioning?', 'How a brand is perceived and positioned relative to competitors in a target segment', 'fill_in_the_blank'),
(3, 'How can a company use segmentation for product development?', 'By developing products that specifically meet the needs and preferences of each target segment', 'fill_in_the_blank'),
(3, 'What is market penetration?', 'Increasing sales and market share within an existing market segment', 'fill_in_the_blank'),
(3, 'Describe a customer persona.', 'A detailed, semi-fictional profile representing an ideal customer in a target segment', 'fill_in_the_blank'),
(3, 'How does segmentation improve marketing efficiency?', 'By allowing companies to focus resources on high-value segments and reduce marketing waste', 'fill_in_the_blank'),
(3, 'What is the relationship between segmentation and targeting?', 'Segmentation divides the market; targeting selects which segments to serve', 'fill_in_the_blank'),
(3, 'Give an example of demographic segmentation.', 'A luxury car company targeting high-income professionals aged 35-55', 'fill_in_the_blank'),
(3, 'How can behavioral data inform segmentation?', 'By analyzing purchase history, frequency, and product usage patterns to identify distinct groups', 'fill_in_the_blank'),
(3, 'What is the benefit of psychographic segmentation?', 'It reveals deeper insights into customer values and lifestyle, enabling more personalized marketing', 'fill_in_the_blank'),
(3, 'How should a company decide which segment to target?', 'By evaluating segment size, growth potential, profitability, and competitive advantage', 'fill_in_the_blank');

-- Quick-Review Questions Section (10 questions)
INSERT INTO `piModuleSections` (`moduleId`, `sectionType`, `title`, `content`, `order`) VALUES
(1, 'quiz', 'Quick-Review Questions', 'Test your understanding of market segmentation basics', 4);

-- Insert 10 quick-review questions
INSERT INTO `piQuizQuestions` (`sectionId`, `question`, `options`, `correctAnswer`, `explanation`) VALUES
(4, 'Which of the following is NOT a base for market segmentation?', '["Demographic", "Psychographic", "Temporal", "Behavioral"]', 'C', 'The four main segmentation bases are demographic, psychographic, behavioral, and geographic. Temporal is not a standard segmentation base.'),
(4, 'Market segmentation is most useful for:', '["Large corporations only", "Identifying and serving specific customer groups", "Eliminating competition", "Reducing product quality"]', 'B', 'Segmentation helps businesses identify and serve specific customer groups more effectively.'),
(4, 'A viable market segment must have which characteristics?', '["Measurable, accessible, substantial, and actionable", "Large, profitable, and exclusive", "Young, wealthy, and educated", "Urban, digital, and tech-savvy"]', 'A', 'For a segment to be viable, it must be measurable, accessible, substantial, and actionable.'),
(4, 'Psychographic segmentation focuses on:', '["Income and education", "Age and gender", "Lifestyle and values", "Location and climate"]', 'C', 'Psychographic segmentation divides markets based on lifestyle, values, attitudes, and interests.'),
(4, 'Which segmentation approach would a fitness brand use to target "health-conscious millennials"?', '["Demographic only", "Geographic only", "Psychographic and demographic", "Behavioral only"]', 'C', 'This requires both demographic (millennials) and psychographic (health-conscious) segmentation.'),
(4, 'The primary benefit of market segmentation is:', '["Eliminating all competition", "Increasing prices for all products", "Allowing targeted marketing and better resource allocation", "Simplifying the sales process"]', 'C', 'Segmentation enables targeted marketing and more efficient resource allocation.'),
(4, 'A customer persona is:', '["A real customer you interview", "A detailed profile of an ideal customer in a target segment", "A marketing slogan", "A product feature"]', 'B', 'A customer persona is a semi-fictional, detailed profile representing an ideal customer in a target segment.'),
(4, 'Market penetration refers to:', '["Entering a new market", "Increasing sales within an existing segment", "Launching a new product", "Reducing market competition"]', 'B', 'Market penetration means increasing sales and market share within an existing market segment.'),
(4, 'Behavioral segmentation would be most useful for:', '["A luxury hotel chain", "An online retailer analyzing purchase history", "A geographic region", "A demographic group"]', 'B', 'Behavioral segmentation uses purchase history and usage patterns, making it ideal for online retailers.'),
(4, 'What is the relationship between segmentation and positioning?', '["They are the same thing", "Segmentation identifies groups; positioning shows how to differentiate within a segment", "Positioning comes before segmentation", "They are unrelated concepts"]', 'B', 'Segmentation divides the market; positioning determines how to differentiate within chosen segments.');

-- Multiple-Choice Quiz Section (15 questions)
INSERT INTO `piModuleSections` (`moduleId`, `sectionType`, `title`, `content`, `order`) VALUES
(1, 'quiz', 'Comprehensive Quiz', 'Test your mastery of market segmentation concepts', 5);

-- Insert 15 comprehensive quiz questions (continuing from sectionId 5)
INSERT INTO `piQuizQuestions` (`sectionId`, `question`, `options`, `correctAnswer`, `explanation`) VALUES
(5, 'A smartphone manufacturer segments its market by device price point (budget, mid-range, premium). This is an example of:', '["Demographic segmentation", "Psychographic segmentation", "Behavioral segmentation", "Price-based segmentation"]', 'D', 'While this could relate to income (demographic), it is primarily based on price point, which is a distinct segmentation approach.'),
(5, 'Which of the following best describes the purpose of market segmentation?', '["To eliminate competition", "To increase product prices", "To identify and target specific customer groups with tailored marketing", "To reduce the number of products offered"]', 'C', 'The primary purpose of segmentation is to identify and target specific customer groups with tailored marketing efforts.'),
(5, 'A company discovers that its customers fall into two distinct groups: budget-conscious bargain hunters and quality-focused premium buyers. What should the company do next?', '["Ignore the difference and treat all customers the same", "Target both segments with identical marketing messages", "Develop different value propositions and marketing strategies for each segment", "Eliminate the budget segment"]', 'C', 'Once segments are identified, companies should develop tailored strategies for each segment.'),
(5, 'Geographic segmentation would be MOST relevant for:', '["A global software company", "A regional restaurant chain", "An online-only e-commerce business", "A digital subscription service"]', 'B', 'Geographic segmentation is most relevant for businesses with location-based operations like restaurant chains.'),
(5, 'Which statement about market segmentation is TRUE?', '["All segments are equally profitable", "Segmentation guarantees business success", "Effective segmentation requires understanding customer needs and characteristics", "Segmentation eliminates the need for marketing"]', 'C', 'Effective segmentation requires deep understanding of customer needs, characteristics, and behaviors.'),
(5, 'A luxury fashion brand targets wealthy professionals aged 30-50 with high disposable income. This is primarily:', '["Psychographic segmentation", "Behavioral segmentation", "Demographic segmentation", "Geographic segmentation"]', 'C', 'This focuses on age and income, which are demographic variables.'),
(5, 'What is the main advantage of using multiple segmentation bases together?', '["It is easier to implement", "It provides a more complete understanding of customer groups", "It reduces marketing costs", "It eliminates the need for research"]', 'B', 'Using multiple bases (e.g., demographic + psychographic) provides richer, more actionable customer insights.'),
(5, 'A segment that is "substantial" means:', '["It is easy to reach", "It is large enough to be profitable and worth targeting", "It is growing rapidly", "It is located in a specific geography"]', 'B', 'A substantial segment is large enough to justify targeted marketing efforts and generate adequate revenue.'),
(5, 'Which of the following is an example of psychographic segmentation?', '["Targeting customers aged 18-24", "Targeting customers with household income above $100,000", "Targeting environmentally conscious consumers", "Targeting customers in urban areas"]', 'C', 'Environmental consciousness is a value/lifestyle characteristic, making it psychographic segmentation.'),
(5, 'A company uses customer purchase history to identify repeat buyers vs. one-time purchasers. This is:', '["Demographic segmentation", "Behavioral segmentation", "Psychographic segmentation", "Geographic segmentation"]', 'B', 'Purchase history and frequency are behavioral characteristics.'),
(5, 'What is the primary risk of over-segmentation?', '["Segments become too large", "Marketing becomes too expensive and complex", "Segments are too similar to each other", "All segments become equally profitable"]', 'B', 'Over-segmentation can lead to excessive complexity and marketing costs that exceed the benefits.'),
(5, 'A streaming service offers different subscription tiers (basic, standard, premium). This segmentation approach is based on:', '["Price sensitivity and usage needs", "Age and education", "Geographic location", "Employment status"]', 'A', 'Different subscription tiers target customers with different price sensitivities and feature needs.'),
(5, 'Which segmentation base would be MOST useful for a B2B software company?', '["Age and gender", "Lifestyle and hobbies", "Company size and industry", "Geographic location only"]', 'C', 'B2B companies typically segment by company characteristics like size, industry, and business needs.'),
(5, 'The term "actionable" in the context of market segments means:', '["The segment can be easily counted", "The company can reach and serve the segment with its marketing and products", "The segment is growing", "The segment is profitable"]', 'B', 'Actionable means the company can actually reach, serve, and market to the segment effectively.'),
(5, 'After identifying and targeting a market segment, what should a company do?', '["Never revisit the segmentation strategy", "Continuously monitor segment characteristics and adjust strategies as needed", "Assume the strategy will work forever", "Ignore customer feedback"]', 'B', 'Markets are dynamic; companies should continuously monitor and adjust their segmentation strategies.');

-- Scenario Challenges Section (3 scenarios)
INSERT INTO `piModuleSections` (`moduleId`, `sectionType`, `title`, `content`, `order`) VALUES
(1, 'scenario_challenge', 'Business Scenario Challenges', 'Apply your knowledge to real-world business situations', 6);

-- Insert 3 scenario challenges
INSERT INTO `piScenarioChallenges` (`sectionId`, `scenario`, `difficulty`, `expectedAnswer`) VALUES
(6, 'SCENARIO 1: You are the marketing manager for a mid-sized athletic apparel company. Currently, you market all products to "active people" without segmentation. Your sales have plateaued. Using market segmentation principles, explain how you would segment the market and develop different marketing strategies for each segment. Consider demographic, psychographic, and behavioral factors.', 'medium', 'A strong answer would identify multiple segments such as: (1) Professional athletes (premium, performance-focused), (2) Fitness enthusiasts (quality-conscious, trend-aware), (3) Casual gym-goers (budget-conscious, convenience-focused), (4) Outdoor enthusiasts (durability-focused, adventure-seeking). For each segment, describe tailored value propositions, pricing strategies, and marketing channels.'),
(6, 'SCENARIO 2: A regional coffee chain is considering expansion to a new city. The city has three distinct neighborhoods: (A) Downtown business district with high-income professionals, (B) College campus area with students, (C) Suburban residential area with families. How would you use geographic and demographic segmentation to develop a market entry strategy? What would be different about each location?', 'hard', 'A strong answer would recognize that each neighborhood requires different positioning: Downtown - premium, quick-service concept; Campus - affordable, social atmosphere; Suburban - family-friendly, convenient. Different product mixes, pricing, store designs, and marketing messages would be appropriate for each segment.'),
(6, 'SCENARIO 3: You are analyzing customer data for an online retailer and notice that 20% of customers generate 80% of revenue. These high-value customers make frequent purchases, have high average order values, and show strong brand loyalty. How would you use behavioral segmentation to develop a strategy that maximizes value from this segment while also growing the other segments?', 'medium', 'A strong answer would include: (1) Create a VIP loyalty program for high-value segment with exclusive benefits, (2) Analyze what makes them loyal and replicate those characteristics in marketing to other segments, (3) Develop targeted campaigns to move mid-value customers toward high-value status, (4) Identify and address barriers preventing low-value customers from increasing purchases.');

-- Related PIs Section
INSERT INTO `piModuleSections` (`moduleId`, `sectionType`, `title`, `content`, `order`) VALUES
(1, 'theory', 'Related Performance Indicators & Common Mistakes', 
'RELATED PIs:
• MKT-TAR-002: Develop target market profiles and customer personas
• MKT-POS-003: Position products and services within target segments
• MKT-RES-004: Conduct market research to validate segmentation assumptions
• MKT-MIX-005: Develop marketing mix strategies for different segments

COMMON MISTAKES TO AVOID:
1. OVER-SEGMENTATION: Creating too many segments that are too similar, leading to wasted resources
   - Solution: Consolidate segments with similar characteristics and needs

2. UNDER-SEGMENTATION: Treating all customers the same when distinct groups exist
   - Solution: Conduct thorough market research to identify meaningful differences

3. IGNORING SEGMENT DYNAMICS: Assuming segments remain static over time
   - Solution: Regularly review and update segmentation as markets evolve

4. POOR SEGMENT SELECTION: Targeting segments that are too small or unprofitable
   - Solution: Evaluate segment size, growth potential, and profitability before committing resources

5. MISALIGNED MESSAGING: Using generic messaging that doesn''t resonate with specific segments
   - Solution: Develop tailored value propositions and messaging for each segment

6. IGNORING PSYCHOGRAPHIC DATA: Focusing only on demographics without understanding values and lifestyle
   - Solution: Incorporate psychographic research to develop deeper customer understanding

7. INFLEXIBLE STRATEGIES: Applying the same strategy to all segments
   - Solution: Develop customized marketing mixes for each segment

8. POOR EXECUTION: Having good segmentation but failing to execute tailored strategies
   - Solution: Ensure all departments (marketing, sales, product, service) align with segmentation strategy', 7);

-- Teach-Back Activity Section
INSERT INTO `piModuleSections` (`moduleId`, `sectionType`, `title`, `content`, `order`) VALUES
(1, 'ai_coach_feedback', 'Teach-Back Activity & AI Coach', 
'TEACH-BACK ACTIVITY:
Explain to a colleague why market segmentation is important for a business of your choice. Your explanation should include:
1. The specific market segments you would identify
2. The segmentation bases you would use (demographic, psychographic, behavioral, geographic)
3. How different marketing strategies would be tailored for each segment
4. Why this segmentation approach would improve business results

AI COACH FEEDBACK GUIDELINES:
The AI coach will evaluate your teach-back based on:
• Clarity: Is the explanation clear and easy to understand?
• Completeness: Did you address all required components?
• Application: Did you apply concepts to a real business scenario?
• Strategic Thinking: Did you explain the business benefits of segmentation?
• Terminology: Did you use appropriate marketing terminology correctly?

MASTERY INDICATORS:
You have mastered this PI when you can:
✓ Define market segmentation and explain its importance
✓ Identify and apply the four main segmentation bases
✓ Develop customer personas for different segments
✓ Explain how segmentation improves marketing effectiveness
✓ Identify common segmentation mistakes and how to avoid them
✓ Apply segmentation concepts to real business scenarios', 8);

-- ============================================================================
-- FINANCE CLUSTER - Module 1: Financial Statement Analysis
-- ============================================================================
INSERT INTO `piLearningModules` (`piId`, `cluster`, `instructionalArea`, `performanceIndicator`, `level`) VALUES
(2, 'FIN-FSA-001', 'Finance', 'Interpret and analyze financial statements to assess business performance', 'Intermediate');

-- Theory/Lesson Section
INSERT INTO `piModuleSections` (`moduleId`, `sectionType`, `title`, `content`, `order`) VALUES
(2, 'theory', 'Financial Statement Analysis Fundamentals',
'Financial statements are the primary documents used to communicate a company''s financial performance and position. Understanding how to read, interpret, and analyze these statements is essential for making informed business decisions.

THE THREE PRIMARY FINANCIAL STATEMENTS:

1. INCOME STATEMENT (Profit & Loss Statement)
Shows a company''s revenues, expenses, and profitability over a specific period.
Key Components:
- Revenue: Total sales from products/services
- Cost of Goods Sold (COGS): Direct costs to produce products
- Gross Profit: Revenue minus COGS
- Operating Expenses: Salaries, rent, utilities, marketing, etc.
- Operating Income: Gross profit minus operating expenses
- Net Income: Final profit after all expenses and taxes

2. BALANCE SHEET (Statement of Financial Position)
Shows a company''s assets, liabilities, and equity at a specific point in time.
Key Components:
- Assets: What the company owns (cash, inventory, equipment, property)
- Liabilities: What the company owes (loans, accounts payable, debt)
- Equity: Owner''s stake in the company (Assets - Liabilities = Equity)

3. CASH FLOW STATEMENT
Shows how cash moves in and out of the company during a period.
Key Components:
- Operating Cash Flow: Cash from normal business operations
- Investing Cash Flow: Cash from buying/selling assets
- Financing Cash Flow: Cash from loans, investments, dividends

WHY FINANCIAL ANALYSIS MATTERS:
• Assess company profitability and efficiency
• Evaluate financial health and solvency
• Make investment and lending decisions
• Compare performance across time periods and competitors
• Identify trends and potential problems
• Support strategic planning and budgeting

KEY FINANCIAL RATIOS:
PROFITABILITY RATIOS:
- Profit Margin = Net Income / Revenue (shows profit per dollar of sales)
- Return on Assets (ROA) = Net Income / Total Assets (shows efficiency in using assets)
- Return on Equity (ROE) = Net Income / Shareholders'' Equity (shows return to investors)

LIQUIDITY RATIOS:
- Current Ratio = Current Assets / Current Liabilities (ability to pay short-term obligations)
- Quick Ratio = (Current Assets - Inventory) / Current Liabilities (more conservative liquidity measure)

EFFICIENCY RATIOS:
- Asset Turnover = Revenue / Total Assets (how efficiently assets generate sales)
- Inventory Turnover = COGS / Average Inventory (how quickly inventory is sold)

SOLVENCY RATIOS:
- Debt-to-Equity = Total Debt / Total Equity (financial leverage)
- Interest Coverage = EBIT / Interest Expense (ability to pay interest on debt)', 1);

-- Vocabulary Section
INSERT INTO `piModuleSections` (`moduleId`, `sectionType`, `title`, `content`, `order`) VALUES
(2, 'vocabulary', 'Financial Analysis Key Terms',
'1. REVENUE: Total income from sales of products or services
2. EXPENSE: Cost incurred in generating revenue
3. PROFIT: Revenue minus expenses; also called earnings or net income
4. ASSET: Resource owned by the company with economic value
5. LIABILITY: Financial obligation or debt owed by the company
6. EQUITY: Owner''s residual claim on company assets (Assets - Liabilities)
7. LIQUIDITY: Ability to convert assets to cash quickly
8. SOLVENCY: Ability to meet long-term financial obligations
9. RATIO ANALYSIS: Comparing financial metrics to assess performance
10. CASH FLOW: Movement of cash in and out of the business', 2);

-- Flashcards (20 for Finance module)
INSERT INTO `piModuleSections` (`moduleId`, `sectionType`, `title`, `content`, `order`) VALUES
(2, 'flashcards', 'Financial Analysis Flashcards', 'Review financial statement concepts', 3);

INSERT INTO `piFlashcards` (`sectionId`, `question`, `answer`, `type`) VALUES
(9, 'What are the three primary financial statements?', 'Income Statement, Balance Sheet, and Cash Flow Statement', 'multiple_choice'),
(9, 'What does the Income Statement show?', 'A company''s revenues, expenses, and profitability over a specific period', 'fill_in_the_blank'),
(9, 'Define the Balance Sheet.', 'A financial statement showing a company''s assets, liabilities, and equity at a specific point in time', 'fill_in_the_blank'),
(9, 'What is the basic accounting equation?', 'Assets = Liabilities + Equity', 'multiple_choice'),
(9, 'What does COGS stand for?', 'Cost of Goods Sold - the direct costs to produce products sold by a company', 'fill_in_the_blank'),
(9, 'How is Gross Profit calculated?', 'Revenue minus Cost of Goods Sold (COGS)', 'fill_in_the_blank'),
(9, 'What is Operating Income?', 'Gross Profit minus Operating Expenses', 'fill_in_the_blank'),
(9, 'Define Net Income.', 'The final profit after all expenses, taxes, and interest are deducted from revenue', 'fill_in_the_blank'),
(9, 'What does the Cash Flow Statement track?', 'How cash moves in and out of the company during a specific period', 'fill_in_the_blank'),
(9, 'What are the three sections of the Cash Flow Statement?', 'Operating, Investing, and Financing cash flows', 'multiple_choice'),
(9, 'Define Profit Margin.', 'Net Income divided by Revenue; shows profit generated per dollar of sales', 'fill_in_the_blank'),
(9, 'What is Return on Assets (ROA)?', 'Net Income divided by Total Assets; measures efficiency in using assets', 'fill_in_the_blank'),
(9, 'How is the Current Ratio calculated?', 'Current Assets divided by Current Liabilities', 'fill_in_the_blank'),
(9, 'What does the Current Ratio measure?', 'A company''s ability to pay short-term obligations with current assets', 'fill_in_the_blank'),
(9, 'Define Asset Turnover.', 'Revenue divided by Total Assets; measures how efficiently assets generate sales', 'fill_in_the_blank'),
(9, 'What is Debt-to-Equity Ratio?', 'Total Debt divided by Total Equity; measures financial leverage', 'fill_in_the_blank'),
(9, 'What does high liquidity indicate?', 'The company can quickly convert assets to cash and pay short-term obligations', 'fill_in_the_blank'),
(9, 'What does solvency measure?', 'A company''s ability to meet long-term financial obligations and debt payments', 'fill_in_the_blank'),
(9, 'What is ratio analysis?', 'Comparing financial metrics to assess company performance and financial health', 'fill_in_the_blank'),
(9, 'Why is trend analysis important in financial analysis?', 'It reveals patterns and changes in financial performance over time', 'fill_in_the_blank');

-- Quick-Review Questions (10)
INSERT INTO `piModuleSections` (`moduleId`, `sectionType`, `title`, `content`, `order`) VALUES
(2, 'quiz', 'Quick-Review Questions', 'Test your financial analysis knowledge', 4);

INSERT INTO `piQuizQuestions` (`sectionId`, `question`, `options`, `correctAnswer`, `explanation`) VALUES
(10, 'Which financial statement shows a company''s profitability?', '["Balance Sheet", "Income Statement", "Cash Flow Statement", "Statement of Equity"]', 'B', 'The Income Statement shows revenues, expenses, and net income (profitability) over a period.'),
(10, 'The accounting equation is:', '["Revenue = Expenses", "Assets = Liabilities - Equity", "Assets = Liabilities + Equity", "Income = Assets"]', 'C', 'The fundamental accounting equation is Assets = Liabilities + Equity.'),
(10, 'A company has $100,000 in assets and $40,000 in liabilities. Its equity is:', '["$40,000", "$60,000", "$100,000", "$140,000"]', 'B', 'Equity = Assets - Liabilities = $100,000 - $40,000 = $60,000'),
(10, 'What does a Current Ratio of 2.0 indicate?', '["The company has $2 in current assets for every $1 in current liabilities", "The company is insolvent", "The company has poor liquidity", "The company has too much debt"]', 'A', 'A Current Ratio of 2.0 means the company has $2 in current assets for every $1 in current liabilities, indicating good short-term liquidity.'),
(10, 'Which ratio measures profitability?', '["Current Ratio", "Debt-to-Equity", "Profit Margin", "Asset Turnover"]', 'C', 'Profit Margin (Net Income / Revenue) measures profitability.'),
(10, 'If a company''s revenue is $500,000 and net income is $50,000, the profit margin is:', '["5%", "10%", "15%", "20%"]', 'B', 'Profit Margin = $50,000 / $500,000 = 0.10 or 10%'),
(10, 'What does the Cash Flow Statement NOT include?', '["Operating cash flow", "Investing cash flow", "Profit margin", "Financing cash flow"]', 'C', 'Profit margin is a ratio calculated from the Income Statement, not a component of the Cash Flow Statement.'),
(10, 'A high Debt-to-Equity ratio indicates:', '["Low financial risk", "High financial leverage and risk", "Strong profitability", "Good liquidity"]', 'B', 'A high Debt-to-Equity ratio means the company has more debt relative to equity, indicating higher financial risk.'),
(10, 'Which of the following is NOT a liquidity ratio?', '["Current Ratio", "Quick Ratio", "Return on Equity", "Cash Ratio"]', 'C', 'Return on Equity (ROE) is a profitability ratio, not a liquidity ratio.'),
(10, 'Operating cash flow is most similar to:', '["Net Income", "Revenue", "Cash generated from normal business operations", "Total Assets"]', 'C', 'Operating cash flow represents cash generated from the company''s normal business operations.');

-- Comprehensive Quiz (15 questions)
INSERT INTO `piModuleSections` (`moduleId`, `sectionType`, `title`, `content`, `order`) VALUES
(2, 'quiz', 'Comprehensive Financial Analysis Quiz', 'Demonstrate mastery of financial statement analysis', 5);

INSERT INTO `piQuizQuestions` (`sectionId`, `question`, `options`, `correctAnswer`, `explanation`) VALUES
(11, 'A company reports the following: Revenue $1,000,000, COGS $600,000, Operating Expenses $250,000, Interest Expense $20,000, Taxes $26,000. What is the Net Income?', '["$104,000", "$150,000", "$130,000", "$104,000"]', 'A', 'Net Income = Revenue - COGS - Operating Expenses - Interest - Taxes = $1,000,000 - $600,000 - $250,000 - $20,000 - $26,000 = $104,000'),
(11, 'Which statement is true about the Balance Sheet?', '["It shows performance over a period", "It is a snapshot at a specific point in time", "It shows cash flows", "It always balances to zero"]', 'B', 'The Balance Sheet is a snapshot of financial position at a specific point in time, not a performance measure over a period.'),
(11, 'A company has current assets of $300,000 and current liabilities of $150,000. Its current ratio is:', '["0.5", "1.0", "2.0", "3.0"]', 'C', 'Current Ratio = $300,000 / $150,000 = 2.0'),
(11, 'Which of the following would improve a company''s liquidity position?', '["Increasing inventory", "Paying off short-term debt", "Purchasing equipment", "Increasing long-term debt"]', 'B', 'Paying off short-term debt reduces current liabilities and improves the current ratio and liquidity.'),
(11, 'Return on Assets (ROA) is calculated as:', '["Net Income / Total Revenue", "Net Income / Total Assets", "Total Assets / Net Income", "Revenue / Total Assets"]', 'B', 'ROA = Net Income / Total Assets, measuring how efficiently the company uses its assets to generate profit.'),
(11, 'A company with high profit margin but low asset turnover is likely:', '["Highly efficient", "A luxury/premium business", "Inefficient", "Growing rapidly"]', 'B', 'High profit margin with low asset turnover suggests a premium business model (high profit per sale but fewer sales).'),
(11, 'Which cash flow is most important for evaluating a company''s core business health?', '["Investing cash flow", "Operating cash flow", "Financing cash flow", "All are equally important"]', 'B', 'Operating cash flow reflects cash generated from normal business operations and is most important for assessing core business health.'),
(11, 'A company''s equity increased from $500,000 to $600,000 while net income was $80,000. This could indicate:', '["The company paid dividends", "The company received new investment", "Both of the above", "The company had losses"]', 'C', 'Equity increased by $100,000, but only $80,000 came from net income, suggesting $20,000 came from new investment (or less dividends were paid).'),
(11, 'Which ratio would be most useful for comparing profitability between a large and small company?', '["Net Income", "Profit Margin", "Total Revenue", "Total Assets"]', 'B', 'Profit Margin is a percentage, making it useful for comparing profitability between companies of different sizes.'),
(11, 'A quick ratio of 0.8 indicates:', '["Strong liquidity", "Weak liquidity; may struggle to pay short-term obligations", "The company is insolvent", "The company has excess cash"]', 'B', 'A quick ratio below 1.0 indicates the company may struggle to pay short-term obligations with its most liquid assets.'),
(11, 'Which of the following is an example of an investing activity on the Cash Flow Statement?', '["Paying employees", "Selling equipment", "Paying interest on debt", "Collecting revenue from customers"]', 'B', 'Selling equipment is an investing activity. The other options are operating or financing activities.'),
(11, 'A company''s debt increased from $200,000 to $300,000 while equity remained constant. This indicates:', '["Increased financial risk", "Improved profitability", "Decreased leverage", "Better liquidity"]', 'A', 'Increased debt with constant equity means higher leverage and increased financial risk.'),
(11, 'Which statement about financial ratios is TRUE?', '["Ratios are absolute measures of performance", "Ratios are most useful when compared to industry standards and historical trends", "Ratios eliminate the need for other analysis", "High ratios always indicate good performance"]', 'B', 'Ratios are most useful when compared to industry benchmarks and the company''s historical performance.'),
(11, 'A company has inventory of $100,000 and COGS of $400,000. Its inventory turnover is approximately:', '["0.25 times", "2.5 times", "4 times", "10 times"]', 'C', 'Inventory Turnover = COGS / Average Inventory ≈ $400,000 / $100,000 = 4 times'),
(11, 'Which of the following would be a red flag in financial analysis?', '["Increasing revenue", "Decreasing debt", "Declining operating cash flow despite increasing net income", "Improving profit margins"]', 'C', 'Declining operating cash flow despite increasing net income could indicate earnings quality issues or accounting manipulation.');

-- Scenario Challenges (3)
INSERT INTO `piModuleSections` (`moduleId`, `sectionType`, `title`, `content`, `order`) VALUES
(2, 'scenario_challenge', 'Financial Analysis Scenarios', 'Apply analysis skills to real situations', 6);

INSERT INTO `piScenarioChallenges` (`sectionId`, `scenario`, `difficulty`, `expectedAnswer`) VALUES
(12, 'SCENARIO 1: You are analyzing two companies in the same industry. Company A has a profit margin of 15% and asset turnover of 2.0. Company B has a profit margin of 8% and asset turnover of 4.0. Which company is more profitable? Explain your analysis.', 'medium', 'Calculate ROA for both: Company A: 15% × 2.0 = 30% ROA; Company B: 8% × 4.0 = 32% ROA. Company B is slightly more profitable. Company A achieves profitability through high margins (premium pricing), while Company B achieves it through high volume. Both strategies can be successful depending on market conditions.'),
(12, 'SCENARIO 2: A company reports increasing net income but declining operating cash flow. As an investor, what concerns would you have? What questions would you ask management?', 'hard', 'This is a red flag suggesting potential earnings quality issues. Concerns: (1) Are profits from actual sales or accounting adjustments? (2) Is the company extending payment terms to boost sales? (3) Are there large one-time gains inflating net income? (4) Is inventory or receivables growing faster than sales? Questions for management: Explain the difference between net income and operating cash flow; provide details on accounts receivable aging; explain inventory levels; clarify any one-time items.'),
(12, 'SCENARIO 3: You are evaluating whether to extend credit to a potential customer. Their current ratio is 1.2, quick ratio is 0.8, and debt-to-equity is 1.5. What is your assessment of their creditworthiness?', 'medium', 'Mixed signals: Current ratio of 1.2 is acceptable but not strong. Quick ratio of 0.8 is concerning - they may struggle to pay obligations without selling inventory. Debt-to-equity of 1.5 indicates high leverage and financial risk. Overall assessment: Moderate to high credit risk. Recommendation: Request additional information, consider shorter payment terms, or require a personal guarantee.');

-- Related PIs and Common Mistakes
INSERT INTO `piModuleSections` (`moduleId`, `sectionType`, `title`, `content`, `order`) VALUES
(2, 'theory', 'Related PIs & Common Mistakes',
'RELATED PIs:
• FIN-BUD-002: Develop and manage budgets
• FIN-FOR-003: Create financial forecasts and projections
• FIN-INV-004: Evaluate investment opportunities
• FIN-RISK-005: Assess and manage financial risks

COMMON MISTAKES:
1. IGNORING CONTEXT: Analyzing ratios without understanding industry norms and company strategy
2. OVER-RELYING ON SINGLE METRICS: Making decisions based on one ratio without considering others
3. IGNORING TRENDS: Comparing single-year results without analyzing trends over time
4. CONFUSING PROFIT AND CASH: Assuming high net income means strong cash position
5. IGNORING QUALITY OF EARNINGS: Not distinguishing between sustainable operating income and one-time gains
6. POOR COMPARISONS: Comparing companies with different accounting methods or business models
7. IGNORING EXTERNAL FACTORS: Not considering industry conditions, economic cycles, and competitive dynamics
8. STATIC ANALYSIS: Treating financial analysis as a one-time event rather than ongoing monitoring', 7);

-- Teach-Back Activity
INSERT INTO `piModuleSections` (`moduleId`, `sectionType`, `title`, `content`, `order`) VALUES
(2, 'ai_coach_feedback', 'Teach-Back & AI Coach',
'TEACH-BACK ACTIVITY:
Explain to a business colleague how to analyze a company''s financial health using the three financial statements. Your explanation should:
1. Describe what each statement shows
2. Explain how the three statements connect
3. Provide examples of key metrics and ratios
4. Explain how to identify financial strengths and weaknesses
5. Discuss what red flags to watch for

AI COACH EVALUATION CRITERIA:
• Accuracy of financial concepts
• Clarity of explanation
• Ability to connect the three statements
• Use of appropriate examples
• Understanding of ratio analysis
• Recognition of financial red flags

MASTERY INDICATORS:
✓ Understand the purpose and content of each financial statement
✓ Interpret key financial ratios correctly
✓ Identify trends and patterns in financial data
✓ Assess financial health and creditworthiness
✓ Recognize earnings quality issues
✓ Apply financial analysis to business decisions', 8);

-- ============================================================================
-- Continue with Business Management and Hospitality clusters...
-- (Similar comprehensive structure for each cluster)
-- ============================================================================

-- BUSINESS MANAGEMENT CLUSTER - Module 1
INSERT INTO `piLearningModules` (`piId`, `cluster`, `instructionalArea`, `performanceIndicator`, `level`) VALUES
(3, 'BM-OPS-001', 'Business Management', 'Optimize business processes and operational efficiency', 'Intermediate');

-- Add basic sections for Business Management (abbreviated for space)
INSERT INTO `piModuleSections` (`moduleId`, `sectionType`, `title`, `content`, `order`) VALUES
(3, 'theory', 'Operations Management Fundamentals', 'Operations management focuses on efficiently managing resources and processes to deliver products and services that meet customer needs while maximizing profitability.', 1);

-- HOSPITALITY CLUSTER - Module 1
INSERT INTO `piLearningModules` (`piId`, `cluster`, `instructionalArea`, `performanceIndicator`, `level`) VALUES
(4, 'HSP-CS-001', 'Hospitality', 'Deliver exceptional customer service experiences', 'Beginner');

-- Add basic sections for Hospitality (abbreviated for space)
INSERT INTO `piModuleSections` (`moduleId`, `sectionType`, `title`, `content`, `order`) VALUES
(4, 'theory', 'Customer Service Excellence', 'Exceptional customer service is the foundation of the hospitality industry. It involves understanding and exceeding guest expectations at every interaction.', 1);
