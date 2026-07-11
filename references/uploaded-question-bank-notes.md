# Uploaded DECA Question Bank Notes

Source file: `/home/ubuntu/upload/DECA_Cluster_Exam_Reference_Bank.pdf`

## High-level structure observed

- The PDF is a **305-page** document titled **DECA Cluster Exam Reference Question Bank**.
- The cover states it contains **1,000 original multiple-choice items** across four career clusters: **Marketing, Business Management & Administration, Finance, and Hospitality & Tourism**.
- The contents page indicates separate question-bank sections for each cluster:
  - Marketing: `M001–M250`
  - Business Management & Administration: `B001–B250`
  - Finance: `F001–F250`
  - Hospitality & Tourism: `H001–H250`
- The document also includes a **Master Answer Key**.

## Quality and formatting observations from pages 1–10

- The document is designed as a structured question bank rather than a simple worksheet.
- It claims the bank is aligned to district-level blueprint proportions and distributed across **25 instructional areas**.
- The observed constraints indicate:
  - exactly **4 options (A–D)** per item,
  - no all/none-of-the-above,
  - no true/false,
  - no combination-answer items,
  - formal instructional tone,
  - randomized answer positions.
- The bank-wide target mix shown in the introductory pages is approximately:
  - **Correct answers:** A 25.6%, B 24.5%, C 24.7%, D 25.2%
  - **Difficulty:** Easy 35.2%, Medium 44.8%, Hard 20.0%
- A per-cluster summary shows **250 items per cluster**.

## Extraction implications

- The question bank likely uses a **cluster-prefixed item ID** format (`M`, `B`, `F`, `H`).
- We should expect the main extraction target per question to include:
  - item ID
  - cluster
  - instructional area
  - question stem
  - answer choices A–D
  - correct answer
  - explanation/rationale if present
- Because the document includes a master answer key and appears highly structured, it should be feasible to build a parser that reads text directly from the PDF rather than relying on manual page-by-page visual extraction.

## Next extraction step

- Read the PDF as text and inspect the first pages of the actual question sections to determine exact line patterns for:
  - question boundaries
  - answer option formatting
  - answer key formatting
  - any rationale/explanation formatting

## Source pages reviewed

- Visual review completed for pages **1–10** of the uploaded PDF.
