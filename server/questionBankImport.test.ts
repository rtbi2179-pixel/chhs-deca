import { describe, expect, it } from "vitest";
import { mapUploadedQuestion, validateAndMapQuestionBank, type UploadedQuestion } from "./questionBankImport";

const sampleQuestion: UploadedQuestion = {
  id: "MKT-0001",
  cluster: "Marketing",
  instructional_area: "Operations",
  performance_indicator_focus: "Explain service blueprint",
  cognitive_level: "Recall",
  difficulty: "Easy",
  stem: "Which term describes a visual service map?",
  options: { A: "Service blueprint", B: "Operations management", C: "Loss prevention", D: "Preventive maintenance" },
  correct: "A",
  rationale: "A service blueprint maps the service process.",
  distractor_rationales: { B: "Not a service map.", C: "Not a service map.", D: "Not a service map." },
  concept_tag: "service blueprint",
  source_status: "Original practice item.",
};

describe("question bank import mapping", () => {
  it("maps all source fields to the existing questions table columns without dropping rationale data", () => {
    expect(mapUploadedQuestion(sampleQuestion)).toMatchObject({
      id: "MKT-0001",
      cluster: "Marketing",
      instructionalArea: "Operations",
      performanceIndicatorFocus: "Explain service blueprint",
      cognitiveLevel: "Recall",
      optionA: "Service blueprint",
      correctAnswer: "A",
      distractorRationaleB: "Not a service map.",
      sourceStatus: "Original practice item.",
    });
  });

  it("rejects invalid answer keys and duplicate question identifiers", () => {
    expect(() => mapUploadedQuestion({ ...sampleQuestion, correct: "E" })).toThrow("correct answer must be A, B, C, or D");
    expect(() => validateAndMapQuestionBank({
      metadata: { total_questions: 2, questions_per_cluster: { Marketing: 2, "Business Management & Administration": 0, Finance: 0, "Hospitality & Tourism": 0 } },
      questions: [sampleQuestion, { ...sampleQuestion }],
    })).toThrow("Duplicate question id");
  });
});
