export type MockExamResult = {
  instructionalArea: string | null;
  performanceIndicatorFocus: string | null;
  isCorrect: boolean;
};

type AccuracySummary = {
  attempted: number;
  correct: number;
};

export type PerformanceIndicatorAccuracy = AccuracySummary & {
  performanceIndicator: string;
  accuracy: number;
};

export type InstructionalAreaAccuracy = AccuracySummary & {
  instructionalArea: string;
  accuracy: number;
  performanceIndicators: PerformanceIndicatorAccuracy[];
  recommendedPI: string | null;
};

const UNTAGGED_PI_LABEL = "No PI tagged";

function accuracyFor({ attempted, correct }: AccuracySummary) {
  return attempted ? Math.round((correct / attempted) * 100) : 0;
}

export function analyzeMockExamResults(results: MockExamResult[]) {
  const concepts = new Map<string, { summary: AccuracySummary; performanceIndicators: Map<string, AccuracySummary> }>();

  for (const result of results) {
    const instructionalArea = result.instructionalArea?.trim() || "General business skills";
    const performanceIndicator = result.performanceIndicatorFocus?.trim() || UNTAGGED_PI_LABEL;
    const concept = concepts.get(instructionalArea) ?? {
      summary: { attempted: 0, correct: 0 },
      performanceIndicators: new Map<string, AccuracySummary>(),
    };
    concept.summary.attempted += 1;
    concept.summary.correct += result.isCorrect ? 1 : 0;

    const piSummary = concept.performanceIndicators.get(performanceIndicator) ?? { attempted: 0, correct: 0 };
    piSummary.attempted += 1;
    piSummary.correct += result.isCorrect ? 1 : 0;
    concept.performanceIndicators.set(performanceIndicator, piSummary);
    concepts.set(instructionalArea, concept);
  }

  const instructionalAreas: InstructionalAreaAccuracy[] = Array.from(concepts.entries())
    .map(([instructionalArea, concept]) => {
      const performanceIndicators = Array.from(concept.performanceIndicators.entries())
        .map(([performanceIndicator, summary]) => ({
          performanceIndicator,
          ...summary,
          accuracy: accuracyFor(summary),
        }))
        .sort((a, b) => a.accuracy - b.accuracy || b.attempted - a.attempted || a.performanceIndicator.localeCompare(b.performanceIndicator));
      return {
        instructionalArea,
        ...concept.summary,
        accuracy: accuracyFor(concept.summary),
        performanceIndicators,
        recommendedPI: performanceIndicators.find((pi) => pi.performanceIndicator !== UNTAGGED_PI_LABEL)?.performanceIndicator ?? null,
      };
    })
    .sort((a, b) => a.accuracy - b.accuracy || b.attempted - a.attempted || a.instructionalArea.localeCompare(b.instructionalArea));

  const underperformingPIs = instructionalAreas
    .flatMap((instructionalArea) => instructionalArea.performanceIndicators
      .filter((pi) => pi.performanceIndicator !== UNTAGGED_PI_LABEL && pi.accuracy < 60)
      .map((pi) => ({ instructionalArea: instructionalArea.instructionalArea, ...pi })))
    .sort((a, b) => a.accuracy - b.accuracy || b.attempted - a.attempted || a.performanceIndicator.localeCompare(b.performanceIndicator));

  const score = results.filter((result) => result.isCorrect).length;
  return {
    score,
    total: results.length,
    accuracy: results.length ? Math.round((score / results.length) * 100) : 0,
    instructionalAreas,
    underperformingPIs,
    // Keep the existing result property for backward compatibility with the original summary card.
    weakAreas: instructionalAreas,
    recommendation: instructionalAreas[0] ?? null,
  };
}
