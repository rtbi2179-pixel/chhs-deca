'use client';

import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronDown, CheckCircle2, Bookmark } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function Practice() {
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  const [showClusterModal, setShowClusterModal] = useState(true);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<Set<string>>(new Set());
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Timer effect
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused]);

  // Format time as HH:MM:SS
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Fetch answered questions
  const { data: answeredData } = trpc.practice.getAnsweredQuestions.useQuery();

  // Update answered questions when data changes
  useEffect(() => {
    if (answeredData?.answeredQuestionIds) {
      setAnsweredQuestionIds(new Set(answeredData.answeredQuestionIds));
    }
  }, [answeredData]);

  // Fetch paginated questions from the database
  const { data: questionsData, isLoading } = trpc.practice.getQuestions.useQuery({
    cluster: selectedCluster === "all" || !selectedCluster ? undefined : selectedCluster,
    difficulty: selectedDifficulty === "all" ? undefined : selectedDifficulty,
    page: currentPage,
    pageSize,
  }, { enabled: !!selectedCluster && !showClusterModal });

  // Extract questions from paginated response
  const allQuestions = questionsData?.questions || [];
  const totalQuestions = questionsData?.total || 0;
  const totalPages = questionsData?.totalPages || 1;

  const currentQuestion = allQuestions[currentQuestionIndex];
  const isCurrentQuestionAnswered = currentQuestion ? answeredQuestionIds.has(currentQuestion.id) : false;
  const isCurrentQuestionMarked = currentQuestion ? markedForReview.has(currentQuestion.id) : false;

  const clusters = [
    { value: "Marketing", label: "Marketing", color: "from-blue-600 to-blue-500", icon: "chart", questions: "9,200+" },
    { value: "Business Management & Administration", label: "Business Management", color: "from-cyan-500 to-blue-400", icon: "briefcase", questions: "9,500+" },
    { value: "Finance", label: "Finance", color: "from-indigo-600 to-blue-500", icon: "dollar", questions: "9,100+" },
    { value: "Hospitality & Tourism", label: "Hospitality & Tourism", color: "from-slate-600 to-slate-500", icon: "building", questions: "9,300+" },
  ];

  const renderClusterIcon = (iconType: string) => {
    switch (iconType) {
      case "chart":
        return (
          <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="2" x2="12" y2="22" />
            <path d="M17 5h-5v14h5V5z" />
            <path d="M7 9h-2v10h2V9z" />
          </svg>
        );
      case "briefcase":
        return (
          <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
            <line x1="2" y1="11" x2="22" y2="11" />
          </svg>
        );
      case "dollar":
        return (
          <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        );
      case "building":
        return (
          <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
            <line x1="9" y1="5" x2="9" y2="9" />
            <line x1="15" y1="5" x2="15" y2="9" />
          </svg>
        );
      default:
        return null;
    }
  };

  const handleSelectCluster = (cluster: string) => {
    setSelectedCluster(cluster);
    setShowClusterModal(false);
  };

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
      const result = await submitAnswerMutation.mutateAsync({
        questionId: currentQuestion.id,
        selectedAnswer,
        correctAnswer: currentQuestion.correctAnswer,
      });

      if (result.blueBucksAwarded > 0) {
        toast.success(`${result.message}`);
      }

      await updateLeaderboardMutation.mutateAsync({
        correctAnswers: newScore,
        totalAnswered: newTotalAnswered,
        cluster: currentQuestion.cluster,
      });
      
      const utils = trpc.useUtils();
      utils.practice.getBlueBucksBalance.invalidate();
    } catch (error) {
      console.error("Failed to submit answer or update leaderboard", error);
      toast.error("Failed to process your answer");
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestion) {
      setAnsweredQuestionIds(prev => {
        const newSet = new Set(prev);
        newSet.add(currentQuestion.id);
        return newSet;
      });
    }

    if (currentQuestionIndex < allQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setShowExplanation(false);
    } else if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      setCurrentQuestionIndex(0);
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
    } else if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      setCurrentQuestionIndex(pageSize - 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setShowExplanation(false);
    }
  };

  const toggleMarkForReview = () => {
    if (!currentQuestion) return;
    setMarkedForReview(prev => {
      const newSet = new Set(prev);
      if (newSet.has(currentQuestion.id)) {
        newSet.delete(currentQuestion.id);
      } else {
        newSet.add(currentQuestion.id);
      }
      return newSet;
    });
  };

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

  const currentQuestionNumber = (currentPage - 1) * pageSize + currentQuestionIndex + 1;

  if (showClusterModal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col items-center justify-center mt-16 px-4 py-8">
        <div className="max-w-6xl w-full">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white text-xl">📚</span>
            </div>
            <h1 className="text-4xl font-bold text-white">Question Bank</h1>
          </div>

          <p className="text-slate-300 text-lg mb-8">Select a cluster to practice:</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {clusters.map((cluster: any) => (
              <button
                key={cluster.value}
                onClick={() => handleSelectCluster(cluster.value)}
                className={`bg-gradient-to-br ${cluster.color} rounded-2xl p-8 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 relative overflow-hidden group`}
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 text-left">
                  <div className="mb-3 text-white">{renderClusterIcon(cluster.icon)}</div>
                  <h2 className="text-3xl font-bold mb-2">{cluster.label}</h2>
                  <p className="text-white/90 mb-6 text-lg">{cluster.questions} questions</p>
                  <div className="inline-flex items-center gap-2 bg-white text-slate-900 px-6 py-2 rounded-full font-semibold hover:bg-slate-100 transition">
                    Open
                    <span>→</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col mt-16">
      {/* Top Header - Two Row Layout */}
      <div className="bg-background border-b border-border px-6 py-3 sticky top-0 z-50 shadow-md">
        {/* Row 1: Left and Center */}
        <div className="flex items-center justify-between gap-6 mb-3">
          {/* Left Section */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="text-foreground/70">
              ← Go back
            </Button>
            <select
              value={selectedCluster || ""}
              onChange={(e) => {
                setSelectedCluster(e.target.value);
                setCurrentPage(1);
                setCurrentQuestionIndex(0);
              }}
              className="px-3 py-2 bg-background border border-border rounded-md text-foreground text-sm"
            >
              {clusters.map((cluster) => (
                <option key={cluster.value} value={cluster.value}>
                  {cluster.label}
                </option>
              ))}
            </select>
          </div>

          {/* Center Section - Timer */}
          <div className="flex items-center gap-6 flex-shrink-0">
            <p className="text-xl font-bold text-foreground whitespace-nowrap">{formatTime(elapsedSeconds)}</p>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setIsPaused(!isPaused)}
              className="text-foreground/70 whitespace-nowrap"
            >
              {isPaused ? '▶' : '⏸'} {isPaused ? 'Resume' : 'Pause'}
            </Button>
          </div>

        </div>

        {/* Row 2: Action Buttons */}
        <div className="flex items-center gap-2 justify-end">
          <Button variant="ghost" size="sm" className="text-cyan-400 whitespace-nowrap">
            ✏️ Highlight
          </Button>
          <Button variant="ghost" size="sm" className="text-foreground/70 whitespace-nowrap">
            🧮 Calculator
          </Button>
          <Button variant="ghost" size="sm" className="text-foreground/70 whitespace-nowrap">
            📖 Reference
          </Button>
          <Button variant="ghost" size="sm" className="text-foreground/70">
            ⋯
          </Button>
          <div className="flex items-center gap-3 ml-4 pl-4 border-l border-border">
            <div className="text-center">
              <span className="text-sm text-red-500 font-bold">0</span>
            </div>
            <div className="text-center">
              <span className="text-sm text-blue-500 font-bold">20</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto px-6 py-12">
        {currentQuestion ? (
          <div className="max-w-4xl mx-auto">
            {/* Question Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-foreground text-background rounded-lg flex items-center justify-center font-bold text-lg">
                  {currentQuestionNumber}
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isCurrentQuestionMarked}
                    onChange={toggleMarkForReview}
                    className="w-5 h-5 cursor-pointer"
                  />
                  <span className="text-foreground text-sm">Mark for Review</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  📋
                </Button>
                <Button variant="ghost" size="sm" className="text-foreground/70">
                  Report
                </Button>
              </div>
            </div>

            {/* Question Text */}
            <div className="mb-8">
              <p className="text-lg text-foreground leading-relaxed">{currentQuestion.stem}</p>
            </div>

            {/* Answer Options */}
            <div className="space-y-3 mb-8">
              {['A', 'B', 'C', 'D'].map((option) => {
                const optionKey = `option${option}` as keyof typeof currentQuestion;
                const optionText = currentQuestion[optionKey];
                const isSelected = selectedAnswer === option;
                const isCorrect = option === currentQuestion.correctAnswer;
                const showAsCorrect = showResult && isCorrect;
                const showAsIncorrect = showResult && isSelected && !isCorrect;

                return (
                  <div
                    key={option}
                    onClick={() => handleAnswerSelect(option)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      showAsCorrect
                        ? 'bg-green-500/10 border-green-500'
                        : showAsIncorrect
                        ? 'bg-red-500/10 border-red-500'
                        : isSelected
                        ? 'bg-blue-500/10 border-blue-500'
                        : 'bg-background/50 border-border hover:border-blue-500/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 font-bold ${
                        showAsCorrect
                          ? 'bg-green-500 border-green-500 text-white'
                          : showAsIncorrect
                          ? 'bg-red-500 border-red-500 text-white'
                          : isSelected
                          ? 'bg-blue-500 border-blue-500 text-white'
                          : 'border-foreground/30 text-foreground'
                      }`}>
                        {option}
                      </div>
                      <p className="text-foreground flex-1 pt-1">{String(optionText)}</p>
                    </div>
                  </div>
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
                  <div className="mt-4 pt-4 border-t border-foreground/20">
                    <p className="text-foreground/90">{currentQuestion.rationale}</p>
                  </div>
                )}
              </div>
            )}

            {/* Completion Status */}
            {isCurrentQuestionAnswered && (
              <div className="mb-4 p-3 bg-green-600/20 border border-green-500/30 rounded-md flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <span className="text-green-400 font-semibold">Question Completed</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-xl text-foreground/70">No questions found.</p>
          </div>
        )}
      </div>

      {/* Bottom Navigation Bar */}
      <div className="bg-background border-t border-border px-6 py-4 flex items-center justify-between sticky bottom-0 z-40 shadow-md">
        <Button variant="outline" size="sm" className="bg-foreground text-background">
          {currentQuestionNumber} of {totalQuestions}
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>

        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm"
            className="text-foreground/70"
          >
            ℹ
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            💬 Ask Preppy
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            🎓 Masterclass
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            className="text-pink-400 hover:text-pink-300"
          >
            🎵 Remix
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowExplanation(!showExplanation)}
            className="text-foreground/70"
          >
            Explanation
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handlePreviousQuestion}
            disabled={currentPage === 1 && currentQuestionIndex === 0}
            className="text-foreground/70"
          >
            Previous
          </Button>
          <Button 
            onClick={!showResult ? handleSubmitAnswer : handleNextQuestion}
            disabled={!showResult && !selectedAnswer}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {!showResult ? 'Submit' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
}
