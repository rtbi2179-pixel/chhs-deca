import { invokeLLM } from "../server/_core/llm.js";
import * as fs from "fs";
import * as path from "path";

// Comprehensive DECA structure based on official blueprints
const DECA_STRUCTURE = {
  marketing: {
    name: "Marketing",
    totalQuestions: 6000,
    performanceIndicators: [
      {
        name: "Market Segmentation and Targeting",
        description:
          "Dividing markets into distinct groups and selecting target segments",
        questionsNeeded: 600,
      },
      {
        name: "Marketing Mix - Product",
        description:
          "Product development, features, quality, and lifecycle management",
        questionsNeeded: 500,
      },
      {
        name: "Marketing Mix - Price",
        description:
          "Pricing strategies, elasticity, discounting, and value perception",
        questionsNeeded: 500,
      },
      {
        name: "Marketing Mix - Place",
        description:
          "Distribution channels, logistics, and supply chain management",
        questionsNeeded: 500,
      },
      {
        name: "Marketing Mix - Promotion",
        description:
          "Advertising, sales promotion, public relations, and personal selling",
        questionsNeeded: 500,
      },
      {
        name: "Consumer Behavior and Market Research",
        description:
          "Understanding customer needs, preferences, and decision-making",
        questionsNeeded: 500,
      },
      {
        name: "Brand Management and Positioning",
        description:
          "Building brand identity, equity, and competitive positioning",
        questionsNeeded: 450,
      },
      {
        name: "Selling Techniques and Customer Service",
        description:
          "Sales process, customer retention, and service excellence",
        questionsNeeded: 450,
      },
      {
        name: "Marketing Ethics and Regulations",
        description:
          "Ethical practices, consumer protection, and legal compliance",
        questionsNeeded: 400,
      },
      {
        name: "Marketing Analysis and Planning",
        description:
          "SWOT analysis, market forecasting, and strategic planning",
        questionsNeeded: 400,
      },
    ],
  },
  finance: {
    name: "Finance",
    totalQuestions: 6000,
    performanceIndicators: [
      {
        name: "Financial Statement Analysis",
        description:
          "Analyzing income statements, balance sheets, and cash flow statements",
        questionsNeeded: 700,
      },
      {
        name: "Ratio Analysis and Interpretation",
        description:
          "Liquidity, profitability, efficiency, and leverage ratios",
        questionsNeeded: 700,
      },
      {
        name: "Accounting Principles and Practices",
        description:
          "GAAP, journal entries, ledgers, and financial reporting",
        questionsNeeded: 600,
      },
      {
        name: "Cost Analysis and Management",
        description:
          "Fixed vs variable costs, break-even analysis, and cost control",
        questionsNeeded: 600,
      },
      {
        name: "Investment Analysis and Valuation",
        description:
          "Stock and bond analysis, NPV, IRR, and investment decisions",
        questionsNeeded: 600,
      },
      {
        name: "Time Value of Money",
        description:
          "Present value, future value, annuities, and compound interest",
        questionsNeeded: 500,
      },
      {
        name: "Risk Management and Insurance",
        description:
          "Risk assessment, mitigation strategies, and insurance types",
        questionsNeeded: 450,
      },
      {
        name: "Credit and Debt Management",
        description:
          "Loans, bonds, credit terms, and debt restructuring",
        questionsNeeded: 450,
      },
      {
        name: "Tax Planning and Implications",
        description:
          "Tax types, deductions, credits, and tax-efficient strategies",
        questionsNeeded: 400,
      },
      {
        name: "Financial Forecasting and Budgeting",
        description:
          "Projections, variance analysis, and budget management",
        questionsNeeded: 400,
      },
    ],
  },
  businessAdminCore: {
    name: "Business Administration Core",
    totalQuestions: 6000,
    performanceIndicators: [
      {
        name: "Business Law and Legal Environment",
        description:
          "Contracts, liability, regulations, and legal compliance",
        questionsNeeded: 550,
      },
      {
        name: "Communication Skills",
        description:
          "Written, verbal, and presentation communication in business",
        questionsNeeded: 550,
      },
      {
        name: "Customer Relations and Service",
        description:
          "Customer satisfaction, retention, and complaint resolution",
        questionsNeeded: 500,
      },
      {
        name: "Economics Fundamentals",
        description:
          "Supply and demand, market structures, and economic indicators",
        questionsNeeded: 500,
      },
      {
        name: "Emotional Intelligence",
        description:
          "Self-awareness, empathy, relationship management, and social skills",
        questionsNeeded: 450,
      },
      {
        name: "Entrepreneurship Basics",
        description:
          "Business planning, opportunity identification, and startup concepts",
        questionsNeeded: 500,
      },
      {
        name: "Finance Fundamentals",
        description:
          "Basic accounting, financial statements, and financial analysis",
        questionsNeeded: 500,
      },
      {
        name: "Human Resources Management",
        description:
          "Recruitment, training, performance management, and employee relations",
        questionsNeeded: 500,
      },
      {
        name: "Information Management and Technology",
        description:
          "Data management, cybersecurity, and technology systems",
        questionsNeeded: 450,
      },
      {
        name: "Marketing Fundamentals",
        description:
          "Marketing concepts, consumer behavior, and basic strategies",
        questionsNeeded: 450,
      },
      {
        name: "Operations Management",
        description:
          "Process management, quality control, and efficiency optimization",
        questionsNeeded: 450,
      },
      {
        name: "Professional Development",
        description:
          "Career planning, continuous learning, and professional ethics",
        questionsNeeded: 400,
      },
      {
        name: "Strategic Management",
        description:
          "Strategic planning, competitive analysis, and organizational strategy",
        questionsNeeded: 400,
      },
    ],
  },
  hospitality: {
    name: "Hospitality & Tourism",
    totalQuestions: 6000,
    performanceIndicators: [
      {
        name: "Revenue Management",
        description:
          "RevPAR, ADR, occupancy rates, and yield management strategies",
        questionsNeeded: 600,
      },
      {
        name: "Customer Service Excellence",
        description:
          "Service standards, guest satisfaction, and complaint handling",
        questionsNeeded: 600,
      },
      {
        name: "Hospitality Operations",
        description:
          "Front office, back office, and operational procedures",
        questionsNeeded: 550,
      },
      {
        name: "Food and Beverage Management",
        description:
          "Menu planning, food cost control, and beverage operations",
        questionsNeeded: 500,
      },
      {
        name: "Housekeeping and Maintenance",
        description:
          "Room maintenance, cleaning standards, and facility management",
        questionsNeeded: 450,
      },
      {
        name: "Sales and Marketing for Hospitality",
        description:
          "Hospitality marketing, sales techniques, and promotional strategies",
        questionsNeeded: 500,
      },
      {
        name: "Human Resources in Hospitality",
        description:
          "Staff recruitment, training, scheduling, and retention",
        questionsNeeded: 450,
      },
      {
        name: "Financial Management for Hospitality",
        description:
          "Budgeting, cost control, and financial analysis specific to hospitality",
        questionsNeeded: 450,
      },
      {
        name: "Quality Assurance and Standards",
        description:
          "Quality control, inspection, and compliance with standards",
        questionsNeeded: 400,
      },
      {
        name: "Risk Management and Safety",
        description:
          "Safety protocols, liability, insurance, and emergency procedures",
        questionsNeeded: 400,
      },
      {
        name: "Sustainability and Environmental Responsibility",
        description:
          "Green practices, waste management, and sustainable operations",
        questionsNeeded: 400,
      },
      {
        name: "Technology in Hospitality",
        description:
          "PMS systems, booking platforms, and hospitality technology",
        questionsNeeded: 300,
      },
    ],
  },
  management: {
    name: "Management",
    totalQuestions: 6000,
    performanceIndicators: [
      {
        name: "Human Resources Management",
        description:
          "Recruitment, selection, training, development, and retention",
        questionsNeeded: 700,
      },
      {
        name: "Organizational Behavior",
        description:
          "Individual behavior, group dynamics, and organizational culture",
        questionsNeeded: 600,
      },
      {
        name: "Leadership and Motivation",
        description:
          "Leadership styles, motivation theories, and influence",
        questionsNeeded: 600,
      },
      {
        name: "Team Dynamics and Conflict Resolution",
        description:
          "Team building, communication, and conflict management",
        questionsNeeded: 550,
      },
      {
        name: "Performance Management",
        description:
          "Performance appraisal, feedback, and performance improvement",
        questionsNeeded: 500,
      },
      {
        name: "Compensation and Benefits",
        description:
          "Salary structures, benefits design, and compensation strategy",
        questionsNeeded: 450,
      },
      {
        name: "Labor Relations and Legal Compliance",
        description:
          "Employment law, labor regulations, and union relations",
        questionsNeeded: 450,
      },
      {
        name: "Strategic Management",
        description:
          "Strategic planning, competitive advantage, and organizational strategy",
        questionsNeeded: 450,
      },
      {
        name: "Operations Management",
        description:
          "Process improvement, efficiency, and operational excellence",
        questionsNeeded: 400,
      },
      {
        name: "Decision-Making and Problem-Solving",
        description:
          "Analytical approaches, decision models, and problem resolution",
        questionsNeeded: 400,
      },
      {
        name: "Change Management",
        description:
          "Organizational change, resistance management, and transformation",
        questionsNeeded: 350,
      },
      {
        name: "Organizational Structure and Design",
        description:
          "Hierarchy, departmentalization, and organizational design",
        questionsNeeded: 300,
      },
    ],
  },
  entrepreneurship: {
    name: "Entrepreneurship",
    totalQuestions: 6000,
    performanceIndicators: [
      {
        name: "Business Planning and Feasibility",
        description:
          "Business plans, feasibility analysis, and startup planning",
        questionsNeeded: 600,
      },
      {
        name: "Market Research and Opportunity Identification",
        description:
          "Market analysis, opportunity assessment, and market validation",
        questionsNeeded: 600,
      },
      {
        name: "Financial Projections and Funding",
        description:
          "Financial forecasts, funding sources, and capital requirements",
        questionsNeeded: 550,
      },
      {
        name: "Product and Service Development",
        description:
          "Innovation, product development, and service design",
        questionsNeeded: 500,
      },
      {
        name: "Marketing and Sales Strategies",
        description:
          "Go-to-market strategy, customer acquisition, and sales",
        questionsNeeded: 500,
      },
      {
        name: "Operations Planning",
        description:
          "Supply chain, production, and operational setup",
        questionsNeeded: 450,
      },
      {
        name: "Risk Assessment and Mitigation",
        description:
          "Risk identification, assessment, and mitigation strategies",
        questionsNeeded: 450,
      },
      {
        name: "Legal and Regulatory Requirements",
        description:
          "Business structure, licensing, permits, and compliance",
        questionsNeeded: 400,
      },
      {
        name: "Competitive Analysis",
        description:
          "Competitive landscape, differentiation, and positioning",
        questionsNeeded: 400,
      },
      {
        name: "Growth and Scaling Strategies",
        description:
          "Expansion, scaling, and growth management",
        questionsNeeded: 400,
      },
      {
        name: "Innovation and Adaptation",
        description:
          "Innovation management, adaptation, and continuous improvement",
        questionsNeeded: 350,
      },
      {
        name: "Entrepreneurial Mindset and Ethics",
        description:
          "Entrepreneurial traits, ethics, and social responsibility",
        questionsNeeded: 300,
      },
    ],
  },
  pfl: {
    name: "Personal Financial Literacy",
    totalQuestions: 4000,
    performanceIndicators: [
      {
        name: "Income and Earning Potential",
        description:
          "Earned income, passive income, and career earning potential",
        questionsNeeded: 450,
      },
      {
        name: "Budgeting and Spending Management",
        description:
          "Budget creation, expense tracking, and spending control",
        questionsNeeded: 450,
      },
      {
        name: "Saving and Investment Strategies",
        description:
          "Savings accounts, investment vehicles, and wealth building",
        questionsNeeded: 450,
      },
      {
        name: "Credit and Debt Management",
        description:
          "Credit scores, loans, credit cards, and debt repayment",
        questionsNeeded: 450,
      },
      {
        name: "Insurance and Risk Management",
        description:
          "Insurance types, coverage, and risk protection",
        questionsNeeded: 400,
      },
      {
        name: "Retirement Planning",
        description:
          "Retirement accounts, savings strategies, and retirement income",
        questionsNeeded: 400,
      },
      {
        name: "Tax Planning and Management",
        description:
          "Tax basics, deductions, credits, and tax-efficient strategies",
        questionsNeeded: 350,
      },
      {
        name: "Financial Goals and Planning",
        description:
          "Goal setting, financial planning, and milestone tracking",
        questionsNeeded: 350,
      },
      {
        name: "Consumer Protection and Rights",
        description:
          "Consumer rights, fraud prevention, and financial protection",
        questionsNeeded: 300,
      },
      {
        name: "Financial Decision-Making",
        description:
          "Financial analysis, decision-making, and financial literacy",
        questionsNeeded: 300,
      },
    ],
  },
};

