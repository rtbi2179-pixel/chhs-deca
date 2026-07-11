
import pypdf

def extract_text_from_pdf(pdf_path):
    text_content = []
    with open(pdf_path, 'rb') as file:
        reader = pypdf.PdfReader(file)
        for page_num in range(len(reader.pages)):
            page = reader.pages[page_num]
            text_content.append(page.extract_text())
    return text_content

if __name__ == '__main__':
    pdf_path = '/home/ubuntu/upload/DECA_Cluster_Exam_Reference_Bank.pdf'
    extracted_pages = extract_text_from_pdf(pdf_path)
    with open('/home/ubuntu/chhs-deca/data/extracted_deca_questions.txt', 'w') as f:
        for i, page_text in enumerate(extracted_pages):
            f.write(f'--- PAGE {i+1} ---\n')
            f.write(page_text)
            f.write('\n\n')
    print('Text extraction complete. Output saved to data/extracted_deca_questions.txt')
