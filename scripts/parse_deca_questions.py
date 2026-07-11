
import re
import json

def parse_deca_questions(text_content):
    questions = []
    
    # Regex patterns
    # Matches the metadata line: M001  |  Marketing  |  Marketing-Information Management  |  Recall  |  Easy  |  Answer: D
    metadata_pattern = re.compile(r"^([MBFH]\d{3})\s+\|\s*(.*?)\s+\|\s*(.*?)\s+\|\s*(.*?)\s+\|\s*(.*?)\s+\|\s*Answer:\s*([A-D])")
    # Matches A., B., C., D. at the beginning of a line, followed by the option text
    option_pattern = re.compile(r"^([A-D])\.\s*(.*)")
    # Matches Correct (D): ... explanation
    correct_explanation_pattern = re.compile(r"^Correct\s*\(([A-D])\):\s*(.*)")
    # Matches A — why plausible but wrong: ... distractor explanation
    distractor_explanation_pattern = re.compile(r"^([A-D])\s+\—\s+why plausible but wrong:\s*(.*)")

    lines = text_content.split("\n")
    current_question = None

    i = 0
    while i < len(lines):
        line = lines[i].strip()
        if not line:
            i += 1
            continue

        # Primary trigger: Find the metadata line, which signals a new question block
        match_metadata = metadata_pattern.match(line)
        if match_metadata:
            if current_question:
                questions.append(current_question)
            
            q_id = match_metadata.group(1)
            cluster = match_metadata.group(2).strip()
            instructional_area = match_metadata.group(3).strip()
            # cognitive_level = match_metadata.group(4).strip() # Not used in schema
            difficulty = match_metadata.group(5).strip()
            correct_answer = match_metadata.group(6).strip()

            current_question = {
                "id_pdf": q_id,
                "questionText": "", 
                "options": [],
                "cluster": cluster,
                "instructionalArea": instructional_area,
                "difficulty": difficulty,
                "correctAnswer": correct_answer,
                "explanation": "",
                "distractorRationales": {}
            }
            
            # Now, backtrack to find the question text (lines before this metadata line)
            question_text_lines = []
            j = i - 1
            while j >= 0:
                prev_line = lines[j].strip()
                if not prev_line or prev_line.startswith("--- PAGE") or prev_line.startswith("DECA Cluster Exam") or metadata_pattern.match(prev_line):
                    break # Stop if empty, page break, header, or previous question metadata
                question_text_lines.insert(0, prev_line)
                j -= 1
            current_question["questionText"] = " ".join(question_text_lines).strip()

            i += 1 # Move past the metadata line
            continue

        # If we have a current_question, parse options and explanations that follow
        if current_question:
            # Parse options
            match_option = option_pattern.match(line)
            if match_option:
                option_label = match_option.group(1)
                option_text = match_option.group(2).strip()
                
                # Accumulate multi-line option text
                i += 1
                while i < len(lines):
                    next_line = lines[i].strip()
                    if not next_line:
                        i += 1
                        continue
                    # Stop if next line is new option, explanation, or new question metadata
                    if option_pattern.match(next_line) or correct_explanation_pattern.match(next_line) or distractor_explanation_pattern.match(next_line) or metadata_pattern.match(next_line):
                        break
                    option_text += " " + next_line
                    i += 1
                current_question["options"].append({"label": option_label, "text": option_text.strip()})
                continue

            # Parse explanations
            match_correct_exp = correct_explanation_pattern.match(line)
            if match_correct_exp:
                current_question["explanation"] = match_correct_exp.group(2).strip()
                i += 1
                continue

            match_distractor_exp = distractor_explanation_pattern.match(line)
            if match_distractor_exp:
                distractor_label = match_distractor_exp.group(1)
                current_question["distractorRationales"][distractor_label] = match_distractor_exp.group(2).strip()
                i += 1
                continue

        i += 1 # Move to the next line if no pattern matched

    if current_question:
        questions.append(current_question)

    return questions


if __name__ == '__main__':
    with open('/home/ubuntu/chhs-deca/data/extracted_deca_questions.txt', 'r') as f:
        full_text = f.read()

    questions_data = parse_deca_questions(full_text)

    final_questions = []
    for q in questions_data:
        # Convert options list to individual option fields (A, B, C, D)
        option_map = {opt['label']: opt['text'] for opt in q['options']}
        q['optionA'] = option_map.get('A', '')
        q['optionB'] = option_map.get('B', '')
        q['optionC'] = option_map.get('C', '')
        q['optionD'] = option_map.get('D', '')

        # Remove temporary fields and reformat for database insertion
        del q['options']
        del q['id_pdf']
        del q['distractorRationales'] # We are not storing distractor rationales in the current schema

        final_questions.append(q)

    with open('/home/ubuntu/chhs-deca/data/deca_questions_structured.json', 'w') as f:
        json.dump(final_questions, f, indent=2)
    print(f'Structured questions saved to data/deca_questions_structured.json. Total questions: {len(final_questions)}')
