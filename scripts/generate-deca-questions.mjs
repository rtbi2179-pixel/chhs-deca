import { invokeLLM } from "../server/_core/llm.js";
import * as fs from "fs";
import * as path from "path";

// DECA Clusters and their Performance Indicators
const CLUSTERS = {
  marketing: {
    name: "Marketing",
    pis: [
      "Market Segmentation and Targeting",
      "Marketing Mix (Product, Price, Place, Promotion)",
      "Consumer Behavior and Market Research",
      "Channel Management and Distribution",
      "Pricing Strategies",
      "Promotional Campaigns and Advertising",
      "Brand Management and Positioning",
      "Product Lifecycle Management",
      "Selling Techniques and Customer Service",
      "Marketing Ethics and Regulations",
    ],
    questionsPerPI: 600,
  },
  finance: {
    name: "Finance",
    pis: [
      "Financial Statement Analysis",
      "Ratio Analysis",
      "Accounting Principles",
      "Cost Analysis",
      "Investment Analysis",
      "Time Value of Money",
      "Risk Management and Insurance",
      "Credit and Debt Management",
      "Tax Implications",
      "Financial Forecasting",
    ],
    questionsPerPI: 600,
  },
  businessAdminCore: {
    name: "Business Administration Core",
    pis: [
      "Business Law and Regulations",
      "Communication Skills",
      "Customer Relations",
      "Economics",
      "Emotional Intelligence",
      "Entrepreneurship",
      "Finance Fundamentals",
      "Human Resources Management",
      "Information Management",
      "Marketing Basics",
      "Operations Management",
      "Professional Development",
      "Strategic Management",
    ],
    questionsPerPI: 460,
  },
  hospitality: {
    name: "Hospitality & Tourism",
    pis: [
      "Revenue Management",
      "Customer Service Excellence",
      "Hospitality Operations",
      "Food and Beverage Management",
      "Housekeeping and Maintenance",
      "Front Office Operations",
      "Sales and Marketing for Hospitality",
      "Human Resources in Hospitality",
      "Financial Management",
      "Quality Assurance",
      "Risk Management",
      "Sustainability",
    ],
    questionsPerPI: 500,
  },
  management: {
    name: "Management",
    pis: [
      "Human Resources Management",
      "Organizational Behavior",
      "Leadership and Motivation",
      "Team Dynamics",
      "Performance Management",
      "Compensation and Benefits",
      "Recruitment and Selection",
      "Training and Development",
      "Labor Relations",
      "Strategic Management",
      "Operations Management",
      "Decision-Making",
    ],
    questionsPerPI: 500,
  },
  entrepreneurship: {
    name: "Entrepreneurship",
    pis: [
      "Business Planning",
      "Market Research",
      "Financial Projections",
      "Product Development",
      "Marketing Strategies",
      "Operations Planning",
      "Risk Assessment",
      "Legal and Regulatory Requirements",
      "Competitive Analysis",
      "Growth Strategies",
      "Innovation",
    ],
    questionsPerPI: 545,
  },
  pfl: {
    name: "Personal Financial Literacy",
    pis: [
      "Income and Earning Potential",
      "Budgeting and Spending",
      "Saving and Investment",
      "Credit and Debt",
      "Insurance and Risk",
      "Retirement Planning",
      "Tax Planning",
      "Financial Goals",
      "Consumer Protection",
      "Financial Decision-Making",
    ],
    questionsPerPI: 400,
  },
};

const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];
const QUESTION_TYPES = [
  "Concept Definition",
  "Scenario-Based Decision",
  "Calculation Analysis",
  "Comparison Exclusion",
];

async function generateQuestionsForPI(
  cluster,
  clusterName,
  pi,
  count,
  difficulty
) {
  const prompt = `You are a DECA exam question generator. Generate exactly 5 high-quality multiple-choice questions for the ${clusterName} cluster, specifically testing the Performance Indicator: "${pi}".

Requirements:
1. Each question must be authentic to DECA standards and use professional business terminology
2. Questions should test real-world business scenarios and decision-making
3. Difficulty level: ${difficulty}
4. Format each question as JSON with this structure:
{
  "question": "The question text here?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswerIndex": 0,
  "explanation": "Detailed explanation of why this is correct..."
}

5. Vary question types: mix concept definitions, scenario-based decisions, calculations, and comparisons
6. Use DECA-appropriate examples and business contexts
7. Ensure each question has one clear correct answer and plausible distractors
8. For calculations, include realistic numbers and show the methodology in the explanation

Generate 5 questions now. Return ONLY a valid JSON array with 5 question objects, no additional text.`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are a DECA exam expert creating authentic practice questions. Return only valid JSON arrays.",
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
      console.error(`Failed to extract JSON for ${clusterName} - ${pi}`);
      return [];
    }

    const questions = JSON.parse(jsonMatch[0]);
    return questions.map((q) => ({
      ...q,
      cluster,
      clusterName,
      performanceIndicator: pi,
      difficulty,
    }));
  } catch (error) {
    console.error(`Error generating questions for ${pi}:`, error.message);
    return [];
  }
}

async function generateAllQuestions() {
  const allQuestions = [];
  let totalGenerated = 0;

  console.log("Starting DECA question generation...\n");

  for (const [clusterKey, clusterData] of Object.entries(CLUSTERS)) {
    console.log(`\n📚 Processing ${clusterData.name} cluster...`);

    for (const pi of clusterData.pis) {
      console.log(`  📖 Generating questions for: ${pi}`);

      // Generate questions for each difficulty level
      for (const difficulty of DIFFICULTIES) {
        const questionsPerDifficulty = Math.ceil(
          clusterData.questionsPerPI / DIFFICULTIES.length
        );

        const questions = await generateQuestionsForPI(
          clusterKey,
          clusterData.name,
          pi,
          questionsPerDifficulty,
          difficulty
        );

        allQuestions.push(...questions);
        totalGenerated += questions.length;

        console.log(
          `    ✓ Generated ${questions.length} ${difficulty} questions`
        );

        // Add delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  }

  console.log(`\n✅ Total questions generated: ${totalGenerated}`);
  return allQuestions;
}

async function saveQuestionsToFile(questions) {
  const outputDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputFile = path.join(outputDir, "deca-questions.json");
  fs.writeFileSync(outputFile, JSON.stringify(questions, null, 2));

  console.log(`\n💾 Questions saved to: ${outputFile}`);
  console.log(`   Total questions: ${questions.length}`);

  // Generate summary statistics
  const summary = {
    totalQuestions: questions.length,
    byCluster: {},
    byDifficulty: {},
  };

  for (const q of questions) {
    summary.byCluster[q.clusterName] =
      (summary.byCluster[q.clusterName] || 0) + 1;
    summary.byDifficulty[q.difficulty] =
      (summary.byDifficulty[q.difficulty] || 0) + 1;
  }

  console.log("\n📊 Summary Statistics:");
  console.log("By Cluster:", summary.byCluster);
  console.log("By Difficulty:", summary.byDifficulty);
}

async function main() {
  try {
    const questions = await generateAllQuestions();
    await saveQuestionsToFile(questions);
    console.log("\n🎉 Question generation complete!");
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

main();
