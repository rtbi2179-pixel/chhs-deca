import json
import re

def clean_question_text(text):
    """Remove page numbers, random words, and incomplete text from the beginning of questions."""
    
    # Remove "Page X" or "Page XX" at the beginning
    text = re.sub(r"^Page\s+\d+\s+", "", text)
    
    # Remove single words followed by a period at the beginning (like "survey.", "decision.")
    # These are typically fragments from previous questions
    text = re.sub(r"^[a-z]+\.\s+", "", text, flags=re.IGNORECASE)
    
    # Remove leading/trailing whitespace
    text = text.strip()
    
    # Clean up multiple spaces
    text = re.sub(r"\s+", " ", text)
    
    return text

def clean_all_questions(json_file):
    """Load questions, clean them, and save back to file."""
    
    with open(json_file, 'r') as f:
        questions = json.load(f)
    
    cleaned_count = 0
    for question in questions:
        original_text = question['questionText']
        cleaned_text = clean_question_text(original_text)
        
        if original_text != cleaned_text:
            cleaned_count += 1
            question['questionText'] = cleaned_text
    
    with open(json_file, 'w') as f:
        json.dump(questions, f, indent=2)
    
    print(f"Cleaned {cleaned_count} questions out of {len(questions)}")
    return cleaned_count

if __name__ == '__main__':
    json_file = '/home/ubuntu/chhs-deca/data/deca_questions_structured.json'
    clean_all_questions(json_file)
