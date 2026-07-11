import json
import re

def clean_question_text(text):
    """Remove PDF extraction artifacts and header content from question text."""
    # Remove page references like "Page 13 7."
    text = re.sub(r'^Page\s+\d+\s+\d+\.\s+', '', text, flags=re.MULTILINE)
    
    # Remove "Question Bank" headers with cluster info
    text = re.sub(r'Question Bank\s*—\s*\w+\s+Cluster\s*\([A-Z]\d{3}–[A-Z]\d{3}\)\s*\d+\s+original items[,.]?\s*', '', text, flags=re.IGNORECASE)
    
    # Remove section headers like "7. Question Bank — Marketing Cluster..."
    text = re.sub(r'^\d+\.\s+Question Bank.*?(?=\n[A-Z]\.|\Z)', '', text, flags=re.MULTILINE | re.DOTALL)
    
    # Remove "organized sequentially by ID" and similar meta text
    text = re.sub(r'organized sequentially by ID\.?\s+', '', text, flags=re.IGNORECASE)
    text = re.sub(r'Each item shows the stem.*?distractor\.\s+', '', text, flags=re.IGNORECASE | re.DOTALL)
    
    # Remove any remaining "Question Bank" references at the start
    text = re.sub(r'^Question Bank.*?(?=\n|$)', '', text, flags=re.IGNORECASE | re.MULTILINE)
    
    # Clean up extra whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text

if __name__ == '__main__':
    with open('/home/ubuntu/chhs-deca/data/deca_questions_structured.json', 'r') as f:
        questions = json.load(f)
    
    cleaned_count = 0
    for q in questions:
        original = q['questionText']
        q['questionText'] = clean_question_text(q['questionText'])
        if original != q['questionText']:
            cleaned_count += 1
    
    with open('/home/ubuntu/chhs-deca/data/deca_questions_structured.json', 'w') as f:
        json.dump(questions, f, indent=2)
    
    print(f'Cleaned {cleaned_count} questions. Updated file saved.')
