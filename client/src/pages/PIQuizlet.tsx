import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, BookOpen, Loader2, RotateCw, Send, CheckCircle, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function PIQuizlet() {
  const { user } = useAuth();
  const [selectedCluster, setSelectedCluster] = useState("Marketing");
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("lesson");
  
  // Flashcard state
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [showQuizResults, setShowQuizResults] = useState(false);
  
  // Teach-back state
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
      // Simulate AI feedback - in production, call your LLM API
      await new Promise(resolve => setTimeout(resolve, 1500));
      setTeachBackFeedback(
        `Great effort! Your explanation covers the key aspects of ${moduleWithSections?.performanceIndicator}. ` +
        `To improve, consider adding more specific business examples and explaining the strategic implications.`
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
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Please Log In</CardTitle>
            <CardDescription>You need to be logged in to access the PI Quizlet.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!selectedModuleId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="container mx-auto py-12 px-4">
          <div className="mb-12 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <BookOpen className="w-10 h-10 text-blue-600" />
              <h1 className="text-5xl font-bold text-slate-900 dark:text-white">PI Quizlet</h1>
            </div>
            <p className="text-lg text-slate-600 dark:text-slate-400">Master Performance Indicators with comprehensive learning modules</p>
          </div>

          <Tabs value={selectedCluster} onValueChange={setSelectedCluster} className="w-full mb-8">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto p-1">
              {CLUSTERS.map((cluster) => (
                <TabsTrigger key={cluster} value={cluster} className="text-sm py-2">
                  {cluster}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {modulesLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            </div>
          ) : modules && modules.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {modules.map((module) => (
                <Card key={module.id} className="hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden group">
                  <CardHeader className="pb-3 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-2 group-hover:text-blue-600 transition">
                          {module.performanceIndicator}
                        </CardTitle>
                        <CardDescription className="text-sm mt-2">{module.instructionalArea}</CardDescription>
                      </div>
                      {module.level && (
                        <Badge variant="secondary" className="whitespace-nowrap">
                          {module.level}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 pt-4">
                    <div className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg w-fit">
                      {module.piId}
                    </div>

                    <Button 
                      onClick={() => setSelectedModuleId(module.id)} 
                      className="w-full bg-blue-600 hover:bg-blue-700 transition-colors"
                    >
                      Start Learning
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="pt-12 pb-12 text-center">
                <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-lg text-slate-600 dark:text-slate-400">
                  No modules available for this cluster yet.
                </p>
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
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Loading module...</p>
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
            variant="outline" 
            onClick={() => {
              setSelectedModuleId(null);
              setActiveTab("lesson");
              setCurrentFlashcardIndex(0);
              setIsFlipped(false);
              setQuizAnswers({});
              setShowQuizResults(false);
            }} 
            className="mb-6 hover:bg-slate-200 dark:hover:bg-slate-800"
          >
            ← Back to Modules
          </Button>
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white mb-6">
            <h1 className="text-3xl font-bold mb-2">{moduleWithSections?.performanceIndicator}</h1>
            <p className="text-blue-100">{moduleWithSections?.instructionalArea}</p>
          </div>
        </div>

        {/* Learning Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 mb-8 bg-slate-200 dark:bg-slate-800 p-1">
            <TabsTrigger value="lesson" className="text-xs sm:text-sm">📖 Lesson</TabsTrigger>
            <TabsTrigger value="vocabulary" className="text-xs sm:text-sm">📚 Vocab</TabsTrigger>
            <TabsTrigger value="flashcards" className="text-xs sm:text-sm">🎴 Flash</TabsTrigger>
            <TabsTrigger value="quick-review" className="text-xs sm:text-sm">✓ Quick</TabsTrigger>
            <TabsTrigger value="quiz" className="text-xs sm:text-sm">❓ Quiz</TabsTrigger>
            <TabsTrigger value="scenarios" className="text-xs sm:text-sm">🎯 Scenario</TabsTrigger>
            <TabsTrigger value="related" className="text-xs sm:text-sm">🔗 Related</TabsTrigger>
            <TabsTrigger value="teach-back" className="text-xs sm:text-sm">🎓 Teach</TabsTrigger>
          </TabsList>

          {/* Lesson Tab */}
          <TabsContent value="lesson">
            <Card className="border-2 border-blue-200 dark:border-blue-800">
              <CardHeader className="bg-blue-50 dark:bg-blue-950">
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">📖</span> Lesson: {theorySection?.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-lg">
                    {theoryContent?.content || "No lesson content available."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vocabulary Tab */}
          <TabsContent value="vocabulary">
            <Card className="border-2 border-green-200 dark:border-green-800">
              <CardHeader className="bg-green-50 dark:bg-green-950">
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">📚</span> Vocabulary Terms (10)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {vocabContent?.content ? (
                  <div className="space-y-3">
                    {vocabContent.content.split('\n').filter(Boolean).map((term, idx) => (
                      <div key={idx} className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800 hover:shadow-md transition">
                        <p className="font-semibold text-green-900 dark:text-green-100">{term}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500">No vocabulary terms available.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Flashcards Tab */}
          <TabsContent value="flashcards">
            <Card className="border-2 border-purple-200 dark:border-purple-800">
              <CardHeader className="bg-purple-50 dark:bg-purple-950">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="text-2xl">🎴</span> Flashcards
                  </span>
                  <Badge variant="secondary">{currentFlashcardIndex + 1} / {totalFlashcards}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-8 pb-8">
                {currentFlashcard ? (
                  <div className="space-y-6">
                    {/* Flip Card */}
                    <div
                      onClick={() => setIsFlipped(!isFlipped)}
                      className="h-64 cursor-pointer perspective"
                    >
                      <div
                        className={`relative w-full h-full transition-transform duration-500 transform ${
                          isFlipped ? 'scale-x-[-1]' : ''
                        }`}
                        style={{
                          transformStyle: 'preserve-3d',
                          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                        }}
                      >
                        {/* Front */}
                        <div
                          className={`absolute w-full h-full bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-8 flex flex-col justify-center items-center text-white shadow-xl ${
                            isFlipped ? 'hidden' : ''
                          }`}
                        >
                          <p className="text-sm text-purple-100 mb-4">Question</p>
                          <p className="text-2xl font-bold text-center">{currentFlashcard.question}</p>
                          <p className="text-xs text-purple-200 mt-6">Click to reveal answer</p>
                        </div>

                        {/* Back */}
                        <div
                          className={`absolute w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-8 flex flex-col justify-center items-center text-white shadow-xl ${
                            !isFlipped ? 'hidden' : ''
                          }`}
                        >
                          <p className="text-sm text-indigo-100 mb-4">Answer</p>
                          <p className="text-xl font-semibold text-center">{currentFlashcard.answer}</p>
                          <p className="text-xs text-indigo-200 mt-6">Click to see question</p>
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
                        className="flex-1"
                      >
                        <ChevronLeft className="w-4 h-4 mr-2" /> Previous
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setIsFlipped(!isFlipped)}
                        className="flex-1"
                      >
                        <RotateCw className="w-4 h-4 mr-2" /> Flip
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setCurrentFlashcardIndex(Math.min(totalFlashcards - 1, currentFlashcardIndex + 1));
                          setIsFlipped(false);
                        }}
                        disabled={currentFlashcardIndex === totalFlashcards - 1}
                        className="flex-1"
                      >
                        Next <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-12">No flashcards available.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quick Review Tab */}
          <TabsContent value="quick-review">
            <Card className="border-2 border-yellow-200 dark:border-yellow-800">
              <CardHeader className="bg-yellow-50 dark:bg-yellow-950">
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">✓</span> Quick Review (10 Questions)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {quizContent?.quizQuestions && quizContent.quizQuestions.length > 0 ? (
                  <div className="space-y-4">
                    {quizContent.quizQuestions.slice(0, 10).map((q, idx) => (
                      <div key={q.id} className="p-4 border-2 border-yellow-200 dark:border-yellow-800 rounded-lg hover:shadow-md transition bg-yellow-50 dark:bg-yellow-950">
                        <p className="font-semibold mb-2 text-slate-900 dark:text-white">{idx + 1}. {q.question}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">✓ {q.correctAnswer}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-8">No quick review questions available.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Comprehensive Quiz Tab */}
          <TabsContent value="quiz">
            <Card className="border-2 border-red-200 dark:border-red-800">
              <CardHeader className="bg-red-50 dark:bg-red-950">
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">❓</span> Comprehensive Quiz (15 Questions)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {!showQuizResults ? (
                  <div className="space-y-6">
                    {quizContent?.quizQuestions && quizContent.quizQuestions.length > 0 ? (
                      <>
                        {quizContent.quizQuestions.slice(0, 15).map((q, idx) => {
                          const options = parseOptions(q.options);
                          return (
                            <div key={q.id} className="p-5 border-2 border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-950 hover:shadow-md transition">
                              <p className="font-bold mb-4 text-slate-900 dark:text-white">{idx + 1}. {q.question}</p>
                              <div className="space-y-3 ml-4">
                                {options.map((option, optIdx) => (
                                  <label key={optIdx} className="flex items-center p-3 rounded-lg cursor-pointer hover:bg-red-100 dark:hover:bg-red-900 transition border border-transparent hover:border-red-300">
                                    <input
                                      type="radio"
                                      name={`q${q.id}`}
                                      value={String.fromCharCode(65 + optIdx)}
                                      checked={quizAnswers[q.id] === String.fromCharCode(65 + optIdx)}
                                      onChange={(e) => setQuizAnswers({ ...quizAnswers, [q.id]: e.target.value })}
                                      className="w-4 h-4 mr-3"
                                    />
                                    <span className="text-sm">{option}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                        <Button 
                          onClick={() => setShowQuizResults(true)}
                          className="w-full bg-red-600 hover:bg-red-700 py-6 text-lg"
                        >
                          Submit Quiz
                        </Button>
                      </>
                    ) : (
                      <p className="text-slate-500 text-center py-8">No quiz questions available.</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="p-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-center">
                      <p className="text-sm mb-2">Your Score</p>
                      <p className="text-5xl font-bold">{Math.round((correctCount / 15) * 100)}%</p>
                      <p className="text-sm mt-2">{correctCount} out of 15 correct</p>
                    </div>
                    <Button 
                      onClick={() => {
                        setShowQuizResults(false);
                        setQuizAnswers({});
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      Retake Quiz
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Scenarios Tab */}
          <TabsContent value="scenarios">
            <Card className="border-2 border-cyan-200 dark:border-cyan-800">
              <CardHeader className="bg-cyan-50 dark:bg-cyan-950">
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">🎯</span> Business Scenarios (3 Challenges)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {scenarioContent?.scenarios && scenarioContent.scenarios.length > 0 ? (
                  <div className="space-y-6">
                    {scenarioContent.scenarios.map((scenario, idx) => (
                      <div key={scenario.id} className="p-6 border-2 border-cyan-300 dark:border-cyan-700 rounded-lg bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950 dark:to-blue-950 hover:shadow-lg transition">
                        <div className="flex items-center justify-between mb-4">
                          <p className="font-bold text-lg">Scenario {idx + 1}</p>
                          <Badge className="bg-cyan-600 hover:bg-cyan-700">{scenario.difficulty}</Badge>
                        </div>
                        <p className="text-sm mb-4 leading-relaxed">{scenario.scenario}</p>
                        {scenario.expectedAnswer && (
                          <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border-l-4 border-cyan-600">
                            <p className="font-semibold text-cyan-700 dark:text-cyan-300 mb-2">💡 Expected Response:</p>
                            <p className="text-sm text-slate-700 dark:text-slate-300">{scenario.expectedAnswer}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-8">No scenario challenges available.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Related PIs Tab */}
          <TabsContent value="related">
            <Card className="border-2 border-emerald-200 dark:border-emerald-800">
              <CardHeader className="bg-emerald-50 dark:bg-emerald-950">
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">🔗</span> Related PIs & Common Mistakes
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    Related Performance Indicators and common pitfalls to avoid when applying this concept in business scenarios.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Teach-Back Tab */}
          <TabsContent value="teach-back">
            <Card className="border-2 border-orange-200 dark:border-orange-800">
              <CardHeader className="bg-orange-50 dark:bg-orange-950">
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">🎓</span> Teach-Back Activity
                </CardTitle>
                <CardDescription>Demonstrate your mastery by explaining this concept</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="bg-orange-100 dark:bg-orange-900 p-5 rounded-lg border-l-4 border-orange-600">
                  <p className="font-semibold mb-3 text-orange-900 dark:text-orange-100">📋 Mastery Challenge:</p>
                  <p className="text-sm text-orange-900 dark:text-orange-100 mb-3">Explain <span className="font-bold">{moduleWithSections?.performanceIndicator}</span> in your own words, including:</p>
                  <ul className="text-sm list-disc list-inside space-y-2 text-orange-900 dark:text-orange-100">
                    <li>What it means in business</li>
                    <li>Why it's important</li>
                    <li>A real-world example</li>
                    <li>How to apply it</li>
                  </ul>
                </div>

                <textarea
                  value={teachBackText}
                  onChange={(e) => setTeachBackText(e.target.value)}
                  placeholder="Write your explanation here..."
                  className="w-full p-4 border-2 border-orange-300 dark:border-orange-700 rounded-lg min-h-40 dark:bg-slate-800 dark:text-white focus:outline-none focus:border-orange-500 transition"
                />

                <Button 
                  onClick={handleSubmitTeachBack}
                  disabled={!teachBackText.trim() || loadingFeedback}
                  className="w-full bg-orange-600 hover:bg-orange-700 py-6 text-lg"
                >
                  {loadingFeedback ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating Feedback...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" /> Submit for AI Feedback
                    </>
                  )}
                </Button>

                {teachBackFeedback && (
                  <div className="p-5 bg-green-50 dark:bg-green-950 border-2 border-green-300 dark:border-green-700 rounded-lg">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-green-900 dark:text-green-100 mb-2">AI Feedback:</p>
                        <p className="text-sm text-green-800 dark:text-green-200">{teachBackFeedback}</p>
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
            className="flex-1 py-6"
          >
            ← Back to Modules
          </Button>
          <Button className="flex-1 bg-blue-600 hover:bg-blue-700 py-6">
            💾 Save Progress
          </Button>
        </div>
      </div>
    </div>
  );
}
