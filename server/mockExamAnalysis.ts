export type MockExamResult = {
  instructionalArea: string | null;
  performanceIndicatorFocus: string | null;
  isCorrect: boolean;
};

export function analyzeMockExamResults(results: MockExamResult[]) {
  const areas = new Map<string, { attempted: number; correct: number; recommendedPI: string | null }>();
  for (const result of results) {
    const area = result.instructionalArea || "General business skills";
    const existing = areas.get(area) ?? { attempted: 0, correct: 0, recommendedPI: result.performanceIndicatorFocus };
    existing.attempted += 1;
    existing.correct += result.isCorrect ? 1 : 0;
    existing.recommendedPI ??= result.performanceIndicatorFocus;
    areas.set(area, existing);
  }
  const weakAreas = Array.from(areas.entries())
    .map(([instructionalArea, value]) => ({ instructionalArea, ...value, accuracy: value.attempted ? Math.round((value.correct / value.attempted) * 100) : 0 }))
    .sort((a, b) => a.accuracy - b.accuracy || b.attempted - a.attempted);
  return {
    score: results.filter(result => result.isCorrect).length,
    total: results.length,
    accuracy: results.length ? Math.round((results.filter(result => result.isCorrect).length / results.length) * 100) : 0,
    weakAreas,
    recommendation: weakAreas[0] ?? null,
  };
}
