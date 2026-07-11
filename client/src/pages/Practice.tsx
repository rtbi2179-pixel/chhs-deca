import { useState, useEffect, useMemo } from "react";
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
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardCluster, setLeaderboardCluster] = useState<string>("overall");

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

  const updateLeaderboardMutation = trpc.practice.updateLeaderboard.useMutation();

  const handleSubmitAnswer = async () => {
    if (!currentQuestion || !selectedAnswer) return;

    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    const newScore = isCorrect ? score + 1 : score;
    const newTotalAnswered = totalAnswered + 1;

    setShowResult(true);
    setShowExplanation(false);
    if (isCorrect) {
      setScore(newScore);
    }
    setTotalAnswered(newTotalAnswered);

    try {
      await updateLeaderboardMutation.mutateAsync({
        correctAnswers: newScore,
        totalAnswered: newTotalAnswered,
        cluster: currentQuestion.cluster,
      });
    } catch (error) {
      console.error("Failed to update leaderboard", error);
    }
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

  // Keyboard shortcuts: Arrow keys for navigation, Enter to submit
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!currentQuestion) return;
      
      // Don't trigger shortcuts if user is typing in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
            setSelectedAnswer(null);
            setShowResult(false);
            setShowExplanation(false);
          }
          break;
        case "ArrowRight":
          e.preventDefault();
          if (currentQuestionIndex < filteredQuestions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setSelectedAnswer(null);
            setShowResult(false);
            setShowExplanation(false);
          }
          break;
        case "Enter":
          e.preventDefault();
          if (showResult) {
            handleResetQuiz();
          } else if (selectedAnswer) {
            handleSubmitAnswer();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentQuestionIndex, selectedAnswer, showResult, filteredQuestions.length]);

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
            <div className="flex items-center gap-4">
              <Button 
                onClick={() => setShowLeaderboard(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                View Leaderboard
              </Button>
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
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-2xl font-bold text-foreground flex-1">{currentQuestion.questionText}</h2>
                <BookmarkButton questionId={currentQuestion.id} />
              </div>
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
            <div className="flex gap-4 justify-between items-center">
              <div className="flex gap-4 items-center">
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
                <div className="flex items-center gap-2 ml-4 pl-4 border-l border-border">
                  <label htmlFor="question-jump-bottom" className="text-foreground font-semibold whitespace-nowrap">Jump to:</label>
                  <input
                    id="question-jump-bottom"
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
                  <span className="text-foreground/70 whitespace-nowrap">/ {filteredQuestions.length}</span>
                </div>
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

        {/* Leaderboard Modal */}
        {showLeaderboard && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-border">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">Leaderboard</h2>
                    <p className="text-foreground/70 text-sm">Top performers in DECA practice</p>
                  </div>
                  <button
                    onClick={() => setShowLeaderboard(false)}
                    className="text-foreground/70 hover:text-foreground text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="mb-6">
                  <label className="block text-foreground font-semibold mb-3 text-sm">Filter by Cluster</label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {[
                      { value: "overall", label: "Overall" },
                      { value: "Marketing", label: "Marketing" },
                      { value: "Business Management & Administration", label: "Business Mgmt" },
                      { value: "Finance", label: "Finance" },
                      { value: "Hospitality & Tourism", label: "Hospitality" },
                    ].map((cluster) => (
                      <button
                        key={cluster.value}
                        onClick={() => setLeaderboardCluster(cluster.value)}
                        className={`px-3 py-2 rounded text-sm transition-colors ${
                          leaderboardCluster === cluster.value
                            ? "bg-blue-600 text-white"
                            : "bg-background border border-border text-foreground hover:bg-border"
                        }`}
                      >
                        {cluster.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-blue-600/10 border-b border-border">
                        <th className="px-4 py-3 text-left text-foreground font-semibold">Rank</th>
                        <th className="px-4 py-3 text-left text-foreground font-semibold">Name</th>
                        <th className="px-4 py-3 text-left text-foreground font-semibold">Accuracy</th>
                        <th className="px-4 py-3 text-left text-foreground font-semibold">Answered</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-foreground/70">
                          No leaderboard data yet. Start practicing!
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

// Bookmark Button Component
function BookmarkButton({ questionId }: { questionId: number }) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const { user } = useAuth();
  const addBookmarkMutation = trpc.practice.addBookmark.useMutation();
  const removeBookmarkMutation = trpc.practice.removeBookmark.useMutation();
  const checkBookmarkQuery = trpc.practice.isBookmarked.useQuery({ questionId }, { enabled: !!user });

  useEffect(() => {
    if (checkBookmarkQuery.data !== undefined) {
      setIsBookmarked(checkBookmarkQuery.data);
    }
  }, [checkBookmarkQuery.data]);

  const handleToggleBookmark = async () => {
    if (!user) return;
    
    try {
      if (isBookmarked) {
        await removeBookmarkMutation.mutateAsync({ questionId });
      } else {
        await addBookmarkMutation.mutateAsync({ questionId });
      }
      setIsBookmarked(!isBookmarked);
    } catch (error) {
      console.error("Failed to toggle bookmark", error);
    }
  };

  if (!user) return null;

  return (
    <button
      onClick={handleToggleBookmark}
      className={`p-2 rounded-lg transition-colors ml-4 ${
        isBookmarked
          ? "bg-yellow-600/20 text-yellow-400 border border-yellow-600"
          : "bg-background border border-border text-foreground hover:bg-border"
      }`}
      title={isBookmarked ? "Remove bookmark" : "Add bookmark"}
    >
      <span className="text-xl">{isBookmarked ? "★" : "☆"}</span>
    </button>
  );
}

function useAuth() {
  const { data: user } = trpc.auth.me.useQuery();
  return { user };
}
