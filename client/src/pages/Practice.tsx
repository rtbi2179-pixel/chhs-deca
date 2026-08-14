'use client';

import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronDown, CheckCircle2, Bookmark, Grid3x3, Save, Award, Clock, DollarSign, Info, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function Practice() {
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  const [showClusterModal, setShowClusterModal] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10000);
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
  const [clusterProgress, setClusterProgress] = useState<Record<string, number>>({});
  const [showGridNavigator, setShowGridNavigator] = useState(false);
  const [sessionSaved, setSessionSaved] = useState(false);
  const [showSessionSummary, setShowSessionSummary] = useState(false);
  const [sessionBlueBucks, setSessionBlueBucks] = useState(0);
  const [showQuestionInfo, setShowQuestionInfo] = useState(false);
  const [blueBucksChange, setBlueBucksChange] = useState<{ amount: number; timestamp: number } | null>(null);

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
    page: 1,
    pageSize: 10000,
  }, { enabled: !!selectedCluster && !showClusterModal });

  // Extract questions from paginated response
  const allQuestions = questionsData?.questions || [];
  const totalQuestions = questionsData?.total || 0;
  const totalPages = questionsData?.totalPages || 1;

  // Use questions as-is (no sorting)
  const filteredQuestions = allQuestions;

  const currentQuestion = filteredQuestions[currentQuestionIndex];
  const isCurrentQuestionAnswered = currentQuestion ? answeredQuestionIds.has(currentQuestion.id) : false;
  const isCurrentQuestionMarked = currentQuestion ? markedForReview.has(currentQuestion.id) : false;
  const totalFilteredQuestions = filteredQuestions.length;


  // Save session to localStorage
  const saveSession = () => {
    const sessionData = {
      selectedCluster,
      currentQuestionIndex,
      answeredQuestionIds: Array.from(answeredQuestionIds),
      markedForReview: Array.from(markedForReview),
      elapsedSeconds,
      selectedAnswer,
      showResult,
    };
    localStorage.setItem(`practice_session_${selectedCluster}`, JSON.stringify(sessionData));
    setSessionSaved(true);
    toast.success('Session saved! You can resume later.');
    setTimeout(() => setSessionSaved(false), 3000);
  };

  // Load session from localStorage
  const loadSession = () => {
    if (!selectedCluster) return;
    const sessionData = localStorage.getItem(`practice_session_${selectedCluster}`);
    if (sessionData) {
      try {
        const data = JSON.parse(sessionData);
        setCurrentQuestionIndex(data.currentQuestionIndex || 0);
        setAnsweredQuestionIds(new Set(data.answeredQuestionIds || []));
        setMarkedForReview(new Set(data.markedForReview || []));
        setElapsedSeconds(data.elapsedSeconds || 0);
        setSelectedAnswer(data.selectedAnswer || null);
        setShowResult(data.showResult || false);
        toast.success('Session resumed!');
      } catch (e) {
        console.error('Failed to load session:', e);
      }
    }
  };

  // Load session when cluster is selected
  useEffect(() => {
    if (selectedCluster && !showClusterModal) {
      loadSession();
    }
  }, [selectedCluster, showClusterModal]);

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
    setIsTransitioning(true);
    setTimeout(() => {
      setSelectedCluster(cluster);
      setShowClusterModal(false);
      setIsTransitioning(false);
    }, 300);
  };

  const getClusterProgress = (clusterValue: string) => {
    // Get total answered questions for this cluster
    const answeredCount = Array.from(answeredQuestionIds).filter(id => id.includes(clusterValue)).length;
    // Assume ~100 questions per session for progress bar (0-100%)
    // This shows relative progress rather than absolute
    return Math.min(Math.round((answeredCount / 10) * 100), 100);
  };

  const getTotalAnsweredByCluster = (clusterValue: string) => {
    return Array.from(answeredQuestionIds).filter(id => id.includes(clusterValue)).length;
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
        toast.success(`${result.message}${result.studyCardBonus > 0 ? ` Study Card bonus: +${result.studyCardBonus}.` : ""}`);
        setBlueBucksChange({
          amount: result.blueBucksAwarded,
          timestamp: Date.now()
        });
        // Clear the animation after 2 seconds
        setTimeout(() => setBlueBucksChange(null), 2000);
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

  const handleJumpToNextUnanswered = () => {
    // Find the next unanswered question starting from current index + 1
    for (let i = currentQuestionIndex + 1; i < allQuestions.length; i++) {
      if (!answeredQuestionIds.has(allQuestions[i].id)) {
        setCurrentQuestionIndex(i);
        setSelectedAnswer(null);
        setShowResult(false);
        setShowExplanation(false);
        return;
      }
    }
    // If no unanswered found after current, search from beginning
    for (let i = 0; i < currentQuestionIndex; i++) {
      if (!answeredQuestionIds.has(allQuestions[i].id)) {
        setCurrentQuestionIndex(i);
        setSelectedAnswer(null);
        setShowResult(false);
        setShowExplanation(false);
        return;
      }
    }
    // All questions answered
    toast.success('All questions answered!');
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
          <h1 className="text-4xl font-bold text-white mb-12">Question Bank</h1>

          <p className="text-slate-300 text-lg mb-8">Select a cluster to practice:</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {clusters.map((cluster: any) => {
              const progress = getClusterProgress(cluster.value);
              const answered = getTotalAnsweredByCluster(cluster.value);
              return (
                <button
                  key={cluster.value}
                  onClick={() => handleSelectCluster(cluster.value)}
                  className={`bg-gradient-to-br ${cluster.color} rounded-2xl p-8 text-white shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 relative overflow-hidden group border-2 border-white/0 hover:border-white/30`}
                >
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10 text-left">
                    <div className="mb-3 text-white transform transition-transform duration-300 group-hover:scale-110">{renderClusterIcon(cluster.icon)}</div>
                    <h2 className="text-3xl font-bold mb-2">{cluster.label}</h2>
                    <p className="text-white/90 mb-3 text-lg">{cluster.questions} questions</p>
                    
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-white/80">Progress</span>
                        <span className="text-xs font-semibold text-white/90">{answered} completed</span>
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-white to-white/80 h-full rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${progress}%`, minWidth: progress > 0 ? '4px' : '0px' }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="inline-flex items-center gap-2 bg-white text-slate-900 px-6 py-2 rounded-full font-semibold hover:bg-slate-100 transition">
                      Open
                      <span>→</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const handleFinishSession = () => {
    // Calculate accuracy percentage
    const accuracy = totalAnswered > 0 ? Math.round((score / totalAnswered) * 100) : 0;
    
    // Estimate blue bucks earned (1 point per correct answer)
    const estimatedBlueBucks = score * 10; // 10 blue bucks per correct answer
    setSessionBlueBucks(estimatedBlueBucks);
    
    setShowSessionSummary(true);
  };

  const handleExitSession = () => {
    setShowSessionSummary(false);
    setShowClusterModal(true);
    setSelectedCluster(null);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setTotalAnswered(0);
    setElapsedSeconds(0);
  };

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
            {/* Difficulty Filter */}
            <select
              value={selectedDifficulty}
              onChange={(e) => {
                setSelectedDifficulty(e.target.value);
                setCurrentPage(1);
                setCurrentQuestionIndex(0);
              }}
              className="px-3 py-2 bg-background border border-border rounded-md text-foreground text-sm"
              title="Filter by difficulty"
            >
              <option value="all">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
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
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowGridNavigator(!showGridNavigator)}
              className="text-foreground/70 whitespace-nowrap"
              title="Show question grid"
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={saveSession}
              className={`whitespace-nowrap ${sessionSaved ? 'text-green-500' : 'text-foreground/70'}`}
              title="Save your progress"
            >
              <Save className="w-4 h-4" />
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
          <div className="flex items-center gap-3 ml-4 pl-4 border-l border-border relative">
            <div className="text-center">
              <span className="text-sm text-red-500 font-bold">0</span>
            </div>
            <div className="text-center relative">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-400" />
                <span className="text-sm text-green-400 font-bold">20</span>
              </div>
              <AnimatePresence>
                {blueBucksChange && (
                  <motion.div
                    initial={{ opacity: 0, y: 0 }}
                    animate={{ opacity: 1, y: -30 }}
                    exit={{ opacity: 0, y: -50 }}
                    transition={{ duration: 1.5 }}
                    className="absolute top-0 left-1/2 transform -translate-x-1/2 text-green-400 font-bold text-lg"
                  >
                    +{blueBucksChange.amount}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}

      {/* Grid Navigator Modal */}
      {showGridNavigator && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-lg p-6 max-w-4xl w-full max-h-96 overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">Question Navigator</h2>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowGridNavigator(false)}
                className="text-foreground/70"
              >
                ✕
              </Button>
            </div>
            
            {/* Legend */}
            <div className="flex gap-6 mb-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-500 rounded"></div>
                <span className="text-foreground/80">Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-slate-500 rounded"></div>
                <span className="text-foreground/80">Unanswered</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-yellow-500 rounded"></div>
                <span className="text-foreground/80">Marked for Review</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-500 rounded"></div>
                <span className="text-foreground/80">Current</span>
              </div>
            </div>

            {/* Question Grid */}
            <div className="grid grid-cols-10 gap-2">
              {allQuestions.map((q, idx) => {
                const isAnswered = answeredQuestionIds.has(q.id);
                const isMarked = markedForReview.has(q.id);
                const isCurrent = idx === currentQuestionIndex;
                
                let bgColor = 'bg-slate-500';
                if (isCurrent) bgColor = 'bg-blue-500';
                else if (isMarked) bgColor = 'bg-yellow-500';
                else if (isAnswered) bgColor = 'bg-green-500';
                
                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setCurrentQuestionIndex(idx);
                      setShowGridNavigator(false);
                      setSelectedAnswer(null);
                      setShowResult(false);
                    }}
                    className={`w-8 h-8 rounded text-xs font-semibold text-white ${bgColor} hover:opacity-80 transition-opacity`}
                    title={`Q${idx + 1} - ${isAnswered ? 'Answered' : 'Unanswered'}${isMarked ? ' (Marked)' : ''}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto px-6 py-12">
        {currentQuestion ? (
          <div className="max-w-4xl mx-auto">
            {/* Question Header */}
            <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-foreground text-background rounded-lg flex items-center justify-center font-bold text-lg">
                  {currentQuestionNumber}
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isCurrentQuestionMarked}
                      onChange={toggleMarkForReview}
                      className="w-5 h-5 cursor-pointer"
                    />
                    <span className="text-foreground text-sm">Mark for Review</span>
                  </div>
                  <div className="text-xs text-foreground/60">
                    Question {currentQuestionNumber} of {allQuestions.length}
                  </div>
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
                <div className="flex items-center justify-between mb-4">
                  <p className="font-bold text-lg">
                    {selectedAnswer === currentQuestion.correctAnswer ? '✓ Correct!' : '✗ Incorrect'}
                  </p>
                  <button
                    onClick={() => setShowExplanation(!showExplanation)}
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-2 px-3 py-1 rounded hover:bg-blue-500/10 transition-colors"
                  >
                    {showExplanation ? 'Hide' : 'Show'} Explanation
                    <ChevronDown className={`w-4 h-4 transition-transform ${showExplanation ? 'rotate-180' : ''}`} />
                  </button>
                </div>
                {showExplanation && currentQuestion && (
                  <div className="mt-4 pt-4 border-t border-foreground/20 space-y-4">
                    {currentQuestion.rationale && (
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">Correct Answer Rationale:</h4>
                        <p className="text-foreground/90 leading-relaxed">{currentQuestion.rationale}</p>
                      </div>
                    )}
                    {(currentQuestion.distractorRationaleA || currentQuestion.distractorRationaleB || currentQuestion.distractorRationaleC || currentQuestion.distractorRationaleD) && (
                      <div>
                        <h4 className="font-semibold text-foreground mb-3">Why Other Answers Are Incorrect:</h4>
                        <div className="space-y-3 text-sm">
                          {currentQuestion.distractorRationaleA && (
                            <div className="bg-foreground/5 p-3 rounded">
                              <p className="text-foreground/80"><span className="font-semibold text-foreground">Option A:</span> {currentQuestion.distractorRationaleA}</p>
                            </div>
                          )}
                          {currentQuestion.distractorRationaleB && (
                            <div className="bg-foreground/5 p-3 rounded">
                              <p className="text-foreground/80"><span className="font-semibold text-foreground">Option B:</span> {currentQuestion.distractorRationaleB}</p>
                            </div>
                          )}
                          {currentQuestion.distractorRationaleC && (
                            <div className="bg-foreground/5 p-3 rounded">
                              <p className="text-foreground/80"><span className="font-semibold text-foreground">Option C:</span> {currentQuestion.distractorRationaleC}</p>
                            </div>
                          )}
                          {currentQuestion.distractorRationaleD && (
                            <div className="bg-foreground/5 p-3 rounded">
                              <p className="text-foreground/80"><span className="font-semibold text-foreground">Option D:</span> {currentQuestion.distractorRationaleD}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
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
            onClick={() => setShowQuestionInfo(!showQuestionInfo)}
            className="text-foreground/70"
            title="Question Information"
          >
            <Info className="w-4 h-4" />
          </Button>

          {showResult && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowExplanation(!showExplanation)}
              className="text-foreground/70"
              title="Show/Hide Explanation"
            >
              {showExplanation ? 'Hide' : 'Show'} Explanation
            </Button>
          )}

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
            onClick={handleJumpToNextUnanswered}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            Skip to Unanswered
          </Button>
          <Button 
            onClick={!showResult ? handleSubmitAnswer : handleNextQuestion}
            disabled={!showResult && !selectedAnswer}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {!showResult ? 'Submit' : 'Next'}
          </Button>
          <Button 
            onClick={handleFinishSession}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Finish Session
          </Button>
        </div>
      </div>

      {/* Session Summary Modal */}

      {/* Question Info Modal */}
      {showQuestionInfo && currentQuestion && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-lg p-6 max-w-2xl w-full max-h-96 overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">Question Information</h2>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowQuestionInfo(false)}
                className="text-foreground/70"
              >
                ✕
              </Button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="border-b border-border pb-3">
                <p className="text-foreground/70 font-medium">ID:</p>
                <p className="text-foreground">{currentQuestion.id}</p>
              </div>
              <div className="border-b border-border pb-3">
                <p className="text-foreground/70 font-medium">Cluster:</p>
                <p className="text-foreground">{currentQuestion.cluster}</p>
              </div>
              <div className="border-b border-border pb-3">
                <p className="text-foreground/70 font-medium">Instructional Area:</p>
                <p className="text-foreground">{currentQuestion.instructionalArea}</p>
              </div>
              <div className="border-b border-border pb-3">
                <p className="text-foreground/70 font-medium">Performance Indicator Focus:</p>
                <p className="text-foreground">{currentQuestion.performanceIndicatorFocus}</p>
              </div>
              <div className="border-b border-border pb-3">
                <p className="text-foreground/70 font-medium">Cognitive Level:</p>
                <p className="text-foreground">{currentQuestion.cognitiveLevel}</p>
              </div>
              <div>
                <p className="text-foreground/70 font-medium">Difficulty:</p>
                <p className="text-foreground">{currentQuestion.difficulty}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      {showSessionSummary && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-background border border-border rounded-lg p-8 max-w-md w-full shadow-2xl"
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mb-6 flex justify-center"
              >
                <Award className="w-16 h-16 text-yellow-500" />
              </motion.div>
              
              <h2 className="text-3xl font-bold text-foreground mb-2">Session Complete!</h2>
              <p className="text-foreground/70 mb-8">Great job practicing today!</p>
              
              <div className="space-y-4 mb-8">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                  className="flex items-center justify-between p-4 bg-blue-500/10 rounded-lg border border-blue-500/20"
                >
                  <div className="flex items-center gap-3">
                    <Award className="w-5 h-5 text-blue-400" />
                    <span className="text-foreground/80">Correct Answers</span>
                  </div>
                  <span className="text-xl font-bold text-blue-400">{score}/{totalAnswered}</span>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 }}
                  className="flex items-center justify-between p-4 bg-purple-500/10 rounded-lg border border-purple-500/20"
                >
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-purple-400" />
                    <span className="text-foreground/80">Time Taken</span>
                  </div>
                  <span className="text-xl font-bold text-purple-400">{formatTime(elapsedSeconds)}</span>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.5 }}
                  className="flex items-center justify-between p-4 bg-green-500/10 rounded-lg border border-green-500/20"
                >
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-green-400" />
                    <span className="text-foreground/80">Blue Bucks Earned</span>
                  </div>
                  <span className="text-xl font-bold text-green-400">+{sessionBlueBucks}</span>
                </motion.div>
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowSessionSummary(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Continue Practicing
                </Button>
                <Button
                  onClick={handleExitSession}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Return to Clusters
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
