#!/usr/bin/env python3
"""
DECA Question Generation Script
Generates 40,000+ authentic DECA-aligned practice questions
"""

import json
import os
import sys
import time
import requests
from pathlib import Path

# Get API credentials
FORGE_API_URL = os.environ.get("BUILT_IN_FORGE_API_URL")
FORGE_API_KEY = os.environ.get("BUILT_IN_FORGE_API_KEY")

if not FORGE_API_URL or not FORGE_API_KEY:
    print("❌ Missing BUILT_IN_FORGE_API_URL or BUILT_IN_FORGE_API_KEY environment variables")
    sys.exit(1)

# DECA Structure
DECA_STRUCTURE = {
    "marketing": {
        "name": "Marketing",
        "totalQuestions": 6000,
        "performanceIndicators": [
            {
                "name": "Market Segmentation and Targeting",
                "description": "Dividing markets into distinct groups and selecting target segments",
                "questionsNeeded": 600,
            },
            {
                "name": "Marketing Mix - Product",
                "description": "Product development, features, quality, and lifecycle management",
                "questionsNeeded": 500,
            },
            {
                "name": "Marketing Mix - Price",
                "description": "Pricing strategies, elasticity, discounting, and value perception",
                "questionsNeeded": 500,
            },
            {
                "name": "Marketing Mix - Place",
                "description": "Distribution channels, logistics, and supply chain management",
                "questionsNeeded": 500,
            },
            {
                "name": "Marketing Mix - Promotion",
                "description": "Advertising, sales promotion, public relations, and personal selling",
                "questionsNeeded": 500,
            },
            {
                "name": "Consumer Behavior and Market Research",
                "description": "Understanding customer needs, preferences, and decision-making",
                "questionsNeeded": 500,
            },
            {
                "name": "Brand Management and Positioning",
                "description": "Building brand identity, equity, and competitive positioning",
                "questionsNeeded": 450,
            },
            {
                "name": "Selling Techniques and Customer Service",
                "description": "Sales process, customer retention, and service excellence",
                "questionsNeeded": 450,
            },
            {
                "name": "Marketing Ethics and Regulations",
                "description": "Ethical practices, consumer protection, and legal compliance",
                "questionsNeeded": 400,
            },
            {
                "name": "Marketing Analysis and Planning",
                "description": "SWOT analysis, market forecasting, and strategic planning",
                "questionsNeeded": 400,
            },
        ],
    },
    "finance": {
        "name": "Finance",
        "totalQuestions": 6000,
        "performanceIndicators": [
            {
                "name": "Financial Statement Analysis",
                "description": "Analyzing income statements, balance sheets, and cash flow statements",
                "questionsNeeded": 700,
            },
            {
                "name": "Ratio Analysis and Interpretation",
                "description": "Liquidity, profitability, efficiency, and leverage ratios",
                "questionsNeeded": 700,
            },
            {
                "name": "Accounting Principles and Practices",
                "description": "GAAP, journal entries, ledgers, and financial reporting",
                "questionsNeeded": 600,
            },
            {
                "name": "Cost Analysis and Management",
                "description": "Fixed vs variable costs, break-even analysis, and cost control",
                "questionsNeeded": 600,
            },
            {
                "name": "Investment Analysis and Valuation",
                "description": "Stock and bond analysis, NPV, IRR, and investment decisions",
                "questionsNeeded": 600,
            },
            {
                "name": "Time Value of Money",
                "description": "Present value, future value, annuities, and compound interest",
                "questionsNeeded": 500,
            },
            {
                "name": "Risk Management and Insurance",
                "description": "Risk assessment, mitigation strategies, and insurance types",
                "questionsNeeded": 450,
            },
            {
                "name": "Credit and Debt Management",
                "description": "Loans, bonds, credit terms, and debt restructuring",
                "questionsNeeded": 450,
            },
            {
                "name": "Tax Planning and Implications",
                "description": "Tax types, deductions, credits, and tax-efficient strategies",
                "questionsNeeded": 400,
            },
            {
                "name": "Financial Forecasting and Budgeting",
                "description": "Projections, variance analysis, and budget management",
                "questionsNeeded": 400,
            },
        ],
    },
}

DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"]


