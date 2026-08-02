import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, BookOpen, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function PIQuizlet() {
  const { user } = useAuth();
  const [selectedCluster, setSelectedCluster] = useState("Marketing");
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("lesson");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);

  const CLUSTERS = ["Marketing", "Finance", "Business Management", "Hospitality"];

  const { data: modules, isLoading: modulesLoading } = trpc.piLearning.getModulesByCluster.useQuery({
    cluster: selectedCluster,
  });

  // Fetch module with all sections
  const { data: moduleWithSections, isLoading: moduleLoading } = trpc.piLearning.getModuleWithSections.useQuery(
    { moduleId: selectedModuleId! },
    { enabled: !!selectedModuleId }
  );

  // Fetch content for each section type
  const getSectionByType = (type: string) => moduleWithSections?.sections?.find((s) => s.sectionType === type);

  const theorySection = getSectionByType("theory");
  const vocabSection = getSectionByType("vocabulary");
  const flashcardSection = getSectionByType("flashcards");
  const quickReviewSection = getSectionByType("quiz");
  const comprehensiveSection = moduleWithSections?.sections?.find((s) => s.sectionType === "quiz" && s.order === 5);
  const scenarioSection = getSectionByType("scenario_challenge");
  const relatedPIsSection = moduleWithSections?.sections?.find((s) => s.sectionType === "theory" && s.order === 7);
  const teachBackSection = getSectionByType("ai_coach_feedback");

  // Fetch content for sections
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

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
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
        <div className="container mx-auto py-8 px-4">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-8 h-8 text-blue-600" />
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white">PI Quizlet</h1>
            </div>
            <p className="text-slate-600 dark:text-slate-400">Master Performance Indicators with comprehensive learning modules</p>
          </div>

          <Tabs value={selectedCluster} onValueChange={setSelectedCluster} className="w-full mb-8">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
              {CLUSTERS.map((cluster) => (
                <TabsTrigger key={cluster} value={cluster} className="text-xs sm:text-sm">
                  {cluster.split(" ")[0]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {modulesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : modules && modules.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {modules.map((module) => (
                <Card key={module.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-base line-clamp-2">{module.performanceIndicator}</CardTitle>
                        <CardDescription className="text-xs mt-1">{module.instructionalArea}</CardDescription>
                      </div>
                      {module.level && (
                        <Badge variant="outline" className="text-xs whitespace-nowrap">
                          {module.level}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="text-xs text-slate-500">
                      <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                        {module.piId}
                      </span>
                    </div>

                    <Button onClick={() => setSelectedModuleId(module.id)} className="w-full mt-2">
                      Start Learning
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-slate-600 dark:text-slate-400">
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
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <Button variant="outline" onClick={() => setSelectedModuleId(null)} className="mb-4">
            ← Back to Modules
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                {moduleWithSections?.performanceIndicator}
              </h1>
              <p className="text-slate-600 dark:text-slate-400">{moduleWithSections?.instructionalArea}</p>
            </div>
          </div>
        </div>

        {/* Learning Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 mb-6">
            <TabsTrigger value="lesson" className="text-xs">Lesson</TabsTrigger>
            <TabsTrigger value="vocabulary" className="text-xs">Vocab</TabsTrigger>
            <TabsTrigger value="flashcards" className="text-xs">Flash</TabsTrigger>
            <TabsTrigger value="quick-review" className="text-xs">Quick</TabsTrigger>
            <TabsTrigger value="quiz" className="text-xs">Quiz</TabsTrigger>
            <TabsTrigger value="scenarios" className="text-xs">Scenario</TabsTrigger>
            <TabsTrigger value="related" className="text-xs">Related</TabsTrigger>
            <TabsTrigger value="teach-back" className="text-xs">Teach</TabsTrigger>
          </TabsList>

          {/* Lesson Tab */}
          <TabsContent value="lesson">
            <Card>
              <CardHeader>
                <CardTitle>Lesson: {theorySection?.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                    {theoryContent?.content || "No lesson content available."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vocabulary Tab */}
          <TabsContent value="vocabulary">
            <Card>
              <CardHeader>
                <CardTitle>Vocabulary Terms</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {vocabContent?.content ? (
                    <div className="prose dark:prose-invert max-w-none">
                      <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                        {vocabContent.content}
                      </p>
                    </div>
                  ) : (
                    <p className="text-slate-500">No vocabulary terms available.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Flashcards Tab */}
          <TabsContent value="flashcards">
            <Card>
              <CardHeader>
                <CardTitle>Flashcards ({flashcardContent?.flashcards?.length || 0})</CardTitle>
              </CardHeader>
              <CardContent>
                {flashcardContent?.flashcards && flashcardContent.flashcards.length > 0 ? (
                  <div className="space-y-4">
                    {flashcardContent.flashcards.map((card, idx) => (
                      <div key={card.id} className="p-4 border rounded-lg hover:shadow-md transition">
                        <p className="font-semibold mb-2">{idx + 1}. {card.question}</p>
                        <p className="text-slate-600 dark:text-slate-400">{card.answer}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500">No flashcards available.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quick Review Tab */}
          <TabsContent value="quick-review">
            <Card>
              <CardHeader>
                <CardTitle>Quick Review Questions ({quizContent?.quizQuestions?.length || 0})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {quizContent?.quizQuestions && quizContent.quizQuestions.length > 0 ? (
                  <div className="space-y-4">
                    {quizContent.quizQuestions.map((q, idx) => (
                      <div key={q.id} className="p-4 border rounded-lg">
                        <p className="font-semibold mb-2">{idx + 1}. {q.question}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Answer: {q.correctAnswer}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500">No quick review questions available.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Comprehensive Quiz Tab */}
          <TabsContent value="quiz">
            <Card>
              <CardHeader>
                <CardTitle>Comprehensive Quiz (15 Questions)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {quizContent?.quizQuestions && quizContent.quizQuestions.length > 0 ? (
                  <div className="space-y-4">
                    {quizContent.quizQuestions.map((q, idx) => {
                      const options = parseOptions(q.options);
                      return (
                        <div key={q.id} className="p-4 border rounded-lg">
                          <p className="font-semibold mb-3">{idx + 1}. {q.question}</p>
                          <div className="space-y-2">
                            {options.map((option, optIdx) => (
                              <div key={optIdx} className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id={`q${q.id}opt${optIdx}`}
                                  name={`q${q.id}`}
                                  value={String.fromCharCode(65 + optIdx)}
                                  className="w-4 h-4"
                                />
                                <label htmlFor={`q${q.id}opt${optIdx}`} className="text-sm cursor-pointer">
                                  {option}
                                </label>
                              </div>
                            ))}
                          </div>
                          {q.rationale && (
                            <p className="text-xs text-slate-500 mt-2 italic">Explanation: {q.rationale}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-slate-500">No quiz questions available.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Scenarios Tab */}
          <TabsContent value="scenarios">
            <Card>
              <CardHeader>
                <CardTitle>Business Scenario Challenges ({scenarioContent?.scenarios?.length || 0})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {scenarioContent?.scenarios && scenarioContent.scenarios.length > 0 ? (
                  <div className="space-y-6">
                    {scenarioContent.scenarios.map((scenario, idx) => (
                      <div key={scenario.id} className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950">
                        <div className="flex items-center justify-between mb-3">
                          <p className="font-semibold">Scenario {idx + 1}</p>
                          <Badge>{scenario.difficulty}</Badge>
                        </div>
                        <p className="text-sm mb-3">{scenario.scenario}</p>
                        {scenario.expectedAnswer && (
                          <div className="bg-white dark:bg-slate-900 p-3 rounded text-sm">
                            <p className="font-semibold text-green-600 dark:text-green-400 mb-1">Expected Response:</p>
                            <p>{scenario.expectedAnswer}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500">No scenario challenges available.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Related PIs Tab */}
          <TabsContent value="related">
            <Card>
              <CardHeader>
                <CardTitle>Related PIs & Common Mistakes</CardTitle>
              </CardHeader>
              <CardContent>
                {relatedPIsSection?.content ? (
                  <div className="prose dark:prose-invert max-w-none">
                    <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                      {relatedPIsSection.content}
                    </p>
                  </div>
                ) : (
                  <p className="text-slate-500">No related information available.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Teach-Back Tab */}
          <TabsContent value="teach-back">
            <Card>
              <CardHeader>
                <CardTitle>Teach-Back Activity</CardTitle>
                <CardDescription>Demonstrate your mastery by explaining this concept</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                  <p className="text-sm font-semibold mb-2">Mastery Challenge:</p>
                  <p className="text-sm">Explain {moduleWithSections?.performanceIndicator} in your own words, including:</p>
                  <ul className="text-sm list-disc list-inside mt-2 space-y-1">
                    <li>What it means in business</li>
                    <li>Why it's important</li>
                    <li>A real-world example</li>
                    <li>How to apply it</li>
                  </ul>
                </div>
                <textarea
                  placeholder="Write your explanation here..."
                  className="w-full p-3 border rounded-lg min-h-32 dark:bg-slate-800 dark:border-slate-700"
                />
                <Button className="w-full">Submit for AI Feedback</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          <Button variant="outline" onClick={() => setSelectedModuleId(null)} className="flex-1">
            Back to Modules
          </Button>
          <Button className="flex-1">Save Progress</Button>
        </div>
      </div>
    </div>
  );
}
