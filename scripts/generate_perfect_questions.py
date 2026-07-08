#!/usr/bin/env python3
"""
DECA Perfect Question Generation Script
Generates 40,000+ authentic DECA-aligned practice questions with guaranteed JSON validity
Uses structured output with JSON schema to ensure perfect formatting
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

# Complete DECA structure with all clusters and PIs
DECA_STRUCTURE = {
    "marketing": {
        "name": "Marketing",
        "performanceIndicators": [
            ("Market Segmentation and Targeting", "Dividing markets into distinct groups and selecting target segments", 600),
            ("Marketing Mix - Product", "Product development, features, quality, and lifecycle management", 500),
            ("Marketing Mix - Price", "Pricing strategies, elasticity, discounting, and value perception", 500),
            ("Marketing Mix - Place", "Distribution channels, logistics, and supply chain management", 500),
            ("Marketing Mix - Promotion", "Advertising, sales promotion, public relations, and personal selling", 500),
            ("Consumer Behavior and Market Research", "Understanding customer needs, preferences, and decision-making", 500),
            ("Brand Management and Positioning", "Building brand identity, equity, and competitive positioning", 450),
            ("Selling Techniques and Customer Service", "Sales process, customer retention, and service excellence", 450),
            ("Marketing Ethics and Regulations", "Ethical practices, consumer protection, and legal compliance", 400),
            ("Marketing Analysis and Planning", "SWOT analysis, market forecasting, and strategic planning", 400),
        ],
    },
    "finance": {
        "name": "Finance",
        "performanceIndicators": [
            ("Financial Statement Analysis", "Analyzing income statements, balance sheets, and cash flow statements", 700),
            ("Ratio Analysis and Interpretation", "Liquidity, profitability, efficiency, and leverage ratios", 700),
            ("Accounting Principles and Practices", "GAAP, journal entries, ledgers, and financial reporting", 600),
            ("Cost Analysis and Management", "Fixed vs variable costs, break-even analysis, and cost control", 600),
            ("Investment Analysis and Valuation", "Stock and bond analysis, NPV, IRR, and investment decisions", 600),
            ("Time Value of Money", "Present value, future value, annuities, and compound interest", 500),
            ("Risk Management and Insurance", "Risk assessment, mitigation strategies, and insurance types", 450),
            ("Credit and Debt Management", "Loans, bonds, credit terms, and debt restructuring", 450),
            ("Tax Planning and Implications", "Tax types, deductions, credits, and tax-efficient strategies", 400),
            ("Financial Forecasting and Budgeting", "Projections, variance analysis, and budget management", 400),
        ],
    },
    "businessAdminCore": {
        "name": "Business Administration Core",
        "performanceIndicators": [
            ("Business Law and Legal Environment", "Contracts, liability, regulations, and legal compliance", 550),
            ("Communication Skills", "Written, verbal, and presentation communication in business", 550),
            ("Customer Relations and Service", "Customer satisfaction, retention, and complaint resolution", 500),
            ("Economics Fundamentals", "Supply and demand, market structures, and economic indicators", 500),
            ("Emotional Intelligence", "Self-awareness, empathy, relationship management, and social skills", 450),
            ("Entrepreneurship Basics", "Business planning, opportunity identification, and startup concepts", 500),
            ("Finance Fundamentals", "Basic accounting, financial statements, and financial analysis", 500),
            ("Human Resources Management", "Recruitment, training, performance management, and employee relations", 500),
            ("Information Management and Technology", "Data management, cybersecurity, and technology systems", 450),
            ("Marketing Fundamentals", "Marketing concepts, consumer behavior, and basic strategies", 450),
            ("Operations Management", "Process management, quality control, and efficiency optimization", 450),
            ("Professional Development", "Career planning, continuous learning, and professional ethics", 400),
            ("Strategic Management", "Strategic planning, competitive analysis, and organizational strategy", 400),
        ],
    },
    "hospitality": {
        "name": "Hospitality & Tourism",
        "performanceIndicators": [
            ("Revenue Management", "RevPAR, ADR, occupancy rates, and yield management strategies", 600),
            ("Customer Service Excellence", "Service standards, guest satisfaction, and complaint handling", 600),
            ("Hospitality Operations", "Front office, back office, and operational procedures", 550),
            ("Food and Beverage Management", "Menu planning, food cost control, and beverage operations", 500),
            ("Housekeeping and Maintenance", "Room maintenance, cleaning standards, and facility management", 450),
            ("Sales and Marketing for Hospitality", "Hospitality marketing, sales techniques, and promotional strategies", 500),
            ("Human Resources in Hospitality", "Staff recruitment, training, scheduling, and retention", 450),
            ("Financial Management for Hospitality", "Budgeting, cost control, and financial analysis specific to hospitality", 450),
            ("Quality Assurance and Standards", "Quality control, inspection, and compliance with standards", 400),
            ("Risk Management and Safety", "Safety protocols, liability, insurance, and emergency procedures", 400),
            ("Sustainability and Environmental Responsibility", "Green practices, waste management, and sustainable operations", 400),
            ("Technology in Hospitality", "PMS systems, booking platforms, and hospitality technology", 300),
        ],
    },
    "management": {
        "name": "Management",
        "performanceIndicators": [
            ("Human Resources Management", "Recruitment, selection, training, development, and retention", 700),
            ("Organizational Behavior", "Individual behavior, group dynamics, and organizational culture", 600),
            ("Leadership and Motivation", "Leadership styles, motivation theories, and influence", 600),
            ("Team Dynamics and Conflict Resolution", "Team building, communication, and conflict management", 550),
            ("Performance Management", "Performance appraisal, feedback, and performance improvement", 500),
            ("Compensation and Benefits", "Salary structures, benefits design, and compensation strategy", 450),
            ("Labor Relations and Legal Compliance", "Employment law, labor regulations, and union relations", 450),
            ("Strategic Management", "Strategic planning, competitive advantage, and organizational strategy", 450),
            ("Operations Management", "Process improvement, efficiency, and operational excellence", 400),
            ("Decision-Making and Problem-Solving", "Analytical approaches, decision models, and problem resolution", 400),
            ("Change Management", "Organizational change, resistance management, and transformation", 350),
            ("Organizational Structure and Design", "Hierarchy, departmentalization, and organizational design", 300),
        ],
    },
    "entrepreneurship": {
        "name": "Entrepreneurship",
        "performanceIndicators": [
            ("Business Planning and Feasibility", "Business plans, feasibility analysis, and startup planning", 600),
            ("Market Research and Opportunity Identification", "Market analysis, opportunity assessment, and market validation", 600),
            ("Financial Projections and Funding", "Financial forecasts, funding sources, and capital requirements", 550),
            ("Product and Service Development", "Innovation, product development, and service design", 500),
            ("Marketing and Sales Strategies", "Go-to-market strategy, customer acquisition, and sales", 500),
            ("Operations Planning", "Supply chain, production, and operational setup", 450),
            ("Risk Assessment and Mitigation", "Risk identification, assessment, and mitigation strategies", 450),
            ("Legal and Regulatory Requirements", "Business structure, licensing, permits, and compliance", 400),
            ("Competitive Analysis", "Competitive landscape, differentiation, and positioning", 400),
            ("Growth and Scaling Strategies", "Expansion, scaling, and growth management", 400),
            ("Innovation and Adaptation", "Innovation management, adaptation, and continuous improvement", 350),
            ("Entrepreneurial Mindset and Ethics", "Entrepreneurial traits, ethics, and social responsibility", 300),
        ],
    },
    "pfl": {
        "name": "Personal Financial Literacy",
        "performanceIndicators": [
            ("Income and Earning Potential", "Earned income, passive income, and career earning potential", 450),
            ("Budgeting and Spending Management", "Budget creation, expense tracking, and spending control", 450),
            ("Saving and Investment Strategies", "Savings accounts, investment vehicles, and wealth building", 450),
            ("Credit and Debt Management", "Credit scores, loans, credit cards, and debt repayment", 450),
            ("Insurance and Risk Management", "Insurance types, coverage, and risk protection", 400),
            ("Retirement Planning", "Retirement accounts, savings strategies, and retirement income", 400),
            ("Tax Planning and Management", "Tax basics, deductions, credits, and tax-efficient strategies", 350),
            ("Financial Goals and Planning", "Goal setting, financial planning, and milestone tracking", 350),
            ("Consumer Protection and Rights", "Consumer rights, fraud prevention, and financial protection", 300),
            ("Financial Decision-Making", "Financial analysis, decision-making, and financial literacy", 300),
        ],
    },
}

DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"]

# JSON Schema for structured output
QUESTION_SCHEMA = {
    "name": "deca_question",
    "strict": True,
    "schema": {
        "type": "object",
        "properties": {
            "question": {
                "type": "string",
                "description": "The multiple choice question text"
            },
            "options": {
                "type": "array",
                "items": {"type": "string"},
                "minItems": 4,
                "maxItems": 4,
                "description": "Four answer options"
            },
            "correctAnswerIndex": {
                "type": "integer",
                "minimum": 0,
                "maximum": 3,
                "description": "Index of the correct answer (0-3)"
            },
            "explanation": {
                "type": "string",
                "description": "Detailed explanation of why the answer is correct"
            }
        },
        "required": ["question", "options", "correctAnswerIndex", "explanation"],
        "additionalProperties": False
    }
}

QUESTIONS_ARRAY_SCHEMA = {
    "name": "deca_questions_array",
    "strict": True,
    "schema": {
        "type": "array",
        "items": QUESTION_SCHEMA["schema"],
        "description": "Array of DECA exam questions"
    }
}


def invoke_llm_with_structured_output(messages, count):
    """Call the LLM API with structured output to guarantee valid JSON"""
    payload = {
        "model": "gpt-4o-mini",
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 8000,
        "response_format": {
            "type": "json_schema",
            "json_schema": QUESTIONS_ARRAY_SCHEMA
        }
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {FORGE_API_KEY}",
    }

    try:
        response = requests.post(
            f"{FORGE_API_URL}/v1/chat/completions",
            json=payload,
            headers=headers,
            timeout=120,
        )

        if response.status_code != 200:
            raise Exception(
                f"LLM API error: {response.status_code} {response.text}"
            )

        result = response.json()
        content = result["choices"][0]["message"]["content"]
        
        # Parse the guaranteed valid JSON
        questions = json.loads(content)
        return questions

    except requests.exceptions.Timeout:
        raise Exception("LLM API request timed out")
    except json.JSONDecodeError as e:
        raise Exception(f"JSON parsing error: {str(e)}")
    except Exception as e:
        raise Exception(f"LLM API error: {str(e)}")


def generate_questions_for_pi(cluster_name, pi_name, pi_description, difficulty, count):
    """Generate questions for a specific Performance Indicator"""
    prompt = f"""Generate exactly {count} authentic, high-quality multiple-choice DECA exam questions.

