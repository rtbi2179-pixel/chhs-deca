import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ChevronLeft, ChevronRight, BookOpen, Loader2, RotateCw, Send, CheckCircle, XCircle,
  Brain, Lightbulb, Zap, Target, MessageSquare, Award, ArrowRight, AlertCircle,
  GraduationCap, ListChecks, FlipHorizontal, ClipboardList, Layers, Link2, Map, SkipBack, SkipForward, Search, X
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { allEvents } from "@/pages/Events";
import { filterPiStudyModules } from "@/lib/piSearch";

const CLUSTERS = [
  "Marketing",
  "Finance",
  "Business Management & Administration",
  "Hospitality & Tourism",
  "Business Administration Core",
  "Entrepreneurship",
  "Personal Financial Literacy",
] as const;

const TABS = [
  { id: "lesson",       label: "Lesson",        icon: BookOpen,      color: "blue" },
  { id: "vocabulary",   label: "Vocabulary",    icon: Zap,           color: "emerald" },
  { id: "flashcards",   label: "Flashcards",    icon: FlipHorizontal,color: "purple" },
  { id: "quick-review", label: "Quick Review",  icon: ListChecks,    color: "amber" },
  { id: "quiz",         label: "Quiz",          icon: ClipboardList, color: "red" },
  { id: "scenarios",    label: "Scenarios",     icon: Layers,        color: "cyan" },
  { id: "related",      label: "Related",       icon: Link2,         color: "green" },
  { id: "teach-back",   label: "Teach-Back",    icon: GraduationCap, color: "orange" },
];

const EVENT_CLUSTER_TO_PI_CLUSTER: Record<string, (typeof CLUSTERS)[number]> = {
  "Business Management": "Business Management & Administration",
  "Personal Finance": "Personal Financial Literacy",
  "Marketing": "Marketing",
  "Finance": "Finance",
  "Hospitality & Tourism": "Hospitality & Tourism",
  "Entrepreneurship": "Entrepreneurship",
};

function getRequestedEventStudyPath() {
  if (typeof window === "undefined") return { eventCode: "", moduleId: null };
  const query = new URLSearchParams(window.location.search);
  const requestedEventCode = query.get("event")?.trim().toUpperCase() ?? "";
  const eventCode = allEvents.some((event) => event.code === requestedEventCode) ? requestedEventCode : "";
  const parsedModuleId = Number(query.get("module"));
  return { eventCode, moduleId: Number.isInteger(parsedModuleId) && parsedModuleId > 0 ? parsedModuleId : null };
}

