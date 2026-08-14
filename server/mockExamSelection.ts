export type MockExamQuestion = { id: string; difficulty: string };
export type ClusteredMockExamQuestion = MockExamQuestion & { cluster: string };

const targetByDifficulty: Array<[string, number]> = [["Easy", 25], ["Medium", 50], ["Hard", 25]];

export function selectBalancedMockExam<T extends MockExamQuestion>(questions: T[], count = 100): T[] {
  const selected: T[] = [];
  const selectedIds = new Set<string>();
  for (const [difficulty, target] of targetByDifficulty) {
    let selectedForDifficulty = 0;
    for (const question of questions) {
      if (question.difficulty === difficulty && !selectedIds.has(question.id)) {
        selected.push(question);
        selectedIds.add(question.id);
        selectedForDifficulty += 1;
        if (selectedForDifficulty === target) break;
      }
    }
  }
  for (const question of questions) {
    if (selected.length === count) break;
    if (!selectedIds.has(question.id)) {
      selected.push(question);
      selectedIds.add(question.id);
    }
  }
  return selected.slice(0, count);
}

export function selectClusterMockExam<T extends ClusteredMockExamQuestion>(questions: T[], cluster: string, count = 100): T[] {
  return selectBalancedMockExam(questions.filter((question) => question.cluster === cluster), count);
}