const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];

async function generateQuestionsForPI(cluster, pi, difficulty, count) {
  const prompt = `You are an expert DECA exam question generator with deep knowledge of DECA's official exam standards and performance indicators.

Generate exactly ${count} authentic, high-quality multiple-choice questions for the ${cluster.name} cluster.

Performance Indicator: "${pi.name}"
Description: ${pi.description}
Difficulty Level: ${difficulty}

CRITICAL REQUIREMENTS:
1. Use DECA's official terminology and business language
2. Test real-world business scenarios and decision-making
3. Each question must have ONE clear correct answer
4. Include plausible distractors that test common misconceptions
5. Questions must vary in type: definitions, calculations, scenarios, comparisons
6. For calculations: use realistic business numbers and show methodology
7. Ensure questions are at the specified difficulty level
8. Vary contexts and industries to maintain engagement
9. Each question must genuinely test the specified Performance Indicator

Return ONLY a valid JSON array with exactly ${count} question objects. Each object must have this exact structure:
{
  "question": "The question text?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswerIndex": 0,
  "explanation": "Detailed explanation of why this answer is correct and why others are wrong..."
}

Generate ${count} questions now. Return ONLY the JSON array, no other text.`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are a DECA exam expert. Generate only valid JSON arrays of questions. Each question tests a specific DECA Performance Indicator with authentic business scenarios.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/\[[\s\S]*\]/);

    if (!jsonMatch) {
      console.error(
        `Failed to extract JSON for ${cluster.name} - ${pi.name} (${difficulty})`
      );
      return [];
    }

    const questions = JSON.parse(jsonMatch[0]);
    return questions.map((q) => ({
      ...q,
      cluster: cluster.name,
      performanceIndicator: pi.name,
      difficulty,
    }));
  } catch (error) {
    console.error(
      `Error generating questions for ${pi.name}:`,
      error.message
    );
    return [];
  }
}

