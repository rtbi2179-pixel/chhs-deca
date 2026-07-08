import fetch from "node-fetch";
import * as fs from "fs";
import * as path from "path";

// Get API credentials from environment
const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL;
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

if (!FORGE_API_URL || !FORGE_API_KEY) {
  console.error("❌ Missing BUILT_IN_FORGE_API_URL or BUILT_IN_FORGE_API_KEY environment variables");
  process.exit(1);
}

// Comprehensive DECA structure
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
};

const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];

async function invokeLLM(messages) {
  const payload = {
    model: "gpt-4o-mini",
    messages: messages,
    temperature: 0.7,
    max_tokens: 4000,
  };

  const response = await fetch(`${FORGE_API_URL}/llm/invoke`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${FORGE_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`LLM API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

async function generateQuestionsForPI(cluster, pi, difficulty, count) {
  const prompt = `You are an expert DECA exam question generator with deep knowledge of DECA's official exam standards.

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
6. For calculations: use realistic business numbers
7. Ensure questions are at the specified difficulty level
8. Each question must genuinely test the specified Performance Indicator

Return ONLY a valid JSON array with exactly ${count} question objects. Each object must have this exact structure:
{
  "question": "The question text?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswerIndex": 0,
  "explanation": "Detailed explanation..."
}

Generate ${count} questions now. Return ONLY the JSON array, no other text.`;

  try {
    const response = await invokeLLM([
      {
        role: "system",
        content:
          "You are a DECA exam expert. Generate only valid JSON arrays of questions.",
      },
      {
        role: "user",
        content: prompt,
      },
    ]);

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

  console.log("🚀 Starting DECA question generation...\n");

  for (const [clusterKey, cluster] of Object.entries(DECA_STRUCTURE)) {
    console.log(
      `\n📚 ${cluster.name} Cluster (Target: ${cluster.totalQuestions} questions)`
    );

    for (const pi of cluster.performanceIndicators) {
      console.log(`  📖 ${pi.name}`);

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

        // Rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  const elapsedTime = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
  console.log(`\n✅ Generation complete in ${elapsedTime} minutes`);
  console.log(`📊 Total questions generated: ${totalGenerated}`);

  return allQuestions;
}

async function saveQuestions(questions) {
  const outputDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputFile = path.join(outputDir, "deca-questions.json");
  fs.writeFileSync(outputFile, JSON.stringify(questions, null, 2));

  console.log(`\n💾 Questions saved to: ${outputFile}`);

  const stats = {
    totalQuestions: questions.length,
    byCluster: {},
    byDifficulty: {},
  };

  for (const q of questions) {
    stats.byCluster[q.cluster] = (stats.byCluster[q.cluster] || 0) + 1;
    stats.byDifficulty[q.difficulty] =
      (stats.byDifficulty[q.difficulty] || 0) + 1;
  }

  console.log("\n📊 Statistics:");
  console.log("By Cluster:", stats.byCluster);
  console.log("By Difficulty:", stats.byDifficulty);
}

async function main() {
  try {
    const questions = await generateAllQuestions();
    await saveQuestions(questions);
    console.log("\n🎉 Question generation complete!");
  } catch (error) {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  }
}

main();
