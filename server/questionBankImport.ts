export const DECA_CLUSTERS = [
  "Marketing",
  "Business Management & Administration",
  "Finance",
  "Hospitality & Tourism",
] as const;

export type DecaCluster = (typeof DECA_CLUSTERS)[number];

export type UploadedQuestion = {
  id: string;
  cluster: string;
  instructional_area: string;
  performance_indicator_focus?: string | null;
  cognitive_level?: string | null;
  difficulty: string;
  stem: string;
  options: Record<string, string>;
  correct: string;
  rationale?: string | null;
  distractor_rationales?: Record<string, string> | null;
  concept_tag?: string | null;
  source_status?: string | null;
};

export type UploadedQuestionBank = {
  metadata: {
    total_questions: number;
    questions_per_cluster: Record<string, number>;
  };
  questions: UploadedQuestion[];
};

export type QuestionImportRow = {
  id: string;
  cluster: DecaCluster;
  instructionalArea: string;
  performanceIndicatorFocus: string | null;
  cognitiveLevel: string | null;
  difficulty: string;
  stem: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: "A" | "B" | "C" | "D";
  rationale: string | null;
  distractorRationaleA: string | null;
  distractorRationaleB: string | null;
  distractorRationaleC: string | null;
  distractorRationaleD: string | null;
  conceptTag: string | null;
  sourceStatus: string | null;
};

const answerKeys = ["A", "B", "C", "D"] as const;
const validDifficulties = new Set(["Easy", "Medium", "Hard"]);

function cleanRequired(value: unknown, label: string, questionId: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Question ${questionId}: ${label} is required.`);
  }
  return value.trim();
}

function cleanOptional(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function validCluster(value: string, questionId: string): DecaCluster {
  if (!DECA_CLUSTERS.includes(value as DecaCluster)) {
    throw new Error(`Question ${questionId}: unsupported cluster "${value}".`);
  }
  return value as DecaCluster;
}

export function mapUploadedQuestion(question: UploadedQuestion): QuestionImportRow {
  const id = cleanRequired(question.id, "id", "unknown");
  const cluster = validCluster(cleanRequired(question.cluster, "cluster", id), id);
  const difficulty = cleanRequired(question.difficulty, "difficulty", id);
  if (!validDifficulties.has(difficulty)) {
    throw new Error(`Question ${id}: unsupported difficulty "${difficulty}".`);
  }

  const options = question.options ?? {};
  const optionA = cleanRequired(options.A, "option A", id);
  const optionB = cleanRequired(options.B, "option B", id);
  const optionC = cleanRequired(options.C, "option C", id);
  const optionD = cleanRequired(options.D, "option D", id);
  const correctAnswer = cleanRequired(question.correct, "correct answer", id);
  if (!answerKeys.includes(correctAnswer as (typeof answerKeys)[number])) {
    throw new Error(`Question ${id}: correct answer must be A, B, C, or D.`);
  }

  const distractors = question.distractor_rationales ?? {};
  return {
    id,
    cluster,
    instructionalArea: cleanRequired(question.instructional_area, "instructional area", id),
    performanceIndicatorFocus: cleanOptional(question.performance_indicator_focus),
    cognitiveLevel: cleanOptional(question.cognitive_level),
    difficulty,
    stem: cleanRequired(question.stem, "stem", id),
    optionA,
    optionB,
    optionC,
    optionD,
    correctAnswer: correctAnswer as QuestionImportRow["correctAnswer"],
    rationale: cleanOptional(question.rationale),
    distractorRationaleA: cleanOptional(distractors.A),
    distractorRationaleB: cleanOptional(distractors.B),
    distractorRationaleC: cleanOptional(distractors.C),
    distractorRationaleD: cleanOptional(distractors.D),
    conceptTag: cleanOptional(question.concept_tag),
    sourceStatus: cleanOptional(question.source_status),
  };
}

export type QuestionBankSummary = {
  total: number;
  clusters: Record<DecaCluster, number>;
  difficulties: Record<string, number>;
};

export function validateAndMapQuestionBank(bank: UploadedQuestionBank): {
  rows: QuestionImportRow[];
  summary: QuestionBankSummary;
} {
  if (!Array.isArray(bank.questions) || bank.questions.length === 0) {
    throw new Error("The uploaded question bank does not contain questions.");
  }
  if (bank.metadata?.total_questions !== bank.questions.length) {
    throw new Error(`Metadata declares ${bank.metadata?.total_questions} questions but the file contains ${bank.questions.length}.`);
  }

  const seenIds = new Set<string>();
  const clusters = Object.fromEntries(DECA_CLUSTERS.map((cluster) => [cluster, 0])) as Record<DecaCluster, number>;
  const difficulties: Record<string, number> = {};
  const rows = bank.questions.map((question) => {
    const row = mapUploadedQuestion(question);
    if (seenIds.has(row.id)) throw new Error(`Duplicate question id: ${row.id}`);
    seenIds.add(row.id);
    clusters[row.cluster] += 1;
    difficulties[row.difficulty] = (difficulties[row.difficulty] ?? 0) + 1;
    return row;
  });

  for (const cluster of DECA_CLUSTERS) {
    const expected = bank.metadata.questions_per_cluster?.[cluster];
    if (clusters[cluster] !== expected) {
      throw new Error(`Cluster ${cluster} has ${clusters[cluster]} records; expected ${expected}.`);
    }
  }

  return { rows, summary: { total: rows.length, clusters, difficulties } };
}