async function generateAllQuestions() {
  const allQuestions = [];
  let totalGenerated = 0;
  let startTime = Date.now();

  console.log("🚀 Starting comprehensive DECA question generation...\n");

  for (const [clusterKey, cluster] of Object.entries(DECA_STRUCTURE)) {
    console.log(`\n📚 ${cluster.name} Cluster (Target: ${cluster.totalQuestions} questions)`);

    for (const pi of cluster.performanceIndicators) {
      console.log(`  📖 ${pi.name}`);

      // Generate questions for each difficulty level proportionally
      const questionsPerDifficulty = Math.ceil(pi.questionsNeeded / 3);

      for (const difficulty of DIFFICULTIES) {
        const questions = await generateQuestionsForPI(
          cluster,
          pi,
          difficulty,
          questionsPerDifficulty
        );

        allQuestions.push(...questions);
        totalGenerated += questions.length;

        console.log(
          `    ✓ ${difficulty}: ${questions.length} questions (Total: ${totalGenerated})`
        );

        // Rate limiting - wait between requests
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  const elapsedTime = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
  console.log(`\n✅ Generation complete in ${elapsedTime} minutes`);
  console.log(`📊 Total questions generated: ${totalGenerated}`);

  return allQuestions;
}

async function saveQuestionsToDatabase(questions) {
  const outputDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputFile = path.join(outputDir, "deca-questions-full.json");
  fs.writeFileSync(outputFile, JSON.stringify(questions, null, 2));

  console.log(`\n💾 Questions saved to: ${outputFile}`);

  // Generate comprehensive statistics
  const stats = {
    totalQuestions: questions.length,
    byCluster: {},
    byDifficulty: {},
    byPerformanceIndicator: {},
  };

  for (const q of questions) {
    stats.byCluster[q.cluster] = (stats.byCluster[q.cluster] || 0) + 1;
    stats.byDifficulty[q.difficulty] =
      (stats.byDifficulty[q.difficulty] || 0) + 1;
    const piKey = `${q.cluster} - ${q.performanceIndicator}`;
    stats.byPerformanceIndicator[piKey] =
      (stats.byPerformanceIndicator[piKey] || 0) + 1;
  }

  const statsFile = path.join(outputDir, "deca-questions-stats.json");
  fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));

  console.log("\n📊 Statistics Summary:");
  console.log("By Cluster:", stats.byCluster);
  console.log("By Difficulty:", stats.byDifficulty);
  console.log(`\nDetailed stats saved to: ${statsFile}`);
}

async function main() {
  try {
    const questions = await generateAllQuestions();
    await saveQuestionsToDatabase(questions);
    console.log("\n🎉 All questions successfully generated and saved!");
  } catch (error) {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  }
}

main();