def invoke_llm(messages):
    """Call the LLM API to generate questions"""
    payload = {
        "model": "gpt-4o-mini",
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 4000,
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {FORGE_API_KEY}",
    }

    response = requests.post(
        f"{FORGE_API_URL}/v1/chat/completions",
        json=payload,
        headers=headers,
        timeout=60,
    )

    if response.status_code != 200:
        raise Exception(
            f"LLM API error: {response.status_code} {response.text}"
        )

    return response.json()


def generate_questions_for_pi(cluster, pi, difficulty, count):
    """Generate questions for a specific Performance Indicator"""
    prompt = f"""You are an expert DECA exam question generator with deep knowledge of DECA's official exam standards.

Generate exactly {count} authentic, high-quality multiple-choice questions for the {cluster['name']} cluster.

Performance Indicator: "{pi['name']}"
Description: {pi['description']}
Difficulty Level: {difficulty}

CRITICAL REQUIREMENTS:
1. Use DECA's official terminology and business language
2. Test real-world business scenarios and decision-making
3. Each question must have ONE clear correct answer
4. Include plausible distractors that test common misconceptions
5. Questions must vary in type: definitions, calculations, scenarios, comparisons
6. For calculations: use realistic business numbers
7. Ensure questions are at the specified difficulty level
8. Each question must genuinely test the specified Performance Indicator

Return ONLY a valid JSON array with exactly {count} question objects. Each object must have this exact structure:
{{
  "question": "The question text?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswerIndex": 0,
  "explanation": "Detailed explanation..."
}}

Generate {count} questions now. Return ONLY the JSON array, no other text."""

    try:
        response = invoke_llm(
            [
                {
                    "role": "system",
                    "content": "You are a DECA exam expert. Generate only valid JSON arrays of questions.",
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ]
        )

        content = response["choices"][0]["message"]["content"]
        
        # Extract JSON from response
        import re
        json_match = re.search(r'\[[\s\S]*\]', content)
        
        if not json_match:
            print(f"❌ Failed to extract JSON for {cluster['name']} - {pi['name']} ({difficulty})")
            return []

        questions = json.loads(json_match.group())
        return [
            {
                **q,
                "cluster": cluster["name"],
                "performanceIndicator": pi["name"],
                "difficulty": difficulty,
            }
            for q in questions
        ]

    except Exception as e:
        print(f"❌ Error generating questions for {pi['name']}: {str(e)}")
        return []


def generate_all_questions():
    """Generate all DECA questions"""
    all_questions = []
    total_generated = 0
    start_time = time.time()

    print("🚀 Starting DECA question generation...\n")

    for cluster_key, cluster in DECA_STRUCTURE.items():
        print(f"\n📚 {cluster['name']} Cluster (Target: {cluster['totalQuestions']} questions)")

        for pi in cluster["performanceIndicators"]:
            print(f"  📖 {pi['name']}")

            questions_per_difficulty = (pi["questionsNeeded"] + 2) // 3

            for difficulty in DIFFICULTIES:
                questions = generate_questions_for_pi(
                    cluster, pi, difficulty, questions_per_difficulty
                )

                all_questions.extend(questions)
                total_generated += len(questions)

                print(
                    f"    ✓ {difficulty}: {len(questions)} questions (Total: {total_generated})"
                )

                # Rate limiting
                time.sleep(1)

    elapsed_time = (time.time() - start_time) / 60
    print(f"\n✅ Generation complete in {elapsed_time:.2f} minutes")
    print(f"📊 Total questions generated: {total_generated}")

    return all_questions


def save_questions(questions):
    """Save questions to file"""
    output_dir = Path("data")
    output_dir.mkdir(exist_ok=True)

    output_file = output_dir / "deca-questions.json"
    with open(output_file, "w") as f:
        json.dump(questions, f, indent=2)

    print(f"\n💾 Questions saved to: {output_file}")

    # Generate statistics
    stats = {
        "totalQuestions": len(questions),
        "byCluster": {},
        "byDifficulty": {},
    }

    for q in questions:
        cluster = q["cluster"]
        difficulty = q["difficulty"]
        stats["byCluster"][cluster] = stats["byCluster"].get(cluster, 0) + 1
        stats["byDifficulty"][difficulty] = stats["byDifficulty"].get(difficulty, 0) + 1

    print("\n📊 Statistics:")
    print("By Cluster:", stats["byCluster"])
    print("By Difficulty:", stats["byDifficulty"])


def main():
    try:
        questions = generate_all_questions()
        save_questions(questions)
        print("\n🎉 Question generation complete!")
    except Exception as e:
        print(f"❌ Fatal error: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()
