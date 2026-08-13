export function calculateMockExamProgress(rows: Array<{ userAnswer: string | null; isCorrect: number | boolean | null }>) {
  const answeredRows = rows.filter(row => row.userAnswer !== null);
  return {
    questionsAnswered: answeredRows.length,
    correctAnswers: answeredRows.filter(row => row.isCorrect === 1 || row.isCorrect === true).length,
  };
}