export default function PIQuizlet() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [selectedCluster, setSelectedCluster] = useState<(typeof CLUSTERS)[number]>(CLUSTERS[0]);
  const [requestedStudyPath] = useState(getRequestedEventStudyPath);
  const [selectedEventCode, setSelectedEventCode] = useState(requestedStudyPath.eventCode);
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(requestedStudyPath.moduleId);
  const [activeTab, setActiveTab] = useState("lesson");
  const [searchQuery, setSearchQuery] = useState("");

  // Flashcard state
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [showQuizResults, setShowQuizResults] = useState(false);

  // Teach-back state
  const [teachBackText, setTeachBackText] = useState("");
  const [teachBackFeedback, setTeachBackFeedback] = useState("");
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  // ── Data fetching ──────────────────────────────────────────────────────────
  const { data: modules, isLoading: modulesLoading } = trpc.piLearning.getModulesByCluster.useQuery(
    { cluster: selectedCluster }
  );
  const primaryEventQuery = trpc.preferences.getPrimaryEvent.useQuery();
  const setPrimaryEvent = trpc.preferences.setPrimaryEvent.useMutation({
    onSuccess: () => primaryEventQuery.refetch(),
  });
  const activeEventCode = selectedEventCode || primaryEventQuery.data?.primaryEventCode || "";
  const selectedEvent = allEvents.find((event) => event.code === activeEventCode);
  const eventStudyQuery = trpc.piLearning.getEventStudyGuide.useQuery(
    { eventCode: activeEventCode || "AAM" },
    { enabled: !!selectedEvent }
  );
  const eventStudyLoading = !!selectedEvent && eventStudyQuery.isLoading;

  const { data: moduleWithSections, isLoading: moduleLoading } = trpc.piLearning.getModuleWithSections.useQuery(
    { moduleId: selectedModuleId! },
    { enabled: !!selectedModuleId }
  );

  const submitTeachBackMutation = trpc.piLearning.submitTeachBack.useMutation();
  const updateSectionProgressMutation = trpc.piLearning.updateSectionProgress.useMutation();
  const { data: moduleProgress } = trpc.piLearning.getUserModuleProgress.useQuery(
    { moduleId: selectedModuleId! },
    { enabled: !!selectedModuleId }
  );

  const activeModuleList = selectedEvent
    ? (eventStudyQuery.data?.instructionalAreas?.flatMap((area) => area.modules) ?? [])
    : (modules ?? []);
  const filteredModules = filterPiStudyModules(modules ?? [], searchQuery);
  const filteredEventStudyAreas = (eventStudyQuery.data?.instructionalAreas ?? [])
    .map((area) => ({ ...area, modules: filterPiStudyModules(area.modules, searchQuery) }))
    .filter((area) => area.modules.length > 0);
  const isSearching = Boolean(searchQuery.trim());
  const currentModuleIndex = selectedModuleId === null ? -1 : activeModuleList.findIndex((module: any) => module.id === selectedModuleId);
  const currentModulePosition = currentModuleIndex >= 0 ? currentModuleIndex + 1 : 0;
  const visibleTabs = [...TABS, ...(showQuizResults ? [{ id: "quiz-results", label: "Results", icon: Award, color: "indigo" }] : [])];
  const activeTabIndex = visibleTabs.findIndex((tab) => tab.id === activeTab);

  const getSectionByType = (type: string) =>
    moduleWithSections?.sections?.find((s: any) => s.sectionType === type);

  const theorySection       = getSectionByType("theory");
  const vocabSection        = getSectionByType("vocabulary");
  const flashcardSection    = getSectionByType("flashcards");
  const quizSection         = getSectionByType("quiz");
  const scenarioSection     = getSectionByType("scenario_challenge");
  const relatedSection      = getSectionByType("examples");       // stored as 'examples'
  const teachBackSection    = getSectionByType("ai_coach_feedback");

  const { data: theoryContent }   = trpc.piLearning.getSectionContent.useQuery({ sectionId: theorySection?.id! },    { enabled: !!theorySection?.id });
  const { data: vocabContent }    = trpc.piLearning.getSectionContent.useQuery({ sectionId: vocabSection?.id! },     { enabled: !!vocabSection?.id });
  const { data: flashcardContent }= trpc.piLearning.getSectionContent.useQuery({ sectionId: flashcardSection?.id! }, { enabled: !!flashcardSection?.id });
  const { data: quizContent }     = trpc.piLearning.getSectionContent.useQuery({ sectionId: quizSection?.id! },      { enabled: !!quizSection?.id });
  const { data: scenarioContent } = trpc.piLearning.getSectionContent.useQuery({ sectionId: scenarioSection?.id! },  { enabled: !!scenarioSection?.id });
  const { data: relatedContent }  = trpc.piLearning.getSectionContent.useQuery({ sectionId: relatedSection?.id! },   { enabled: !!relatedSection?.id });
  const { data: teachBackContent }= trpc.piLearning.getSectionContent.useQuery({ sectionId: teachBackSection?.id! }, { enabled: !!teachBackSection?.id });

  // ── Helpers ────────────────────────────────────────────────────────────────
  const parseOptions = (opts: any): string[] => {
    if (!opts) return [];
    if (Array.isArray(opts)) return opts;
    if (typeof opts === "string") {
      try { const p = JSON.parse(opts); return Array.isArray(p) ? p : [p]; }
      catch { return opts.split(",").map((s: string) => s.trim()).filter(Boolean); }
    }
    return [];
  };

  const parseVocab = (content: string): { term: string; definition: string }[] => {
    if (!content) return [];
    return content
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const colonIdx = line.indexOf(":");
        if (colonIdx > -1) {
          return { term: line.slice(0, colonIdx).trim(), definition: line.slice(colonIdx + 1).trim() };
        }
        const dashIdx = line.indexOf(" – ");
        if (dashIdx > -1) {
          return { term: line.slice(0, dashIdx).trim(), definition: line.slice(dashIdx + 3).trim() };
        }
        return { term: line.trim(), definition: "" };
      })
      .filter((v) => v.term);
  };

  const parseRelated = (content: string) => {
    if (!content) return { relatedPIs: [] as string[], mistakes: [] as string[] };
    const lines = content.split("\n").filter(Boolean);
    const relatedPIs: string[] = [];
    const mistakes: string[] = [];
    let inMistakes = false;
    for (const line of lines) {
      if (line.toLowerCase().includes("common mistake") || line.toLowerCase().includes("pitfall")) {
        inMistakes = true; continue;
      }
      if (line.startsWith("-") || line.match(/^\d+\./)) {
        const clean = line.replace(/^[-\d.]\s*/, "").trim();
        if (inMistakes) mistakes.push(clean);
        else relatedPIs.push(clean);
      }
    }
    return { relatedPIs, mistakes };
  };

  const parseQuickReview = (content: string) => {
    try {
      const source = JSON.parse(content) as { quickReview?: Array<{ number: number; question: string; answer: string }> };
      return source.quickReview ?? [];
    } catch {
      return [];
    }
  };

  const allQuestions = quizContent?.quizQuestions || [];
  const sourceQuickReview = parseQuickReview(quizContent?.content || "");
  const quickReviewQs = sourceQuickReview.length
    ? sourceQuickReview
    : allQuestions.slice(0, 10).map((question: any, index: number) => ({
        number: index + 1,
        question: question.question,
        answer: question.correctAnswer,
        explanation: question.explanation || question.rationale || "",
      }));
  const fullQuizQs    = allQuestions.slice(0, 15);

  const correctCount = Object.entries(quizAnswers).filter(([qId, answer]) => {
    const q = fullQuizQs.find((q: any) => q.id === Number(qId));
    return q && answer === q.correctAnswer;
  }).length;

  const saveSectionProgress = async (sectionId: number | undefined, score: number) => {
    if (!sectionId) return;
    await updateSectionProgressMutation.mutateAsync({
      sectionId,
      isCompleted: true,
      score: Math.round(Math.min(100, Math.max(0, score))),
    });
    if (selectedModuleId) {
      await utils.piLearning.getUserModuleProgress.invalidate({ moduleId: selectedModuleId });
    }
  };

  const handleSubmitQuiz = async () => {
    try {
      await saveSectionProgress(quizSection?.id, (correctCount / Math.max(fullQuizQs.length, 1)) * 100);
    } catch {
      // Preserve the completed review if progress storage is temporarily unavailable.
    }
    setQuizSubmitted(true);
    setShowQuizResults(true);
    setActiveTab("quiz-results");
  };

  const handleSubmitTeachBack = async () => {
    if (!teachBackText.trim() || !selectedModuleId) return;
    setLoadingFeedback(true);
    try {
      const result = await submitTeachBackMutation.mutateAsync({
        moduleId: selectedModuleId,
        response: teachBackText,
      });
      setTeachBackFeedback(result.feedback);
      await saveSectionProgress(teachBackSection?.id, 100);
    } catch {
      setTeachBackFeedback("Error generating feedback. Please try again.");
    } finally {
      setLoadingFeedback(false);
    }
  };

  const resetModule = () => {
    setSelectedModuleId(null);
    setActiveTab("lesson");
    setCurrentFlashcardIndex(0);
    setIsFlipped(false);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setShowQuizResults(false);
    setTeachBackText("");
    setTeachBackFeedback("");
  };

  const openModule = (moduleId: number) => {
    setSelectedModuleId(moduleId);
    setActiveTab("lesson");
    setCurrentFlashcardIndex(0);
    setIsFlipped(false);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setShowQuizResults(false);
    setTeachBackText("");
    setTeachBackFeedback("");
  };

  const moveModule = (direction: -1 | 1) => {
    const nextModule = activeModuleList[currentModuleIndex + direction];
    if (nextModule) openModule(nextModule.id);
  };

  const moveActivity = (direction: -1 | 1) => {
    const nextTab = visibleTabs[activeTabIndex + direction];
    if (nextTab) setActiveTab(nextTab.id);
  };

  const renderModuleCard = (module: any) => (
    <button
      key={module.id}
      type="button"
      onClick={() => openModule(module.id)}
      className="editorial-panel editorial-panel-interactive group w-full cursor-pointer p-5 text-left"
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-md border border-blue-500/30 bg-blue-500/10 group-hover:border-blue-400/60 transition">
          <Lightbulb className="w-5 h-5 text-blue-400" />
        </div>
        {module.level && (
          <Badge variant="outline" className="text-xs border-slate-700 text-slate-400">
            {module.level}
          </Badge>
        )}
      </div>
      <h3 className="font-semibold text-white text-base mb-1 group-hover:text-blue-200 transition line-clamp-2">
        {module.performanceIndicator}
      </h3>
      <p className="text-sm text-slate-500 mb-4">{module.instructionalArea}</p>
      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
        <span className="text-xs font-mono text-slate-600">{module.piId}</span>
        <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
      </div>
    </button>
  );

  // ── Auth guard ─────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <Card className="w-full max-w-md border border-slate-800 bg-slate-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <AlertCircle className="w-5 h-5 text-red-400" /> Authentication Required
            </CardTitle>
            <CardDescription>You need to be logged in to access the PI Quizlet.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // ── Module selection screen ────────────────────────────────────────────────
  if (!selectedModuleId) {
    return (
      <div className="page-shell">
        <div className="page-content max-w-6xl">
          {/* Header */}
          <div className="mb-10 border-b border-white/10 pb-8">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-blue-500/40 bg-blue-500/10">
                <BookOpen className="h-5 w-5 text-blue-300" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">Blue Blazer Study Library</p>
            </div>
            <h1 className="page-title mb-2">Performance Indicator Study</h1>
            <p className="page-intro">
              Choose a career cluster, then work through lessons, vocabulary, flashcards, review questions, and scenarios at your own pace.
            </p>
            <div className="editorial-panel-muted mt-6 max-w-2xl p-4">
              <label htmlFor="event-study-path" className="block text-sm font-semibold text-slate-200">Study for a specific competitive event</label>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">Select an event to separate business administration core skills from the indicators aligned with that event’s career cluster.</p>
              <select
                id="event-study-path"
                value={activeEventCode}
                onChange={(event) => {
                  setSelectedEventCode(event.target.value);
                  if (event.target.value) setPrimaryEvent.mutate({ eventCode: event.target.value });
                }}
                className="mt-3 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">Browse by career cluster instead</option>
                {[...allEvents].sort((a, b) => a.name.localeCompare(b.name)).map((event) => (
                  <option key={event.code} value={event.code}>{event.code} — {event.name}</option>
                ))}
              </select>
            </div>
            <div className="editorial-panel-muted mt-4 max-w-2xl p-3">
              <label htmlFor="pi-study-search" className="data-label">Search this study path</label>
              <div className="relative mt-2">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
                <input
                  id="pi-study-search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by PI code, skill, instructional area, or cluster"
                  className="w-full rounded-md border border-white/10 bg-black/20 py-2.5 pl-9 pr-10 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
                {searchQuery && <button type="button" onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded text-slate-400 hover:bg-white/5 hover:text-white" aria-label="Clear PI search"><X className="h-4 w-4" /></button>}
              </div>
              <p className="mt-2 text-xs text-slate-500">Results update as you type and remain within the current cluster or selected event path.</p>
            </div>
          </div>

          {/* Cluster Tabs */}
          <div className="mb-8 flex max-w-full gap-1.5 overflow-x-auto border-b border-white/10 pb-3">
            {CLUSTERS.map((cluster) => (
              <button
                key={cluster}
                onClick={() => setSelectedCluster(cluster)}
                className={`px-4 py-2 rounded-md border font-medium text-sm transition-colors duration-150 ${
                  selectedCluster === cluster
                    ? "editorial-tab editorial-tab-active"
                    : "editorial-tab bg-white/[0.02]"
                }`}
              >
                {cluster}
              </button>
            ))}
          </div>

          {/* Modules Grid */}
          {modulesLoading || eventStudyLoading ? (
            <div className="loading-state py-12">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
                <p className="text-slate-400">Loading modules...</p>
              </div>
            </div>
          ) : selectedEvent ? (
            <div className="space-y-10">
              <div className="editorial-panel border-blue-500/20 bg-blue-500/[0.045] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-300">Official 2026–2027 PI guide</p>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-xl font-bold text-white">{selectedEvent.name}</h2><p className="mt-1 text-sm text-slate-400">Shared PI modules mapped to this event’s active performance-indicator list. Modules are grouped by instructional area; no content is duplicated.</p></div><span className="text-sm text-slate-400">{eventStudyQuery.data?.completedModules ?? 0} / {eventStudyQuery.data?.totalModules ?? 0} mastered</span></div>
              </div>
              {filteredEventStudyAreas.length ? filteredEventStudyAreas.map((area) => (
                <div key={area.instructionalArea}>
                  <div className="mb-4 flex items-end justify-between gap-4 border-l-2 border-emerald-500 pl-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">{area.modules[0]?.cluster === "Business Administration Core" ? "General business skills" : "Event-specific preparation"}</p><h3 className="mt-1 text-xl font-bold text-white">{area.instructionalArea}</h3></div><span className="text-sm text-slate-500">{area.modules.length} indicators</span></div>
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">{area.modules.map(renderModuleCard)}</div>
                </div>
              )) : <div className="empty-state min-h-32 p-5 text-sm"><AlertCircle className="mb-3 h-5 w-5 text-slate-500" />{isSearching ? `No performance indicators match “${searchQuery.trim()}” in this event path.` : "No official PI mapping is available for this event."}</div>}
            </div>
          ) : filteredModules.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredModules.map(renderModuleCard)}
            </div>
          ) : (
            <div className="empty-state py-16">
              <AlertCircle className="w-14 h-14 text-slate-700 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">{isSearching ? `No performance indicators match “${searchQuery.trim()}” in this cluster.` : "No modules available for this cluster yet"}</p>
              {isSearching && <button type="button" onClick={() => setSearchQuery("")} className="mt-4 text-sm font-medium text-blue-300 hover:text-blue-200">Clear search</button>}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Module loading ─────────────────────────────────────────────────────────
  if (moduleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">Loading module content...</p>
        </div>
      </div>
    );
  }

  const currentFlashcard = flashcardContent?.flashcards?.[currentFlashcardIndex];
  const totalFlashcards  = flashcardContent?.flashcards?.length || 0;
  const vocabTerms       = parseVocab(vocabContent?.content || "");
  const { relatedPIs, mistakes } = parseRelated(relatedContent?.content || "");

  // ── Module view ────────────────────────────────────────────────────────────
  return (
    <div className="page-shell">
      <div className="page-content max-w-5xl">

        {/* Back button */}
        <button
          onClick={resetModule}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 text-sm font-medium transition"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Modules
        </button>

        {/* Module header */}
        <div className="editorial-panel mb-6 border-l-4 border-l-blue-500 p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-blue-300 text-xs font-semibold mb-2 uppercase tracking-[0.16em]">{moduleWithSections?.instructionalArea}</p>
              <h1 className="text-3xl font-bold text-white">{moduleWithSections?.performanceIndicator}</h1>
              <p className="text-slate-400 text-xs mt-3 font-mono">{moduleWithSections?.piId}</p>
            </div>
            <div className="min-w-44 rounded-md border border-slate-700 bg-slate-950 p-3">
              <div className="mb-1 flex items-center justify-between gap-3 text-xs text-slate-300">
                <span>Mastery</span>
                <span className="font-bold text-white">{moduleProgress?.masteryScore ?? 0}%</span>
              </div>
              <Progress value={moduleProgress?.masteryScore ?? 0} className="h-1.5 bg-slate-800" />
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {(moduleProgress?.reviewStatus ?? "needs_review").replace("_", " ")}
              </p>
            </div>
          </div>
        </div>

        <div className="editorial-panel-muted mb-6 grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-700 bg-slate-950">
              <Map className="h-4 w-4 text-blue-300" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Study path</p>
              <p className="mt-1 truncate text-sm text-slate-200">
                {currentModulePosition ? `Indicator ${currentModulePosition} of ${activeModuleList.length}` : "Current performance indicator"}
              </p>
              <p className="mt-1 text-xs text-slate-500">Use the activity steps below, or move directly to the previous or next indicator in this study list.</p>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" size="sm" onClick={() => moveModule(-1)} disabled={currentModuleIndex <= 0} className="border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-800">
              <SkipBack className="mr-1.5 h-3.5 w-3.5" /> Previous PI
            </Button>
            <Button variant="outline" size="sm" onClick={() => moveModule(1)} disabled={currentModuleIndex < 0 || currentModuleIndex >= activeModuleList.length - 1} className="border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-800">
              Next PI <SkipForward className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="mb-3 flex items-center justify-between gap-3">
          <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Module activities</p><p className="mt-1 text-xs text-slate-500">Follow the recommended sequence or jump to any activity.</p></div>
          <span className="shrink-0 text-xs font-medium text-slate-400">Step {Math.max(activeTabIndex + 1, 1)} of {visibleTabs.length}</span>
        </div>
        <div className="flex gap-1 mb-4 border-b border-slate-800 pb-3 overflow-x-auto" aria-label="Module activity navigation">
          {visibleTabs.map((tab, index) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md border text-xs font-medium whitespace-nowrap transition-colors duration-150 flex-shrink-0 ${
                  isActive
                    ? "editorial-tab editorial-tab-active"
                    : "editorial-tab"
                }`}
              >
                <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold ${isActive ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"}`}>{index + 1}</span>
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
        <div className="editorial-panel-muted mb-6 flex flex-wrap items-center justify-between gap-3 p-3">
          <p className="text-xs text-slate-400"><span className="font-semibold text-slate-200">Now studying:</span> {visibleTabs[activeTabIndex]?.label ?? "Lesson"}</p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => moveActivity(-1)} disabled={activeTabIndex <= 0} className="text-slate-300 hover:bg-slate-800 hover:text-white"><ChevronLeft className="mr-1 h-4 w-4" /> Previous activity</Button>
            <Button variant="ghost" size="sm" onClick={() => moveActivity(1)} disabled={activeTabIndex < 0 || activeTabIndex >= visibleTabs.length - 1} className="text-slate-300 hover:bg-slate-800 hover:text-white">Next activity <ChevronRight className="ml-1 h-4 w-4" /></Button>
          </div>
        </div>

        {/* ── LESSON ── */}
        {activeTab === "lesson" && (
          <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
            <div className="flex items-center gap-3 p-5 border-b border-slate-800 bg-slate-900">
              <div className="w-10 h-10 border border-blue-500/40 bg-blue-500/10 rounded-md flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-white">Lesson</h2>
                <p className="text-xs text-slate-400">Plain-English explanation</p>
              </div>
            </div>
            <div className="p-8">
              <p className="text-slate-300 leading-relaxed text-base whitespace-pre-wrap">
                {theoryContent?.content || "No lesson content available."}
              </p>
              {theorySection?.id && (
                <Button
                  variant="outline"
                  onClick={() => saveSectionProgress(theorySection.id, 100)}
                  disabled={updateSectionProgressMutation.isPending}
                  className="mt-6 border-blue-500/40 text-blue-300 hover:bg-blue-500/10"
                >
                  <CheckCircle className="mr-2 h-4 w-4" /> Mark lesson complete
                </Button>
              )}
            </div>
          </div>
        )}

        {/* ── VOCABULARY ── */}
        {activeTab === "vocabulary" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-gradient-to-r from-emerald-500/10 to-teal-500/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-white">Vocabulary</h2>
                  <p className="text-xs text-slate-400">10 essential terms</p>
                </div>
              </div>
              <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30">
                {vocabTerms.length} terms
              </Badge>
            </div>
            <div className="p-6">
              {vocabTerms.length > 0 ? (
                <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {vocabTerms.map((v, idx) => (
                    <div key={idx} className="p-4 bg-slate-800 border border-slate-700 hover:border-emerald-500/40 rounded-xl transition">
                      <div className="flex items-start gap-3">
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg flex-shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-bold text-white text-sm">{v.term}</p>
                          {v.definition && <p className="text-slate-400 text-xs mt-1 leading-relaxed">{v.definition}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {vocabSection?.id && (
                  <Button
                    variant="outline"
                    onClick={() => saveSectionProgress(vocabSection.id, 100)}
                    disabled={updateSectionProgressMutation.isPending}
                    className="mt-6 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" /> Mark vocabulary complete
                  </Button>
                )}
                </>
              ) : (
                <p className="text-slate-500 text-center py-12">No vocabulary terms available.</p>
              )}
            </div>
          </div>
        )}

        {/* ── FLASHCARDS ── */}
        {activeTab === "flashcards" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
                  <FlipHorizontal className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-white">Flashcards</h2>
                  <p className="text-xs text-slate-400">Click card to flip</p>
                </div>
              </div>
              {totalFlashcards > 0 && (
                <Badge className="bg-purple-600/20 text-purple-400 border-purple-600/30">
                  {currentFlashcardIndex + 1} / {totalFlashcards}
                </Badge>
              )}
            </div>
            <div className="p-8">
              {currentFlashcard ? (
                <div className="space-y-6">
                  {/* Progress bar */}
                  <Progress value={((currentFlashcardIndex + 1) / totalFlashcards) * 100} className="h-1.5 bg-slate-800" />

                  {/* 3D Flip Card */}
                  <div
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="cursor-pointer select-none"
                    style={{ perspective: "1200px" }}
                  >
                    <div
                      style={{
                        position: "relative",
                        width: "100%",
                        height: "280px",
                        transformStyle: "preserve-3d",
                        transition: "transform 0.55s cubic-bezier(0.4, 0.2, 0.2, 1)",
                        transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                      }}
                    >
                      {/* Front */}
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          backfaceVisibility: "hidden",
                          WebkitBackfaceVisibility: "hidden",
                        }}
                        className="rounded-lg border border-slate-600 bg-slate-800 p-8 flex flex-col justify-center items-center text-white shadow-xl"
                      >
                        <p className="text-xs font-bold text-blue-300 mb-5 uppercase tracking-widest">Prompt</p>
                        <p className="text-xl font-bold text-center leading-snug">{currentFlashcard.question}</p>
                        <div className="mt-8 flex items-center gap-2 text-slate-400 text-xs">
                          <RotateCw className="w-3.5 h-3.5" />
                          <span>Click to reveal answer</span>
                        </div>
                      </div>

                      {/* Back */}
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          backfaceVisibility: "hidden",
                          WebkitBackfaceVisibility: "hidden",
                          transform: "rotateY(180deg)",
                        }}
                        className="rounded-lg border border-blue-500/40 bg-slate-800 p-8 flex flex-col justify-center items-center text-white shadow-xl"
                      >
                        <p className="text-xs font-bold text-blue-300 mb-5 uppercase tracking-widest">Key point</p>
                        <p className="text-lg font-semibold text-center leading-snug">{currentFlashcard.answer}</p>
                        <div className="mt-8 flex items-center gap-2 text-slate-400 text-xs">
                          <RotateCw className="w-3.5 h-3.5" />
                          <span>Click to see question</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Navigation */}
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      onClick={() => { setCurrentFlashcardIndex(Math.max(0, currentFlashcardIndex - 1)); setIsFlipped(false); }}
                      disabled={currentFlashcardIndex === 0}
                      className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white py-5"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                    </Button>
                    <Button
                      onClick={() => setIsFlipped(!isFlipped)}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 py-5"
                    >
                      <RotateCw className="w-4 h-4 mr-1" /> Flip
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => { setCurrentFlashcardIndex(Math.min(totalFlashcards - 1, currentFlashcardIndex + 1)); setIsFlipped(false); }}
                      disabled={currentFlashcardIndex === totalFlashcards - 1}
                      className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white py-5"
                    >
                      Next <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                  {flashcardSection?.id && (
                    <Button
                      onClick={() => saveSectionProgress(flashcardSection.id, 100)}
                      disabled={updateSectionProgressMutation.isPending}
                      className="w-full bg-purple-600 hover:bg-purple-700 py-5"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" /> Mark all flashcards reviewed
                    </Button>
                  )}
                </div>
              ) : (
                <p className="text-slate-500 text-center py-20">No flashcards available.</p>
              )}
            </div>
          </div>
        )}

        {/* ── QUICK REVIEW ── */}
        {activeTab === "quick-review" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-gradient-to-r from-amber-500/10 to-orange-500/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-600 rounded-xl flex items-center justify-center">
                  <ListChecks className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-white">Quick Review</h2>
                  <p className="text-xs text-slate-400">10 review questions with answers</p>
                </div>
              </div>
              <Badge className="bg-amber-600/20 text-amber-400 border-amber-600/30">{quickReviewQs.length} questions</Badge>
            </div>
            <div className="p-6 space-y-3">
              {quickReviewQs.length > 0 ? (
                quickReviewQs.map((q: any, idx: number) => (
                  <div key={`${q.number}-${idx}`} className="p-5 bg-slate-800 border border-slate-700 hover:border-amber-500/30 rounded-xl transition">
                    <div className="flex gap-3">
                      <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg h-fit flex-shrink-0">
                        Q{idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm mb-2">{q.question}</p>
                        <p className="text-xs text-amber-300 font-medium">
                          Answer: <span className="text-slate-300">{q.answer}</span>
                        </p>
                        {(q.explanation || q.rationale) && (
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{q.explanation || q.rationale}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-center py-12">No review questions available.</p>
              )}
            </div>
          </div>
        )}

        {/* ── QUIZ ── */}
        {activeTab === "quiz" && !quizSubmitted && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-gradient-to-r from-red-500/10 to-pink-500/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-white">Comprehensive Quiz</h2>
                  <p className="text-xs text-slate-400">15 multiple-choice questions</p>
                </div>
              </div>
              <Badge className="bg-red-600/20 text-red-400 border-red-600/30">
                {Object.keys(quizAnswers).length} / {fullQuizQs.length} answered
              </Badge>
            </div>
            <div className="p-6 space-y-5">
              {fullQuizQs.length > 0 ? (
                <>
                  {fullQuizQs.map((q: any, idx: number) => {
                    const options = parseOptions(q.options);
                    const answered = quizAnswers[q.id];
                    return (
                      <div key={q.id} className={`p-5 border rounded-xl transition ${answered ? "border-blue-500/40 bg-blue-500/5" : "border-slate-700 bg-slate-800"}`}>
                        <div className="flex gap-3 mb-4">
                          <span className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-lg h-fit flex-shrink-0">
                            {idx + 1}
                          </span>
                          <p className="font-semibold text-white text-sm">{q.question}</p>
                        </div>
                        <div className="space-y-2 ml-9">
                          {options.map((option: string, optIdx: number) => {
                            const letter = String.fromCharCode(65 + optIdx);
                            const isSelected = answered === letter;
                            return (
                              <label
                                key={optIdx}
                                className={`flex items-start p-3 rounded-lg cursor-pointer border transition-all duration-150 ${
                                  isSelected
                                    ? "border-blue-500 bg-blue-500/15 text-white"
                                    : "border-slate-700 hover:border-slate-500 hover:bg-slate-700/50 text-slate-300"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`q${q.id}`}
                                  value={letter}
                                  checked={isSelected}
                                  onChange={(e) => setQuizAnswers({ ...quizAnswers, [q.id]: e.target.value })}
                                  className="w-4 h-4 mr-3 mt-0.5 cursor-pointer flex-shrink-0 accent-blue-500"
                                />
                                <span className="text-sm">
                                  <span className="font-bold mr-2 text-slate-400">{letter}.</span>
                                  {option}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  <Button
                    onClick={handleSubmitQuiz}
                    disabled={Object.keys(quizAnswers).length < fullQuizQs.length}
                    className="w-full bg-red-600 hover:bg-red-700 py-6 text-base font-bold rounded-xl disabled:opacity-40 mt-4"
                  >
                    Submit Quiz ({Object.keys(quizAnswers).length}/{fullQuizQs.length} answered)
                  </Button>
                </>
              ) : (
                <p className="text-slate-500 text-center py-12">No quiz questions available.</p>
              )}
            </div>
          </div>
        )}

        {/* If quiz already submitted, show a prompt to view results */}
        {activeTab === "quiz" && quizSubmitted && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Quiz Submitted!</h2>
            <p className="text-slate-400 mb-6">You scored {correctCount} out of {fullQuizQs.length}</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => setActiveTab("quiz-results")} className="bg-blue-600 hover:bg-blue-700">
                View Results
              </Button>
              <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800" onClick={() => { setQuizAnswers({}); setQuizSubmitted(false); setShowQuizResults(false); }}>
                Retake Quiz
              </Button>
            </div>
          </div>
        )}

        {/* ── QUIZ RESULTS ── */}
        {activeTab === "quiz-results" && (
          <div className="space-y-6">
            {/* Score card */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-center shadow-2xl shadow-blue-500/20">
              <p className="text-blue-200 text-sm font-semibold uppercase tracking-widest mb-2">Your Score</p>
              <p className="text-7xl font-black text-white mb-2">{Math.round((correctCount / Math.max(fullQuizQs.length, 1)) * 100)}%</p>
              <p className="text-blue-200 text-lg">{correctCount} out of {fullQuizQs.length} correct</p>
              <div className="mt-4">
                <Progress value={(correctCount / Math.max(fullQuizQs.length, 1)) * 100} className="h-2 bg-blue-500/30" />
              </div>
            </div>

            {/* Per-question review */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-800">
                <h2 className="font-bold text-white">Answer Review</h2>
                <p className="text-xs text-slate-400 mt-0.5">See what you got right and wrong</p>
              </div>
              <div className="p-5 space-y-4">
                {fullQuizQs.map((q: any, idx: number) => {
                  const options = parseOptions(q.options);
                  const userAnswer = quizAnswers[q.id];
                  const isCorrect = userAnswer === q.correctAnswer;
                  return (
                    <div key={q.id} className={`p-5 border rounded-xl ${isCorrect ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"}`}>
                      <div className="flex items-start gap-3 mb-3">
                        {isCorrect
                          ? <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          : <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        }
                        <p className="font-semibold text-white text-sm">{idx + 1}. {q.question}</p>
                      </div>
                      <div className="space-y-1.5 ml-8">
                        {options.map((option: string, optIdx: number) => {
                          const letter = String.fromCharCode(65 + optIdx);
                          const isUserChoice = userAnswer === letter;
                          const isCorrectAnswer = q.correctAnswer === letter;
                          return (
                            <div key={optIdx} className={`px-3 py-2 rounded-lg text-xs flex items-center gap-2 ${
                              isCorrectAnswer ? "bg-green-500/20 text-green-300 border border-green-500/30" :
                              isUserChoice && !isCorrectAnswer ? "bg-red-500/20 text-red-300 border border-red-500/30" :
                              "text-slate-500"
                            }`}>
                              <span className="font-bold">{letter}.</span>
                              <span>{option}</span>
                              {isCorrectAnswer && <span className="ml-auto font-bold text-green-400">✓ Correct</span>}
                              {isUserChoice && !isCorrectAnswer && <span className="ml-auto font-bold text-red-400">✗ Your answer</span>}
                            </div>
                          );
                        })}
                      </div>
                      {(q.explanation || q.rationale) && (
                        <div className="mt-3 ml-8 p-3 bg-slate-800 rounded-lg border-l-2 border-blue-500">
                          <p className="text-xs text-slate-400 leading-relaxed">{q.explanation || q.rationale}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 py-5"
              onClick={() => { setQuizAnswers({}); setQuizSubmitted(false); setShowQuizResults(false); setActiveTab("quiz"); }}
            >
              <RotateCw className="w-4 h-4 mr-2" /> Retake Quiz
            </Button>
          </div>
        )}

        {/* ── SCENARIOS ── */}
        {activeTab === "scenarios" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-gradient-to-r from-cyan-500/10 to-blue-500/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-cyan-600 rounded-xl flex items-center justify-center">
                  <Layers className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-white">Business Scenarios</h2>
                  <p className="text-xs text-slate-400">3 real-world case challenges</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-5">
              {scenarioContent?.scenarios && scenarioContent.scenarios.length > 0 ? (
                <>
                {scenarioContent.scenarios.map((scenario: any, idx: number) => (
                  <div key={scenario.id} className="p-6 bg-slate-800 border border-slate-700 hover:border-cyan-500/30 rounded-xl transition">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-1 rounded-lg">
                        Case {idx + 1}
                      </span>
                      <Badge variant="outline" className={`text-xs border-slate-600 ${
                        scenario.difficulty === "hard" ? "text-red-400" :
                        scenario.difficulty === "medium" ? "text-amber-400" : "text-green-400"
                      }`}>
                        {scenario.difficulty}
                      </Badge>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed mb-5">{scenario.scenario}</p>
                    {scenario.expectedAnswer && (
                      <details className="group">
                        <summary className="cursor-pointer text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition flex items-center gap-1.5">
                          <ChevronRight className="w-3.5 h-3.5 group-open:rotate-90 transition-transform" />
                          View Expected Response
                        </summary>
                        <div className="mt-3 p-4 bg-slate-900 border-l-2 border-cyan-500 rounded-r-lg">
                          <p className="text-xs text-slate-400 leading-relaxed">{scenario.expectedAnswer}</p>
                        </div>
                      </details>
                    )}
                  </div>
                ))}
                {scenarioSection?.id && (
                  <Button
                    onClick={() => saveSectionProgress(scenarioSection.id, 100)}
                    disabled={updateSectionProgressMutation.isPending}
                    className="w-full bg-cyan-600 hover:bg-cyan-700 py-5"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" /> Mark scenarios practiced
                  </Button>
                )}
                </>
              ) : (
                <p className="text-slate-500 text-center py-12">No scenario challenges available.</p>
              )}
            </div>
          </div>
        )}

        {/* ── RELATED PIs ── */}
        {activeTab === "related" && (
          <div className="space-y-5">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="flex items-center gap-3 p-6 border-b border-slate-800 bg-gradient-to-r from-green-500/10 to-emerald-500/10">
                <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
                  <Link2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-white">Related Performance Indicators</h2>
                  <p className="text-xs text-slate-400">Connected concepts to study together</p>
                </div>
              </div>
              <div className="p-6">
                {relatedPIs.length > 0 ? (
                  <div className="space-y-2">
                    {relatedPIs.map((pi, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-slate-800 border border-slate-700 rounded-lg">
                        <ArrowRight className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-slate-300">{pi}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm">{relatedContent?.content || "No related PIs listed."}</p>
                )}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="flex items-center gap-3 p-6 border-b border-slate-800 bg-gradient-to-r from-red-500/10 to-orange-500/10">
                <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-white">Common Mistakes</h2>
                  <p className="text-xs text-slate-400">Pitfalls to avoid in competition</p>
                </div>
              </div>
              <div className="p-6">
                {mistakes.length > 0 ? (
                  <div className="space-y-2">
                    {mistakes.map((m, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                        <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-slate-300">{m}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm">No common mistakes listed.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── TEACH-BACK ── */}
        {activeTab === "teach-back" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-3 p-6 border-b border-slate-800 bg-gradient-to-r from-orange-500/10 to-amber-500/10">
              <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-white">Teach-Back Activity</h2>
                <p className="text-xs text-slate-400">Demonstrate mastery with real AI feedback</p>
              </div>
            </div>
            <div className="p-8 space-y-6">
              {/* Prompt */}
              <div className="p-5 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                <p className="font-bold text-orange-300 mb-3 text-sm">
                  {teachBackContent?.content || `Explain "${moduleWithSections?.performanceIndicator}" as if teaching it to a new DECA member.`}
                </p>
                <p className="text-xs text-slate-400">Your response should cover the concept, its business importance, a real-world example, and how to apply it.</p>
              </div>

              {/* Text area */}
              <textarea
                value={teachBackText}
                onChange={(e) => setTeachBackText(e.target.value)}
                placeholder="Write your comprehensive explanation here..."
                className="w-full p-5 bg-slate-800 border-2 border-slate-700 focus:border-orange-500 rounded-xl min-h-44 text-white placeholder-slate-500 focus:outline-none focus:ring-0 transition font-medium resize-none text-sm leading-relaxed"
              />

              <Button
                onClick={handleSubmitTeachBack}
                disabled={!teachBackText.trim() || loadingFeedback}
                className="w-full bg-orange-600 hover:bg-orange-700 py-6 text-base font-bold rounded-xl disabled:opacity-40"
              >
                {loadingFeedback ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Generating AI Feedback...</>
                ) : (
                  <><Send className="w-5 h-5 mr-2" /> Submit for AI Feedback</>
                )}
              </Button>

              {teachBackFeedback && (
                <div className="p-6 bg-green-500/10 border border-green-500/30 rounded-xl">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-green-300 mb-2 text-sm">AI Coach Feedback</p>
                      <p className="text-sm text-slate-300 leading-relaxed">{teachBackFeedback}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 pt-6 border-t border-slate-800 flex justify-between items-center">
          <button onClick={resetModule} className="text-sm text-slate-500 hover:text-slate-300 transition flex items-center gap-1.5">
            <ChevronLeft className="w-4 h-4" /> Back to Modules
          </button>
          <p className="text-xs text-slate-600 font-mono">{moduleWithSections?.piId}</p>
        </div>
      </div>
    </div>
  );
}
