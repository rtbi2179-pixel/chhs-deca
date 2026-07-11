import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ChevronDown } from "lucide-react";

export default function Practice() {
  const [selectedCluster, setSelectedCluster] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);

  // Fetch all questions from the database
  const { data: allQuestions, isLoading } = trpc.practice.getQuestions.useQuery({
    cluster: selectedCluster === "all" ? undefined : selectedCluster,
    difficulty: selectedDifficulty === "all" ? undefined : selectedDifficulty,
  });

  // Filter questions based on selections
  const filteredQuestions = useMemo(() => {
    if (!allQuestions) return [];
    return allQuestions;
  }, [allQuestions]);

  const currentQuestion = filteredQuestions[currentQuestionIndex];

  const clusters = [
    { value: "all", label: "All Clusters" },
    { value: "Marketing", label: "Marketing" },
    { value: "Business Management & Administration", label: "Business Management" },
    { value: "Finance", label: "Finance" },
    { value: "Hospitality & Tourism", label: "Hospitality & Tourism" },
  ];

  const difficulties = [
    { value: "all", label: "All Levels" },
    { value: "Easy", label: "Easy" },
    { value: "Medium", label: "Medium" },
    { value: "Hard", label: "Hard" },
  ];

  const handleAnswerSelect = (answer: string) => {
    if (showResult) return; // Prevent changing answer after submission
    setSelectedAnswer(answer);
  };

  const handleSubmitAnswer = () => {
    if (!currentQuestion || !selectedAnswer) return;

    setShowResult(true);
    setShowExplanation(false);
    if (selectedAnswer === currentQuestion.correctAnswer) {
      setScore(score + 1);
    }
    setTotalAnswered(totalAnswered + 1);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < filteredQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setShowExplanation(false);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setShowExplanation(false);
    }
  };

  const handleResetQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setShowExplanation(false);
    setScore(0);
    setTotalAnswered(0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-foreground">Loading practice questions...</p>
        </div>
      </div>
    );
  }

  if (!filteredQuestions || filteredQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-8">Practice Questions</h1>
          <Card className="p-8 text-center">
            <p className="text-foreground mb-4">No questions found for the selected filters.</p>
            <Button onClick={handleResetQuiz} className="bg-blue-600 hover:bg-blue-700">
              Reset Filters
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8 pt-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">DECA Practice Questions</h1>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-lg font-semibold text-foreground">
                Question {currentQuestionIndex + 1} of {filteredQuestions.length}
              </p>
              {totalAnswered > 0 && (
                <p className="text-foreground/70 mt-1">
                  Score: {score} / {totalAnswered} ({Math.round((score / totalAnswered) * 100)}%)
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="question-jump" className="text-foreground font-semibold">Jump to:</label>
              <input
                id="question-jump"
                type="number"
                min="1"
                max={filteredQuestions.length}
                value={currentQuestionIndex + 1}
                onChange={(e) => {
                  const num = parseInt(e.target.value);
                  if (num >= 1 && num <= filteredQuestions.length) {
                    setCurrentQuestionIndex(num - 1);
                    setSelectedAnswer(null);
                    setShowResult(false);
                    setShowExplanation(false);
                  }
                }}
                className="w-16 px-3 py-2 bg-background border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-foreground/70">/ {filteredQuestions.length}</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-8 border border-border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-foreground font-semibold mb-3">Cluster</label>
              <div className="space-y-2">
                {clusters.map((cluster) => (
                  <button
                    key={cluster.value}
                    onClick={() => {
                      setSelectedCluster(cluster.value);
                      setCurrentQuestionIndex(0);
                      setSelectedAnswer(null);
                      setShowResult(false);
                      setShowExplanation(false);
                    }}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                      selectedCluster === cluster.value
                        ? "bg-blue-600 text-white"
                        : "bg-background border border-border text-foreground hover:bg-border"
                    }`}
                  >
                    {cluster.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-foreground font-semibold mb-3">Difficulty</label>
              <div className="space-y-2">
                {difficulties.map((difficulty) => (
                  <button
                    key={difficulty.value}
                    onClick={() => {
                      setSelectedDifficulty(difficulty.value);
                      setCurrentQuestionIndex(0);
                      setSelectedAnswer(null);
                      setShowResult(false);
                      setShowExplanation(false);
                    }}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                      selectedDifficulty === difficulty.value
                        ? "bg-blue-600 text-white"
                        : "bg-background border border-border text-foreground hover:bg-border"
                    }`}
                  >
                    {difficulty.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Question Card */}
        {currentQuestion && (
          <Card className="p-8 border border-border mb-8">
            {/* Question Text */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">{currentQuestion.questionText}</h2>
              <div className="flex gap-4 text-sm">
                <span className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full">
                  {currentQuestion.cluster}
                </span>
                <span className="px-3 py-1 bg-purple-600/20 text-purple-400 rounded-full">
                  {currentQuestion.difficulty}
                </span>
              </div>
            </div>

            {/* Answer Options */}
            <div className="space-y-3 mb-8">
              {["A", "B", "C", "D"].map((option) => {
                const optionKey = `option${option}` as keyof typeof currentQuestion;
                const optionText = currentQuestion[optionKey] as string;

                if (!optionText) return null;

                const isSelected = selectedAnswer === option;
                const isCorrect = option === currentQuestion.correctAnswer;
                const isWrong = isSelected && option !== currentQuestion.correctAnswer;

                let buttonClass = "bg-background border border-border text-foreground hover:bg-border";
                if (showResult) {
                  if (isCorrect) {
                    buttonClass = "bg-green-600/20 border border-green-600 text-green-400";
                  } else if (isWrong) {
                    buttonClass = "bg-red-600/20 border border-red-600 text-red-400";
                  }
                } else if (isSelected) {
                  buttonClass = "bg-blue-600 text-white border border-blue-600";
                }

                return (
                  <button
                    key={option}
                    onClick={() => handleAnswerSelect(option)}
                    disabled={showResult}
                    className={`w-full text-left p-4 rounded-lg transition-colors ${buttonClass}`}
                  >
                    <span className="font-bold mr-3">{option}.</span>
                    {optionText}
                  </button>
                );
              })}
            </div>

            {/* Result Notification with Collapsible Explanation */}
            {showResult && (
              <div className={`rounded-lg mb-8 ${
                selectedAnswer === currentQuestion.correctAnswer
                  ? "bg-green-600/20 border border-green-600"
                  : "bg-red-600/20 border border-red-600"
              }`}>
                <button
                  onClick={() => setShowExplanation(!showExplanation)}
                  className={`w-full text-left p-4 flex items-center justify-between ${
                    selectedAnswer === currentQuestion.correctAnswer
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  <span className="font-semibold">
                    {selectedAnswer === currentQuestion.correctAnswer ? "Correct!" : "Incorrect"}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 transition-transform ${showExplanation ? "rotate-180" : ""}`}
                  />
                </button>

                {/* Expandable Explanation */}
                {showExplanation && (
                  <div className={`px-4 pb-4 border-t ${
                    selectedAnswer === currentQuestion.correctAnswer
                      ? "border-green-600"
                      : "border-red-600"
                  }`}>
                    <p className="text-sm mt-3">{currentQuestion.explanation}</p>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 justify-between">
              <div className="flex gap-4">
                <Button
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                  className="bg-gray-600 hover:bg-gray-700 disabled:opacity-50"
                >
                  Previous
                </Button>
                <Button
                  onClick={handleNextQuestion}
                  disabled={currentQuestionIndex === filteredQuestions.length - 1}
                  className="bg-gray-600 hover:bg-gray-700 disabled:opacity-50"
                >
                  Next
                </Button>
              </div>

              {!showResult ? (
                <Button
                  onClick={handleSubmitAnswer}
                  disabled={!selectedAnswer}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  Submit Answer
                </Button>
              ) : (
                <Button
                  onClick={handleResetQuiz}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Start Over
                </Button>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
