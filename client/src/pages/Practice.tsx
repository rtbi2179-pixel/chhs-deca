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
  const [showStudySessions, setShowStudySessions] = useState(false);
  const [sessionName, setSessionName] = useState("");

  // Fetch bookmarked questions
  const { data: bookmarkedQuestions = [] } = trpc.practice.getBookmarkedQuestions.useQuery(undefined, {
    enabled: showStudySessions,
  });

  // Create study session mutation
  const createSessionMutation = trpc.practice.createStudySession.useMutation();

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

  const handleCreateStudySession = async () => {
    if (!sessionName.trim() || bookmarkedQuestions.length === 0) return;

    try {
      await createSessionMutation.mutateAsync({
        name: sessionName,
        questionIds: bookmarkedQuestions.map((q: any) => q.id),
      });
      setSessionName('');
    } catch (error) {
      console.error('Failed to create study session', error);
    }
  };

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
              <button
                onClick={() => setShowStudySessions(!showStudySessions)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium transition-colors"
              >
                Study Sessions
              </button>
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
                    <p className="text-foreground/90 mt-4">{currentQuestion.explanation}</p>
                  </div>
                )}
              </div>
            )}

            {/* Submit/Next Buttons */}
            <div className="flex gap-4 justify-between">
              <Button
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className="bg-gray-600 hover:bg-gray-700 disabled:opacity-50"
              >
                Previous
              </Button>

              <div className="flex gap-2">
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
                    onClick={handleNextQuestion}
                    disabled={currentQuestionIndex === filteredQuestions.length - 1}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    Next
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <label htmlFor="question-jump-bottom" className="text-foreground font-semibold text-sm">Jump to:</label>
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
                <span className="text-foreground/70 text-sm">/ {filteredQuestions.length}</span>
              </div>
            </div>
          </Card>
        )}

        {/* Study Sessions Section */}
        {showStudySessions && (
          <Card className="mt-6 p-6 border border-border">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground">Study Sessions</h3>
              <button
                onClick={() => setShowStudySessions(false)}
                className="text-foreground/70 hover:text-foreground text-2xl"
              >
                ×
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-foreground font-semibold mb-3 text-sm">Bookmarked Questions</label>
              {bookmarkedQuestions.length === 0 ? (
                <p className="text-foreground/70 text-sm mb-4">No bookmarked questions yet. Bookmark questions from the practice quiz to create a study session.</p>
              ) : (
                <div className="mb-4">
                  <p className="text-foreground text-sm mb-3">
                    You have <span className="font-bold text-blue-400">{bookmarkedQuestions.length}</span> bookmarked questions
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter session name (e.g., 'Marketing Review')"
                      value={sessionName}
                      onChange={(e) => setSessionName(e.target.value)}
                      className="flex-1 px-3 py-2 bg-background border border-border rounded text-foreground placeholder-foreground/50 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={handleCreateStudySession}
                      disabled={createSessionMutation.isPending || !sessionName.trim()}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white rounded text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      {createSessionMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Create'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-foreground font-semibold mb-3 text-sm">How It Works</label>
              <p className="text-foreground/70 text-xs">
                Study sessions allow you to create custom quizzes from your bookmarked questions. Bookmark questions while taking the practice quiz, then create a session here to review them.
              </p>
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
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
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

                <LeaderboardContent cluster={leaderboardCluster} />
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
  const { data: isBookmarked } = trpc.practice.isBookmarked.useQuery({ questionId });
  const addBookmarkMutation = trpc.practice.addBookmark.useMutation();
  const removeBookmarkMutation = trpc.practice.removeBookmark.useMutation();

  const handleToggleBookmark = async () => {
    try {
      if (isBookmarked) {
        await removeBookmarkMutation.mutateAsync({ questionId });
      } else {
        await addBookmarkMutation.mutateAsync({ questionId });
      }
    } catch (error) {
      console.error("Failed to toggle bookmark", error);
    }
  };

  return (
    <button
      onClick={handleToggleBookmark}
      className="text-2xl hover:scale-110 transition-transform"
      title={isBookmarked ? "Remove bookmark" : "Bookmark this question"}
    >
      {isBookmarked ? "★" : "☆"}
    </button>
  );
}

// Leaderboard Content Component
function LeaderboardContent({ cluster }: { cluster: string }) {
  const { data: leaderboard = [], isLoading } = trpc.practice.getLeaderboardByCluster.useQuery(
    { cluster, limit: 50 },
    { enabled: cluster === "overall" ? false : true }
  );

  const { data: overallLeaderboard = [] } = trpc.practice.getLeaderboard.useQuery(
    { limit: 50 },
    { enabled: cluster === "overall" }
  );

  const displayData = cluster === "overall" ? overallLeaderboard : leaderboard;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!displayData || displayData.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-foreground/70">No leaderboard data yet. Start answering questions to appear here!</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left px-4 py-3 text-foreground font-semibold">Rank</th>
            <th className="text-left px-4 py-3 text-foreground font-semibold">Student</th>
            <th className="text-center px-4 py-3 text-foreground font-semibold">Accuracy</th>
            <th className="text-center px-4 py-3 text-foreground font-semibold">Questions</th>
            <th className="text-center px-4 py-3 text-foreground font-semibold">Correct</th>
          </tr>
        </thead>
        <tbody>
          {displayData.map((entry: any, index: number) => {
            const accuracy = entry.totalAnswered > 0 ? Math.round((entry.correctAnswers / entry.totalAnswered) * 100) : 0;
            return (
              <tr key={index} className="border-b border-border/50 hover:bg-background/50">
                <td className="px-4 py-3 text-foreground font-bold">{index + 1}</td>
                <td className="px-4 py-3 text-foreground">{entry.user?.name || "Anonymous"}</td>
                <td className="px-4 py-3 text-center text-foreground">{accuracy}%</td>
                <td className="px-4 py-3 text-center text-foreground">{entry.totalAnswered}</td>
                <td className="px-4 py-3 text-center text-foreground font-semibold text-green-400">{entry.correctAnswers}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
