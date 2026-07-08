#!/usr/bin/env python3
"""
DECA Question Generation Script v2
Generates 40,000+ authentic DECA-aligned practice questions with improved JSON handling
"""

import json
import os
import sys
import time
import requests
import re
from pathlib import Path

# Get API credentials
FORGE_API_URL = os.environ.get("BUILT_IN_FORGE_API_URL")
FORGE_API_KEY = os.environ.get("BUILT_IN_FORGE_API_KEY")

if not FORGE_API_URL or not FORGE_API_KEY:
    print("❌ Missing BUILT_IN_FORGE_API_URL or BUILT_IN_FORGE_API_KEY environment variables")
    sys.exit(1)

# Simplified DECA structure for testing - will expand after validation
DECA_STRUCTURE = {
    "marketing": {
        "name": "Marketing",
        "performanceIndicators": [
            {
                "name": "Market Segmentation and Targeting",
                "description": "Dividing markets into distinct groups and selecting target segments",
                "questionsNeeded": 100,  # Reduced for testing
            },
            {
                "name": "Marketing Mix - Product",
                "description": "Product development, features, quality, and lifecycle management",
                "questionsNeeded": 100,
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

    try:
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
    except requests.exceptions.Timeout:
        raise Exception("LLM API request timed out")
    except Exception as e:
        raise Exception(f"LLM API error: {str(e)}")


def extract_json_array(text):
    """Extract JSON array from text, handling various formats"""
    # Try to find JSON array pattern
    json_pattern = r'\[\s*\{[\s\S]*?\}\s*\]'
    matches = re.findall(json_pattern, text)
    
    if matches:
        # Return the longest match (most likely the complete array)
        json_str = max(matches, key=len)
        return json_str
    
    # If no match found, try to extract just the array brackets
    start_idx = text.find('[')
    if start_idx == -1:
        return None
    
    # Find matching closing bracket
    bracket_count = 0
    for i in range(start_idx, len(text)):
        if text[i] == '[':
            bracket_count += 1
        elif text[i] == ']':
            bracket_count -= 1
            if bracket_count == 0:
                return text[start_idx:i+1]
    
    return None


def parse_questions_from_response(content):
    """Parse questions from LLM response with robust error handling"""
    try:
        # Extract JSON array
        json_str = extract_json_array(content)
        
        if not json_str:
            print(f"  ⚠️  Could not find JSON array in response")
            return []
        
        # Try to parse JSON
        try:
            questions = json.loads(json_str)
        except json.JSONDecodeError as e:
            print(f"  ⚠️  JSON parsing error: {str(e)}")
            print(f"  Attempting to clean and retry...")
            
            # Try to clean up common JSON issues
            json_str = json_str.replace('\n', ' ').replace('\r', '')
            # Remove any trailing commas before closing braces
            json_str = re.sub(r',(\s*[}\]])', r'\1', json_str)
            
            try:
                questions = json.loads(json_str)
            except:
                print(f"  ❌ Failed to parse JSON after cleanup")
                return []
        
        # Validate questions
        valid_questions = []
        for q in questions:
            if (isinstance(q, dict) and 
                'question' in q and 
                'options' in q and 
                'correctAnswerIndex' in q and
                'explanation' in q and
                len(q['options']) == 4 and
                isinstance(q['correctAnswerIndex'], int) and
                0 <= q['correctAnswerIndex'] < 4):
                valid_questions.append(q)
        
        return valid_questions
    
    except Exception as e:
        print(f"  ❌ Error parsing questions: {str(e)}")
        return []


def generate_questions_for_pi(cluster, pi, difficulty, count):
    """Generate questions for a specific Performance Indicator"""
    prompt = f"""Generate exactly {count} authentic, high-quality multiple-choice DECA exam questions.

Cluster: {cluster['name']}
Performance Indicator: "{pi['name']}"
Description: {pi['description']}
Difficulty: {difficulty}

REQUIREMENTS:
1. Use professional DECA business terminology
2. Test real-world business scenarios
3. Each question has ONE correct answer
4. Include plausible distractors
5. Vary question types: definitions, calculations, scenarios, comparisons
6. Ensure difficulty level is appropriate

Return ONLY a valid JSON array with exactly {count} objects:
[
  {{
    "question": "Question text?",
    "options": ["A", "B", "C", "D"],
    "correctAnswerIndex": 0,
    "explanation": "Why A is correct..."
  }}
]

Generate {count} questions now. Return ONLY the JSON array."""

    try:
        response = invoke_llm(
            [
                {
                    "role": "system",
                    "content": "You are a DECA exam expert. Generate only valid JSON arrays of questions. Each array must contain exactly the requested number of questions.",
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ]
        )

        content = response["choices"][0]["message"]["content"]
        questions = parse_questions_from_response(content)
        
        if not questions:
            print(f"  ⚠️  No valid questions extracted")
            return []
        
        # Add metadata
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
        print(f"  ❌ Error: {str(e)}")
        return []


def generate_all_questions():
    """Generate all DECA questions"""
    all_questions = []
    total_generated = 0
    start_time = time.time()

    print("🚀 Starting DECA question generation...\n")

    for cluster_key, cluster in DECA_STRUCTURE.items():
        print(f"\n📚 {cluster['name']} Cluster")

        for pi in cluster["performanceIndicators"]:
            print(f"  📖 {pi['name']}")

            questions_per_difficulty = max(1, (pi["questionsNeeded"] + 2) // 3)

            for difficulty in DIFFICULTIES:
                print(f"    Generating {difficulty} ({questions_per_difficulty} questions)...", end=" ", flush=True)
                
                questions = generate_questions_for_pi(
                    cluster, pi, difficulty, questions_per_difficulty
                )

                all_questions.extend(questions)
                total_generated += len(questions)

                print(f"✓ {len(questions)} generated (Total: {total_generated})")

                # Rate limiting
                time.sleep(2)

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
    print(f"  Total: {stats['totalQuestions']}")
    print(f"  By Cluster: {stats['byCluster']}")
    print(f"  By Difficulty: {stats['byDifficulty']}")


def main():
    try:
        questions = generate_all_questions()
        if questions:
            save_questions(questions)
            print("\n🎉 Question generation complete!")
        else:
            print("\n❌ No questions were generated")
            sys.exit(1)
    except Exception as e:
        print(f"❌ Fatal error: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()
