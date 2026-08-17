export type MockExamQuestion = { id: string; difficulty: string };
export type ClusteredMockExamQuestion = MockExamQuestion & { cluster: string };

function targetByDifficulty(count: number): Array<[string, number]> {
  const easy = Math.round(count * 0.25);
  const hard = Math.round(count * 0.25);
  return [["Easy", easy], ["Medium", count - easy - hard], ["Hard", hard]];
}

export function selectBalancedMockExam<T extends MockExamQuestion>(questions: T[], count = 100): T[] {
  const selected: T[] = [];
  const selectedIds = new Set<string>();
  for (const [difficulty, target] of targetByDifficulty(count)) {
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