Cluster: {cluster_name}
Performance Indicator: "{pi_name}"
Description: {pi_description}
Difficulty Level: {difficulty}

CRITICAL REQUIREMENTS:
1. Use professional DECA business terminology and language
2. Test real-world business scenarios and decision-making
3. Each question has ONE correct answer
4. Include plausible distractors that test common misconceptions
5. Vary question types: definitions, calculations, scenarios, comparisons
6. For calculations: use realistic business numbers and show methodology
7. Ensure difficulty level is appropriate for the specified level
8. Each question must genuinely test the specified Performance Indicator
9. Make questions engaging and realistic

Generate exactly {count} questions in the specified JSON format."""

    try:
        response = invoke_llm_with_structured_output(
            [
                {
                    "role": "system",
                    "content": "You are an expert DECA exam question generator. Generate authentic, high-quality questions that test specific DECA Performance Indicators. Your output must be a valid JSON array of questions.",
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
            count
        )

        # Validate and add metadata
        valid_questions = []
        for q in response:
            if (isinstance(q, dict) and 
                'question' in q and 
                'options' in q and 
                'correctAnswerIndex' in q and
                'explanation' in q and
                len(q['options']) == 4 and
                isinstance(q['correctAnswerIndex'], int) and
                0 <= q['correctAnswerIndex'] < 4):
                
                valid_questions.append({
                    **q,
                    "cluster": cluster_name,
                    "performanceIndicator": pi_name,
                    "difficulty": difficulty,
                })

        return valid_questions

    except Exception as e:
        print(f"    ❌ Error: {str(e)}")
        return []


def generate_all_questions():
    """Generate all DECA questions"""
    all_questions = []
    total_generated = 0
    start_time = time.time()

    print("🚀 Starting perfect DECA question generation...\n")

    for cluster_key, cluster in DECA_STRUCTURE.items():
        print(f"\n📚 {cluster['name']} Cluster")
        cluster_start = time.time()

        for pi_name, pi_description, pi_questions_needed in cluster["performanceIndicators"]:
            print(f"  📖 {pi_name}")

            questions_per_difficulty = max(1, (pi_questions_needed + 2) // 3)

            for difficulty in DIFFICULTIES:
                print(f"    {difficulty} ({questions_per_difficulty} questions)...", end=" ", flush=True)
                
                questions = generate_questions_for_pi(
                    cluster["name"],
                    pi_name,
                    pi_description,
                    difficulty,
                    questions_per_difficulty
                )

                all_questions.extend(questions)
                total_generated += len(questions)

                print(f"✓ {len(questions)}")

                # Rate limiting
                time.sleep(1)

        cluster_time = (time.time() - cluster_start) / 60
        print(f"  ⏱️  Cluster time: {cluster_time:.2f} minutes")

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

    # Generate comprehensive statistics
    stats = {
        "totalQuestions": len(questions),
        "byCluster": {},
        "byDifficulty": {},
        "byPerformanceIndicator": {},
    }

    for q in questions:
        cluster = q["cluster"]
        difficulty = q["difficulty"]
        pi = q["performanceIndicator"]
        
        stats["byCluster"][cluster] = stats["byCluster"].get(cluster, 0) + 1
        stats["byDifficulty"][difficulty] = stats["byDifficulty"].get(difficulty, 0) + 1
        
        pi_key = f"{cluster} - {pi}"
        stats["byPerformanceIndicator"][pi_key] = stats["byPerformanceIndicator"].get(pi_key, 0) + 1

    print("\n📊 Statistics:")
    print(f"  Total Questions: {stats['totalQuestions']}")
    print(f"\n  By Cluster:")
    for cluster, count in sorted(stats['byCluster'].items()):
        print(f"    {cluster}: {count}")
    print(f"\n  By Difficulty:")
    for difficulty, count in sorted(stats['byDifficulty'].items()):
        print(f"    {difficulty}: {count}")
    
    # Save stats
    stats_file = output_dir / "deca-questions-stats.json"
    with open(stats_file, "w") as f:
        json.dump(stats, f, indent=2)
    print(f"\n  Detailed stats saved to: {stats_file}")


def main():
    try:
        questions = generate_all_questions()
        if questions:
            save_questions(questions)
            print("\n🎉 Perfect question generation complete!")
        else:
            print("\n❌ No questions were generated")
            sys.exit(1)
    except Exception as e:
        print(f"❌ Fatal error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
