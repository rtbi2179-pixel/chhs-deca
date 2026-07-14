'use client';

import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ChevronDown } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

export default function Practice() {
  const [selectedCluster, setSelectedCluster] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
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
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<Set<string>>(new Set());

  // Fetch answered questions
  // const { data: answeredData } = trpc.practice.getAnsweredQuestions.useQuery();
  // const { data: streakData } = trpc.practice.getUserStreak.useQuery();

  // Update answered questions when data changes
  // useMemo(() => {
  //   if (answeredData?.answeredQuestionIds) {
  //     setAnsweredQuestionIds(new Set(answeredData.answeredQuestionIds));
  //   }
  // }, [answeredData]);

  // Fetch bookmarked questions
  const { data: bookmarkedQuestions = [] } = trpc.practice.getBookmarkedQuestions.useQuery(undefined, {
    enabled: showStudySessions,
  });

  // Create study session mutation
  const createSessionMutation = trpc.practice.createStudySession.useMutation();

  // Fetch paginated questions from the database
  const { data: questionsData, isLoading } = trpc.practice.getQuestions.useQuery({
    cluster: selectedCluster === "all" ? undefined : selectedCluster,
    difficulty: selectedDifficulty === "all" ? undefined : selectedDifficulty,
    page: currentPage,
    pageSize,
  });

  // Extract questions from paginated response
  const allQuestions = questionsData?.questions || [];
  const totalQuestions = questionsData?.total || 0;
  const totalPages = questionsData?.totalPages || 1;

  const currentQuestion = allQuestions[currentQuestionIndex];

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
    if (showResult) return;
    setSelectedAnswer(answer);
  };

  const updateLeaderboardMutation = trpc.practice.updateLeaderboard.useMutation();
  const submitAnswerMutation = trpc.practice.submitAnswer.useMutation();

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
      // Submit answer and award Blue Bucks
      const result = await submitAnswerMutation.mutateAsync({
        questionId: currentQuestion.id,
        selectedAnswer,
        correctAnswer: currentQuestion.correctAnswer,
      });

      // Show Blue Bucks award notification
      if (result.blueBucksAwarded > 0) {
        toast.success(`${result.message}`);
      }

      // Update leaderboard and invalidate Blue Bucks balance
      await updateLeaderboardMutation.mutateAsync({
        correctAnswers: newScore,
        totalAnswered: newTotalAnswered,
        cluster: currentQuestion.cluster,
      });
      
      // Invalidate Blue Bucks balance to refresh the display
      const utils = trpc.useUtils();
      utils.practice.getBlueBucksBalance.invalidate();
    } catch (error) {
      console.error("Failed to submit answer or update leaderboard", error);
      toast.error("Failed to process your answer");
    }
  };

  const handleNextQuestion = () => {
    // Mark question as answered
    if (currentQuestion) {
      setAnsweredQuestionIds(prev => {
        const newSet = new Set(prev);
        newSet.add(currentQuestion.id);
        return newSet;
      });
    }

    if (currentQuestionIndex < allQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else if (currentPage < totalPages) {
      // Load next page
      setCurrentPage(currentPage + 1);
      setCurrentQuestionIndex(0);
    }
    setSelectedAnswer(null);
    setShowResult(false);
    setShowExplanation(false);
  };

  const handlePreviousQuestion = () => {
    // Mark question as answered
    if (currentQuestion) {
      setAnsweredQuestionIds(prev => {
        const newSet = new Set(prev);
        newSet.add(currentQuestion.id);
        return newSet;
      });
    }

    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else if (currentPage > 1) {
      // Load previous page
      setCurrentPage(currentPage - 1);
      setCurrentQuestionIndex(pageSize - 1);
    }
    setSelectedAnswer(null);
    setShowResult(false);
    setShowExplanation(false);
  };

  const handleResetFilters = () => {
    setSelectedCluster("all");
    setSelectedDifficulty("all");
    setCurrentPage(1);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setShowExplanation(false);
    setScore(0);
    setTotalAnswered(0);
  };

  const handleShowLeaderboard = () => {
    setShowLeaderboard(!showLeaderboard);
  };

  const handleShowStudySessions = () => {
    setShowStudySessions(!showStudySessions);
  };

  const { data: leaderboardData } = trpc.practice.getLeaderboard.useQuery(
    { limit: 50 },
    { enabled: showLeaderboard }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
          <p className="text-foreground">Loading questions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Practice Questions</h1>
          <div className="flex items-center justify-between">
            <p className="text-foreground/70">
              {totalQuestions.toLocaleString()} questions available • Page {currentPage} of {totalPages}
            </p>
            {/* Streak display disabled */}
          </div>
        </div>

        {/* Filter Controls */}
        <Card className="p-6 mb-8 border border-border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Cluster Filter */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Cluster</label>
              <select
                value={selectedCluster}
                onChange={(e) => {
                  setSelectedCluster(e.target.value);
                  setCurrentPage(1);
                  setCurrentQuestionIndex(0);
                }}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {clusters.map((cluster) => (
                  <option key={cluster.value} value={cluster.value}>
                    {cluster.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty Filter */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Difficulty</label>
              <select
                value={selectedDifficulty}
                onChange={(e) => {
                  setSelectedDifficulty(e.target.value);
                  setCurrentPage(1);
                  setCurrentQuestionIndex(0);
                }}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {difficulties.map((difficulty) => (
                  <option key={difficulty.value} value={difficulty.value}>
                    {difficulty.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex items-end gap-2">
              <Button
                onClick={handleResetFilters}
                variant="outline"
                className="flex-1"
              >
                Reset
              </Button>
              <Button
                onClick={handleShowLeaderboard}
                variant="outline"
                className="flex-1"
              >
                Leaderboard
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-foreground/70">Score</p>
              <p className="text-2xl font-bold text-blue-500">{score}/{totalAnswered}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-foreground/70">Accuracy</p>
              <p className="text-2xl font-bold text-green-500">
                {totalAnswered > 0 ? Math.round((score / totalAnswered) * 100) : 0}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-foreground/70">Progress</p>
              <p className="text-2xl font-bold text-purple-500">
                {((currentPage - 1) * pageSize + currentQuestionIndex + 1).toLocaleString()} / {totalQuestions.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        {/* Leaderboard */}
        {showLeaderboard && (
          <Card className="p-6 mb-8 border border-border">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-foreground">Leaderboard</h2>
              <select
                value={leaderboardCluster}
                onChange={(e) => setLeaderboardCluster(e.target.value)}
                className="px-3 py-2 bg-background border border-border rounded-md text-foreground"
              >
                <option value="overall">Overall</option>
                {clusters.slice(1).map((cluster) => (
                  <option key={cluster.value} value={cluster.value}>
                    {cluster.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              {leaderboardData?.slice(0, 10).map((entry: any, index: number) => (
                <div key={index} className="flex justify-between items-center p-3 bg-background/50 rounded-md">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-blue-500">#{index + 1}</span>
                    <span className="text-foreground">{entry.user.name}</span>
                  </div>
                  <span className="text-sm text-foreground/70">{Math.round(entry.leaderboard.accuracyPercentage)}%</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Study Sessions */}
        {showStudySessions && (
          <Card className="p-6 mb-8 border border-border">
            <h2 className="text-2xl font-bold text-foreground mb-4">Create Study Session</h2>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Session name..."
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                className="flex-1 px-3 py-2 bg-background border border-border rounded-md text-foreground placeholder-foreground/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button
                onClick={handleCreateStudySession}
                disabled={!sessionName.trim() || bookmarkedQuestions.length === 0}
              >
                Create ({bookmarkedQuestions.length})
              </Button>
            </div>
          </Card>
        )}

        {/* Question Card */}
        {currentQuestion && (
          <Card className="p-8 border border-border mb-8">
            {/* Already Answered Notice */}
            {answeredQuestionIds.has(currentQuestion.id) && (
              <div className="mb-6 p-3 bg-yellow-600/20 border border-yellow-500/30 rounded-md">
                <p className="text-sm text-yellow-400">⚠️ Question already answered; no Blue Bucks will be awarded on submission</p>
              </div>
            )}

            {/* Question Text */}
            <div className="mb-8">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-2xl font-bold text-foreground flex-1">{currentQuestion.stem}</h2>
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
              {['A', 'B', 'C', 'D'].map((option) => {
                const optionKey = `option${option}` as keyof typeof currentQuestion;
                const optionText = currentQuestion[optionKey];
                const isSelected = selectedAnswer === option;
                const isCorrect = option === currentQuestion.correctAnswer;
                const showCorrect = showResult && isCorrect;
                const showIncorrect = showResult && isSelected && !isCorrect;

                return (
                  <button
                    key={option}
                    onClick={() => handleAnswerSelect(option)}
                    disabled={showResult}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                      showCorrect
                        ? 'border-green-500 bg-green-500/10'
                        : showIncorrect
                        ? 'border-red-500 bg-red-500/10'
                        : isSelected
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-border hover:border-blue-400'
                    } ${showResult ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="font-bold text-lg w-6">{option}.</span>
                      <span className="text-foreground flex-1">{String(optionText)}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Result and Explanation */}
            {showResult && (
              <div className={`p-4 rounded-lg mb-8 ${
                selectedAnswer === currentQuestion.correctAnswer
                  ? 'bg-green-500/10 border border-green-500'
                  : 'bg-red-500/10 border border-red-500'
              }`}>
                <p className="font-bold text-lg mb-2">
                  {selectedAnswer === currentQuestion.correctAnswer ? '✓ Correct!' : '✗ Incorrect'}
                </p>
                <button
                  onClick={() => setShowExplanation(!showExplanation)}
                  className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-1"
                >
                  {showExplanation ? 'Hide' : 'Show'} Explanation
                  <ChevronDown className={`w-4 h-4 transition-transform ${showExplanation ? 'rotate-180' : ''}`} />
                </button>
                {showExplanation && (
                  <div className={`px-4 pb-4 border-t ${
                    selectedAnswer === currentQuestion.correctAnswer
                      ? "border-green-600"
                      : "border-red-600"
                  }`}>
                    <p className="text-foreground/90 mt-4">{currentQuestion.rationale}</p>
                  </div>
                )}
              </div>
            )}

            {/* Submit/Next Buttons */}
            <div className="flex gap-4 justify-between">
              <Button
                onClick={handlePreviousQuestion}
                disabled={currentPage === 1 && currentQuestionIndex === 0}
                className="bg-gray-600 hover:bg-gray-700 disabled:opacity-50"
              >
                Previous
              </Button>

              {!showResult ? (
                <Button
                  onClick={handleSubmitAnswer}
                  disabled={!selectedAnswer}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Submit Answer
                </Button>
              ) : (
                <Button
                  onClick={handleNextQuestion}
                  disabled={currentPage === totalPages && currentQuestionIndex === allQuestions.length - 1}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {currentPage === totalPages && currentQuestionIndex === allQuestions.length - 1
                    ? 'Quiz Complete'
                    : 'Next Question'}
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && allQuestions.length === 0 && (
          <Card className="p-12 text-center border border-border">
            <p className="text-xl text-foreground/70">No questions found with the selected filters.</p>
            <Button onClick={handleResetFilters} className="mt-4">
              Reset Filters
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}

// Bookmark Button Component
function BookmarkButton({ questionId }: { questionId: string }) {
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
    <Button
      onClick={handleToggleBookmark}
      variant="outline"
      size="sm"
      className={isBookmarked ? 'bg-blue-500/20 border-blue-500' : ''}
    >
      {isBookmarked ? '★' : '☆'} Bookmark
    </Button>
  );
}
