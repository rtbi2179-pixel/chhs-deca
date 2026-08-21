import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import PIFlashcardViewer from "./PIFlashcardViewer";
import PIQuizViewer from "./PIQuizViewer";
import PIScenarioChallengeViewer from "./PIScenarioChallengeViewer";

interface PIModuleViewerProps {
  moduleId: number;
}

const RETAINED_SECTION_TYPES = new Set(["theory", "flashcards", "quiz", "scenario_challenge"]);

export default function PIModuleViewer({ moduleId }: PIModuleViewerProps) {
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("content");

  const { data: module, isLoading: moduleLoading } = trpc.piLearning.getModuleWithSections.useQuery({
    moduleId,
  });

  const { data: sectionContent, isLoading: contentLoading } = trpc.piLearning.getSectionContent.useQuery(
    { sectionId: selectedSectionId! },
    { enabled: !!selectedSectionId }
  );

  const { data: progress } = trpc.piLearning.getUserModuleProgress.useQuery({ moduleId });

  const updateSectionProgress = trpc.piLearning.updateSectionProgress.useMutation();

  if (moduleLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!module) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-slate-600 dark:text-slate-400">Module not found</p>
        </CardContent>
      </Card>
    );
  }

  const sections = (module.sections || []).filter((section) => RETAINED_SECTION_TYPES.has(section.sectionType));
  const currentSection = sections.find((s) => s.id === selectedSectionId);

  const getSectionIcon = (type: string) => {
    const icons: Record<string, string> = {
      theory: "📚",
      flashcards: "🎴",
      quiz: "❓",
      scenario_challenge: "🎯",
    };
    return icons[type] || "📌";
  };

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">{module.performanceIndicator}</CardTitle>
              <CardDescription className="text-base mb-3">{module.instructionalArea}</CardDescription>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge>{module.cluster}</Badge>
                {module.level && <Badge variant="outline">{module.level}</Badge>}
                <Badge variant="secondary">PI: {module.piId}</Badge>
              </div>
            </div>
            {progress && (
              <div className="text-right">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Mastery</p>
                <p className="text-3xl font-bold text-blue-600">{progress.masteryScore}%</p>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Section Navigation Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Sections ({sections.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sections.map((section, index) => (
                  <button
                    key={section.id}
                    onClick={() => setSelectedSectionId(section.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedSectionId === section.id
                        ? "bg-blue-100 dark:bg-blue-900 border border-blue-500"
                        : "bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getSectionIcon(section.sectionType)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
                          {section.sectionType.replace(/_/g, " ")}
                        </p>
                        <p className="text-sm font-semibold truncate">{section.title}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section Content Area */}
        <div className="lg:col-span-3">
          {selectedSectionId && currentSection ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="content" className="text-xs sm:text-sm">
                  Content
                </TabsTrigger>
                <TabsTrigger value="flashcards" disabled={!sectionContent?.flashcards?.length}>
                  Cards
                </TabsTrigger>
                <TabsTrigger value="quiz" disabled={!sectionContent?.quizQuestions?.length}>
                  Quiz
                </TabsTrigger>
                <TabsTrigger value="scenarios" disabled={!sectionContent?.scenarios?.length}>
                  Scenarios
                </TabsTrigger>
              </TabsList>

              {/* Content Tab */}
              <TabsContent value="content" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{currentSection.title}</CardTitle>
                    <CardDescription>{currentSection.sectionType.replace(/_/g, " ")}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {sectionContent?.content ? (
                      <div className="prose dark:prose-invert max-w-none">
                        <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                          {sectionContent.content}
                        </p>
                      </div>
                    ) : (
                      <p className="text-slate-600 dark:text-slate-400 italic">
                        No content available for this section yet.
                      </p>
                    )}

                    <Button
                      onClick={() => {
                        updateSectionProgress.mutate({
                          sectionId: currentSection.id,
                          isCompleted: true,
                          score: 100,
                        });
                      }}
                      disabled={updateSectionProgress.isPending}
                      className="mt-4"
                    >
                      {updateSectionProgress.isPending ? "Saving..." : "Mark as Complete"}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Flashcards Tab */}
              <TabsContent value="flashcards">
                {contentLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  </div>
                ) : sectionContent?.flashcards && sectionContent.flashcards.length > 0 ? (
                  <PIFlashcardViewer
                    flashcards={sectionContent.flashcards.map((card) => ({
                      ...card,
                      type: "multiple_choice" as const,
                      options: typeof card.options === "string" ? card.options : JSON.stringify(card.options ?? []),
                      correctAnswer: card.correctAnswer ?? "",
                    }))}
                    sectionId={currentSection.id}
                  />
                ) : (
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-center text-slate-600 dark:text-slate-400">
                        No flashcards available for this section.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Quiz Tab */}
              <TabsContent value="quiz">
                {contentLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  </div>
                ) : sectionContent?.quizQuestions && sectionContent.quizQuestions.length > 0 ? (
                  <PIQuizViewer
                    questions={sectionContent.quizQuestions.map((question) => ({
                      ...question,
                      options: typeof question.options === "string" ? question.options : JSON.stringify(question.options ?? []),
                      rationale: question.rationale ?? question.explanation ?? "",
                    }))}
                    sectionId={currentSection.id}
                  />
                ) : (
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-center text-slate-600 dark:text-slate-400">
                        No quiz questions available for this section.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Scenarios Tab */}
              <TabsContent value="scenarios">
                {contentLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  </div>
                ) : sectionContent?.scenarios && sectionContent.scenarios.length > 0 ? (
                  <PIScenarioChallengeViewer
                    scenarios={sectionContent.scenarios.map((scenario) => ({
                      id: scenario.id,
                      title: "Business Scenario",
                      scenarioText: scenario.scenario,
                      difficulty: scenario.difficulty,
                      expectedResponse: scenario.expectedAnswer ?? "",
                    }))}
                    sectionId={currentSection.id}
                  />
                ) : (
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-center text-slate-600 dark:text-slate-400">
                        No scenario challenges available for this section.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-slate-600 dark:text-slate-400">
                  Select a section from the left to begin studying.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
