
import { getDb } from "../server/db.ts";
import { questions } from "../drizzle/schema.ts";
import fs from "node:fs/promises";
import path from "node:path";

const seedQuestions = async () => {
  try {
    const filePath = path.join(process.cwd(), "data", "deca_questions_structured.json");
    const data = await fs.readFile(filePath, "utf-8");
    const structuredQuestions = JSON.parse(data);

    if (structuredQuestions.length === 0) {
      console.log("No questions to seed.");
      return;
    }

    console.log(`Seeding ${structuredQuestions.length} questions...`);

    const db = await getDb();
    if (!db) {
      console.error("Database not available. Cannot seed questions.");
      process.exit(1);
    }

    // Clear existing questions to prevent duplicates on re-run
    await db.delete(questions);
    console.log("Cleared existing questions.");

    // Insert questions in batches for better performance
    const batchSize = 50;
    for (let i = 0; i < structuredQuestions.length; i += batchSize) {
      const batch = structuredQuestions.slice(i, i + batchSize);
      await db.insert(questions).values(batch);
      console.log(`Inserted batch ${i / batchSize + 1}/${Math.ceil(structuredQuestions.length / batchSize)}`);
    }

    console.log("Questions seeding complete!");
  } catch (error) {
    console.error("Error seeding questions:", error);
    process.exit(1);
  }
};

seedQuestions();
