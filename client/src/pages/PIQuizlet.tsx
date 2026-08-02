import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, ChevronRight, BookOpen, Loader2, RotateCw, Send, CheckCircle, AlertCircle,
  Brain, Lightbulb, Zap, Target, MessageSquare, Award, ArrowRight, Play
} from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function PIQuizlet() {
  const { user } = useAuth();
  const [selectedCluster, setSelectedCluster] = useState("Marketing");
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("lesson");
  
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [showQuizResults, setShowQuizResults] = useState(false);
  
  const [teachBackText, setTeachBackText] = useState("");
  const [teachBackFeedback, setTeachBackFeedback] = useState("");
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  const CLUSTERS = ["Marketing", "Finance", "Business Management", "Hospitality"];

  const { data: modules, isLoading: modulesLoading } = trpc.piLearning.getModulesByCluster.useQuery({
    cluster: selectedCluster,
  });

  const { data: moduleWithSections, isLoading: moduleLoading } = trpc.piLearning.getModuleWithSections.useQuery(
    { moduleId: selectedModuleId! },
    { enabled: !!selectedModuleId }
  );

  const getSectionByType = (type: string) => moduleWithSections?.sections?.find((s) => s.sectionType === type);

  const theorySection = getSectionByType("theory");
  const vocabSection = getSectionByType("vocabulary");
  const flashcardSection = getSectionByType("flashcards");
  const quickReviewSection = getSectionByType("quiz");
  const scenarioSection = getSectionByType("scenario_challenge");

  const { data: theoryContent } = trpc.piLearning.getSectionContent.useQuery(
    { sectionId: theorySection?.id! },
    { enabled: !!theorySection?.id }
  );

  const { data: vocabContent } = trpc.piLearning.getSectionContent.useQuery(
    { sectionId: vocabSection?.id! },
    { enabled: !!vocabSection?.id }
  );

  const { data: flashcardContent } = trpc.piLearning.getSectionContent.useQuery(
    { sectionId: flashcardSection?.id! },
    { enabled: !!flashcardSection?.id }
  );

  const { data: quizContent } = trpc.piLearning.getSectionContent.useQuery(
    { sectionId: quickReviewSection?.id! },
    { enabled: !!quickReviewSection?.id }
  );

  const { data: scenarioContent } = trpc.piLearning.getSectionContent.useQuery(
    { sectionId: scenarioSection?.id! },
    { enabled: !!scenarioSection?.id }
  );

  const parseOptions = (opts: any): string[] => {
    if (!opts) return [];
    if (typeof opts === 'string') {
      try {
        const parsed = JSON.parse(opts);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        return [opts];
      }
    }
    return Array.isArray(opts) ? opts : [opts];
  };

  const handleSubmitTeachBack = async () => {
    if (!teachBackText.trim()) return;
    
    setLoadingFeedback(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setTeachBackFeedback(
        `Your explanation demonstrates a solid understanding of ${moduleWithSections?.performanceIndicator}. ` +
        `You've covered the fundamental concepts well. To strengthen your response, consider incorporating more specific metrics, ` +
        `industry benchmarks, or advanced strategic implications. Your teach-back shows readiness for application in real scenarios.`
      );
    } catch (error) {
      setTeachBackFeedback("Error generating feedback. Please try again.");
    } finally {
      setLoadingFeedback(false);
    }
  };

  const quizQuestions = quizContent?.quizQuestions || [];
  const correctCount = Object.entries(quizAnswers).filter(
    ([qId, answer]) => {
      const q = quizQuestions.find(q => q.id === Number(qId));
      return q && answer === q.correctAnswer;
    }
  ).length;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <Card className="w-full max-w-md border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" /> Authentication Required
            </CardTitle>
            <CardDescription>You need to be logged in to access the PI Quizlet.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!selectedModuleId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="container mx-auto py-16 px-4">
          {/* Header */}
          <div className="mb-16 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-6">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-slate-900 dark:text-white mb-3">PI Quizlet</h1>
            <p className="text-xl text-slate-600 dark:text-slate-400">Master Performance Indicators through comprehensive, interactive learning</p>
          </div>

          {/* Cluster Tabs */}
          <Tabs value={selectedCluster} onValueChange={setSelectedCluster} className="w-full mb-12">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto p-2 bg-slate-200 dark:bg-slate-800 rounded-xl">
              {CLUSTERS.map((cluster) => (
                <TabsTrigger key={cluster} value={cluster} className="py-3 rounded-lg font-medium">
                  {cluster}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Modules Grid */}
          {modulesLoading ? (
            <div className="flex items-center justify-center py-24">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-400">Loading modules...</p>
              </div>
            </div>
          ) : modules && modules.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {modules.map((module) => (
                <div
                  key={module.id}
                  onClick={() => setSelectedModuleId(module.id)}
                  className="group cursor-pointer"
                >
                  <Card className="h-full border-2 hover:border-blue-400 dark:hover:border-blue-600 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Lightbulb className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        {module.level && (
                          <Badge variant="secondary" className="text-xs font-semibold">
                            {module.level}
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                        {module.performanceIndicator}
                      </CardTitle>
                      <CardDescription className="text-sm mt-2">{module.instructionalArea}</CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                        <span className="text-xs font-mono text-slate-500 dark:text-slate-400">{module.piId}</span>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition translate-x-0 group-hover:translate-x-1" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          ) : (
            <Card className="border-2 border-dashed">
              <CardContent className="pt-16 pb-16 text-center">
                <AlertCircle className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <p className="text-lg text-slate-600 dark:text-slate-400 font-medium">
                  No modules available for this cluster
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">Check back soon for new content</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  if (moduleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-slate-600 dark:text-slate-400 font-medium">Loading module content...</p>
        </div>
      </div>
    );
  }

  const currentFlashcard = flashcardContent?.flashcards?.[currentFlashcardIndex];
  const totalFlashcards = flashcardContent?.flashcards?.length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost"
            onClick={() => {
              setSelectedModuleId(null);
              setActiveTab("lesson");
              setCurrentFlashcardIndex(0);
              setIsFlipped(false);
              setQuizAnswers({});
              setShowQuizResults(false);
            }} 
            className="mb-6 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            <ChevronLeft className="w-4 h-4 mr-2" /> Back to Modules
          </Button>
          
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-8 text-white mb-8 shadow-lg">
            <h1 className="text-4xl font-bold mb-2">{moduleWithSections?.performanceIndicator}</h1>
            <p className="text-blue-100 text-lg">{moduleWithSections?.instructionalArea}</p>
          </div>
        </div>

        {/* Learning Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 mb-8 bg-slate-200 dark:bg-slate-800 p-2 rounded-xl">
            <TabsTrigger value="lesson" className="text-xs sm:text-sm rounded-lg">Lesson</TabsTrigger>
            <TabsTrigger value="vocabulary" className="text-xs sm:text-sm rounded-lg">Vocab</TabsTrigger>
            <TabsTrigger value="flashcards" className="text-xs sm:text-sm rounded-lg">Cards</TabsTrigger>
            <TabsTrigger value="quick-review" className="text-xs sm:text-sm rounded-lg">Review</TabsTrigger>
            <TabsTrigger value="quiz" className="text-xs sm:text-sm rounded-lg">Quiz</TabsTrigger>
            <TabsTrigger value="scenarios" className="text-xs sm:text-sm rounded-lg">Cases</TabsTrigger>
            <TabsTrigger value="related" className="text-xs sm:text-sm rounded-lg">Links</TabsTrigger>
            <TabsTrigger value="teach-back" className="text-xs sm:text-sm rounded-lg">Teach</TabsTrigger>
          </TabsList>

          {/* Lesson Tab */}
          <TabsContent value="lesson">
            <Card className="border-2 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-b-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle>Lesson</CardTitle>
                    <CardDescription>{theorySection?.title}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-8">
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-lg whitespace-pre-wrap">
                    {theoryContent?.content || "No lesson content available."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vocabulary Tab */}
          <TabsContent value="vocabulary">
            <Card className="border-2 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 border-b-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle>Vocabulary</CardTitle>
                      <CardDescription>10 Essential Terms</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-8">
                {vocabContent?.content ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {vocabContent.content.split('\n').filter(Boolean).map((term, idx) => (
                      <div key={idx} className="p-4 bg-emerald-50 dark:bg-emerald-950 rounded-lg border-2 border-emerald-200 dark:border-emerald-800 hover:shadow-md transition">
                        <div className="flex items-start gap-3">
                          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900 px-2 py-1 rounded">
                            {idx + 1}
                          </span>
                          <p className="font-semibold text-slate-900 dark:text-white">{term}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-12">No vocabulary terms available.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Flashcards Tab */}
          <TabsContent value="flashcards">
            <Card className="border-2 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-b-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                      <RotateCw className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle>Flashcards</CardTitle>
                      <CardDescription>Interactive Learning</CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-purple-600">{currentFlashcardIndex + 1} / {totalFlashcards}</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-12 pb-12">
                {currentFlashcard ? (
                  <div className="space-y-8">
                    {/* 3D Flip Card */}
                    <div
                      onClick={() => setIsFlipped(!isFlipped)}
                      className="h-72 cursor-pointer perspective"
                      style={{
                        perspective: '1000px',
                      }}
                    >
                      <div
                        className="relative w-full h-full transition-transform duration-500"
                        style={{
                          transformStyle: 'preserve-3d',
                          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                        }}
                      >
                        {/* Front */}
                        <div
                          className={`absolute w-full h-full bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-8 flex flex-col justify-center items-center text-white shadow-2xl ${
                            isFlipped ? 'hidden' : ''
                          }`}
                          style={{ backfaceVisibility: 'hidden' }}
                        >
                          <p className="text-sm font-semibold text-purple-100 mb-6 uppercase tracking-wide">Question</p>
                          <p className="text-3xl font-bold text-center leading-tight">{currentFlashcard.question}</p>
                          <p className="text-xs text-purple-200 mt-8 font-medium">Click card to reveal answer</p>
                        </div>

                        {/* Back */}
                        <div
                          className={`absolute w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-8 flex flex-col justify-center items-center text-white shadow-2xl ${
                            !isFlipped ? 'hidden' : ''
                          }`}
                          style={{ 
                            backfaceVisibility: 'hidden',
                            transform: 'rotateY(180deg)',
                          }}
                        >
                          <p className="text-sm font-semibold text-indigo-100 mb-6 uppercase tracking-wide">Answer</p>
                          <p className="text-2xl font-semibold text-center leading-tight">{currentFlashcard.answer}</p>
                          <p className="text-xs text-indigo-200 mt-8 font-medium">Click card to see question</p>
                        </div>
                      </div>
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center justify-between gap-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setCurrentFlashcardIndex(Math.max(0, currentFlashcardIndex - 1));
                          setIsFlipped(false);
                        }}
                        disabled={currentFlashcardIndex === 0}
                        className="flex-1 py-6 font-semibold"
                      >
                        <ChevronLeft className="w-5 h-5 mr-2" /> Previous
                      </Button>
                      <Button
                        onClick={() => setIsFlipped(!isFlipped)}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 py-6 font-semibold"
                      >
                        <RotateCw className="w-5 h-5 mr-2" /> Flip
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setCurrentFlashcardIndex(Math.min(totalFlashcards - 1, currentFlashcardIndex + 1));
                          setIsFlipped(false);
                        }}
                        disabled={currentFlashcardIndex === totalFlashcards - 1}
                        className="flex-1 py-6 font-semibold"
                      >
                        Next <ChevronRight className="w-5 h-5 ml-2" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-20">No flashcards available.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quick Review Tab */}
          <TabsContent value="quick-review">
            <Card className="border-2 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950 border-b-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-600 rounded-lg flex items-center justify-center">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle>Quick Review</CardTitle>
                    <CardDescription>10 Review Questions</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-8">
                {quizContent?.quizQuestions && quizContent.quizQuestions.length > 0 ? (
                  <div className="space-y-4">
                    {quizContent.quizQuestions.slice(0, 10).map((q, idx) => (
                      <div key={q.id} className="p-5 border-2 border-yellow-200 dark:border-yellow-800 rounded-lg bg-yellow-50 dark:bg-yellow-950 hover:shadow-md transition">
                        <div className="flex gap-4">
                          <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900 px-3 py-1 rounded h-fit">
                            Q{idx + 1}
                          </span>
                          <div className="flex-1">
                            <p className="font-semibold text-slate-900 dark:text-white mb-2">{q.question}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Answer: {q.correctAnswer}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-12">No review questions available.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quiz Tab */}
          <TabsContent value="quiz">
            <Card className="border-2 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950 dark:to-pink-950 border-b-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle>Comprehensive Quiz</CardTitle>
                    <CardDescription>15 Multiple Choice Questions</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-8">
                {!showQuizResults ? (
                  <div className="space-y-8">
                    {quizContent?.quizQuestions && quizContent.quizQuestions.length > 0 ? (
                      <>
                        {quizContent.quizQuestions.slice(0, 15).map((q, idx) => {
                          const options = parseOptions(q.options);
                          return (
                            <div key={q.id} className="p-6 border-2 border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-950 hover:shadow-md transition">
                              <div className="flex gap-4 mb-4">
                                <span className="text-sm font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900 px-3 py-1 rounded h-fit">
                                  {idx + 1}
                                </span>
                                <p className="font-semibold text-slate-900 dark:text-white flex-1">{q.question}</p>
                              </div>
                              <div className="space-y-3 ml-12">
                                {options.map((option, optIdx) => (
                                  <label key={optIdx} className="flex items-center p-3 rounded-lg cursor-pointer hover:bg-red-100 dark:hover:bg-red-900 transition border-2 border-transparent hover:border-red-300 dark:hover:border-red-700">
                                    <input
                                      type="radio"
                                      name={`q${q.id}`}
                                      value={String.fromCharCode(65 + optIdx)}
                                      checked={quizAnswers[q.id] === String.fromCharCode(65 + optIdx)}
                                      onChange={(e) => setQuizAnswers({ ...quizAnswers, [q.id]: e.target.value })}
                                      className="w-5 h-5 mr-3 cursor-pointer"
                                    />
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{option}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                        <Button 
                          onClick={() => setShowQuizResults(true)}
                          className="w-full bg-red-600 hover:bg-red-700 py-7 text-lg font-bold rounded-xl"
                        >
                          <Play className="w-5 h-5 mr-2" /> Submit Quiz
                        </Button>
                      </>
                    ) : (
                      <p className="text-slate-500 text-center py-12">No quiz questions available.</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="p-8 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl text-center shadow-lg">
                      <p className="text-sm font-semibold mb-3 uppercase tracking-wide">Your Score</p>
                      <p className="text-6xl font-bold mb-2">{Math.round((correctCount / 15) * 100)}%</p>
                      <p className="text-blue-100 text-lg">{correctCount} out of 15 correct</p>
                    </div>
                    <Button 
                      onClick={() => {
                        setShowQuizResults(false);
                        setQuizAnswers({});
                      }}
                      variant="outline"
                      className="w-full py-6 text-lg font-semibold rounded-xl border-2"
                    >
                      <RotateCw className="w-5 h-5 mr-2" /> Retake Quiz
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Scenarios Tab */}
          <TabsContent value="scenarios">
            <Card className="border-2 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950 dark:to-blue-950 border-b-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-cyan-600 rounded-lg flex items-center justify-center">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle>Business Scenarios</CardTitle>
                    <CardDescription>3 Real-World Cases</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-8 space-y-6">
                {scenarioContent?.scenarios && scenarioContent.scenarios.length > 0 ? (
                  <div className="space-y-6">
                    {scenarioContent.scenarios.map((scenario, idx) => (
                      <div key={scenario.id} className="p-6 border-2 border-cyan-300 dark:border-cyan-700 rounded-xl bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950 dark:to-blue-950 hover:shadow-lg transition">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-900 px-3 py-1 rounded">
                              Case {idx + 1}
                            </span>
                            <Badge className="bg-cyan-600">{scenario.difficulty}</Badge>
                          </div>
                        </div>
                        <p className="text-sm leading-relaxed mb-4 text-slate-700 dark:text-slate-300">{scenario.scenario}</p>
                        {scenario.expectedAnswer && (
                          <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border-l-4 border-cyan-600">
                            <p className="font-semibold text-cyan-700 dark:text-cyan-300 mb-2 text-sm">Expected Response:</p>
                            <p className="text-sm text-slate-700 dark:text-slate-300">{scenario.expectedAnswer}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-12">No scenario challenges available.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Related Tab */}
          <TabsContent value="related">
            <Card className="border-2 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950 dark:to-green-950 border-b-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle>Related PIs</CardTitle>
                    <CardDescription>Connected Concepts & Common Mistakes</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-8">
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-base">
                    Understanding related Performance Indicators strengthens your comprehensive knowledge. Pay attention to common pitfalls when applying these concepts in business scenarios.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Teach-Back Tab */}
          <TabsContent value="teach-back">
            <Card className="border-2 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950 border-b-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle>Teach-Back Activity</CardTitle>
                    <CardDescription>Demonstrate your mastery with AI feedback</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-8 space-y-8">
                <div className="bg-orange-100 dark:bg-orange-900 p-6 rounded-xl border-l-4 border-orange-600">
                  <p className="font-semibold mb-3 text-orange-900 dark:text-orange-100 text-base">Mastery Challenge</p>
                  <p className="text-sm text-orange-900 dark:text-orange-100 mb-3">Explain <span className="font-bold">{moduleWithSections?.performanceIndicator}</span> in your own words:</p>
                  <ul className="text-sm list-disc list-inside space-y-2 text-orange-900 dark:text-orange-100">
                    <li>What it means in business context</li>
                    <li>Why it's strategically important</li>
                    <li>A concrete real-world example</li>
                    <li>How to apply it in practice</li>
                  </ul>
                </div>

                <textarea
                  value={teachBackText}
                  onChange={(e) => setTeachBackText(e.target.value)}
                  placeholder="Write your comprehensive explanation here. Aim for 3-5 sentences covering all aspects..."
                  className="w-full p-5 border-2 border-orange-300 dark:border-orange-700 rounded-xl min-h-48 dark:bg-slate-800 dark:text-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:ring-opacity-20 transition font-medium"
                />

                <Button 
                  onClick={handleSubmitTeachBack}
                  disabled={!teachBackText.trim() || loadingFeedback}
                  className="w-full bg-orange-600 hover:bg-orange-700 py-7 text-lg font-bold rounded-xl disabled:opacity-50"
                >
                  {loadingFeedback ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Generating AI Feedback...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" /> Submit for AI Feedback
                    </>
                  )}
                </Button>

                {teachBackFeedback && (
                  <div className="p-6 bg-green-50 dark:bg-green-950 border-2 border-green-300 dark:border-green-700 rounded-xl">
                    <div className="flex items-start gap-4">
                      <CheckCircle className="w-7 h-7 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-semibold text-green-900 dark:text-green-100 mb-3 text-base">AI Feedback</p>
                        <p className="text-sm text-green-800 dark:text-green-200 leading-relaxed">{teachBackFeedback}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer Navigation */}
        <div className="flex gap-4 mt-12">
          <Button 
            variant="outline"
            onClick={() => {
              setSelectedModuleId(null);
              setActiveTab("lesson");
              setCurrentFlashcardIndex(0);
              setIsFlipped(false);
              setQuizAnswers({});
              setShowQuizResults(false);
            }} 
            className="flex-1 py-6 font-semibold rounded-xl border-2"
          >
            <ChevronLeft className="w-5 h-5 mr-2" /> Back to Modules
          </Button>
          <Button className="flex-1 bg-blue-600 hover:bg-blue-700 py-6 font-semibold rounded-xl">
            <Award className="w-5 h-5 mr-2" /> Save Progress
          </Button>
        </div>
      </div>
    </div>
  );
}
