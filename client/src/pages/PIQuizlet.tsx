import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, BookOpen } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

export default function PIQuizlet() {
  const { user } = useAuth();
  const [selectedCluster, setSelectedCluster] = useState("Marketing");
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);

  const CLUSTERS = ["Marketing", "Finance", "Business Management", "Hospitality"];

  const { data: modules, isLoading: modulesLoading } = trpc.piLearning.getModulesByCluster.useQuery({
    cluster: selectedCluster,
  });

  const { data: sectionContent, isLoading: contentLoading } = trpc.piLearning.getSectionContent.useQuery(
    { sectionId: selectedModuleId! },
    { enabled: !!selectedModuleId }
  );

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Please Log In</CardTitle>
            <CardDescription>
              You need to be logged in to access the PI Quizlet.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const questions = sectionContent?.quizQuestions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestion?.id];
  const isAnswered = currentAnswer !== undefined;

  const handleSelectAnswer = (value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setShowResults(true);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleReset = () => {
    setAnswers({});
    setCurrentQuestionIndex(0);
    setShowResults(false);
    setSelectedModuleId(null);
  };

  const correctCount = Object.entries(answers).filter(([qId, answer]) => {
    const q = questions.find((q) => q.id === parseInt(qId));
    return q && answer === q.correctAnswer;
  }).length;

  const score = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

  const options = currentQuestion ? JSON.parse(currentQuestion.options || "[]") : [];
  const isCorrect = currentAnswer === currentQuestion?.correctAnswer;

  if (showResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="container mx-auto py-8 px-4">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-8 h-8 text-blue-600" />
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
                PI Quizlet
              </h1>
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              Test your knowledge with interactive quizzes
            </p>
          </div>

          {/* Score Card */}
          <Card className={`bg-gradient-to-br mb-8 ${
            score >= 80
              ? "from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800"
              : score >= 50
                ? "from-yellow-50 to-amber-50 dark:from-yellow-950 dark:to-amber-950 border-yellow-200 dark:border-yellow-800"
                : "from-red-50 to-rose-50 dark:from-red-950 dark:to-rose-950 border-red-200 dark:border-red-800"
          }`}>
            <CardHeader className="text-center">
              <CardTitle className="text-3xl mb-2">Quiz Complete!</CardTitle>
              <CardDescription>Here's how you performed</CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div>
                <p className="text-5xl font-bold mb-2">
                  {score}%
                </p>
                <p className="text-lg font-semibold">
                  {correctCount} out of {questions.length} correct
                </p>
              </div>

              {score >= 80 && (
                <p className="text-green-700 dark:text-green-300 font-semibold">
                  🎉 Excellent work! You've mastered this section!
                </p>
              )}
              {score >= 50 && score < 80 && (
                <p className="text-yellow-700 dark:text-yellow-300 font-semibold">
                  👍 Good effort! Review the incorrect answers to improve.
                </p>
              )}
              {score < 50 && (
                <p className="text-red-700 dark:text-red-300 font-semibold">
                  📚 Keep studying! Try the quiz again after reviewing the material.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Review Answers */}
          <Card>
            <CardHeader>
              <CardTitle>Review Your Answers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {questions.map((q, index) => {
                const userAnswer = answers[q.id];
                const isCorrectAnswer = userAnswer === q.correctAnswer;

                return (
                  <div key={q.id} className="pb-6 border-b last:border-b-0">
                    <div className="flex items-start gap-3 mb-3">
                      {isCorrectAnswer ? (
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-1" />
                      )}
                      <div className="flex-1">
                        <p className="font-semibold text-sm mb-2">
                          Question {index + 1}: {q.question}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                          Your answer: <span className="font-medium">{userAnswer}</span>
                        </p>
                        {!isCorrectAnswer && (
                          <p className="text-sm text-green-600 dark:text-green-400 mb-2">
                            Correct answer: <span className="font-medium">{q.correctAnswer}</span>
                          </p>
                        )}
                        {q.rationale && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 italic">
                            {q.rationale}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-8">
            <Button onClick={handleReset} className="flex-1">
              Retake Quiz
            </Button>
            <Button variant="outline" className="flex-1">
              Back to Modules
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedModuleId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="container mx-auto py-8 px-4">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-8 h-8 text-blue-600" />
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
                PI Quizlet
              </h1>
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              Test your knowledge with interactive quizzes
            </p>
          </div>

          {/* Cluster Tabs */}
          <Tabs value={selectedCluster} onValueChange={setSelectedCluster} className="w-full mb-8">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
              {CLUSTERS.map((cluster) => (
                <TabsTrigger key={cluster} value={cluster} className="text-xs sm:text-sm">
                  {cluster.split(" ")[0]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Modules Grid */}
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
                        <CardDescription className="text-xs mt-1">
                          {module.instructionalArea}
                        </CardDescription>
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

                    <Button
                      onClick={() => setSelectedModuleId(module.id)}
                      className="w-full mt-2"
                    >
                      Start Quiz
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

  if (contentLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>No Questions Available</CardTitle>
            <CardDescription>
              This module doesn't have any quiz questions yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleReset} className="w-full">
              Back to Modules
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
              PI Quizlet
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            Test your knowledge with interactive quizzes
          </p>
        </div>

        {/* Progress */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
                <Badge variant="outline">
                  {Object.keys(answers).length} answered
                </Badge>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Question */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">{currentQuestion.question}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup value={currentAnswer || ""} onValueChange={handleSelectAnswer}>
              <div className="space-y-3">
                {options.map((option: string, index: number) => {
                  const optionLetter = String.fromCharCode(65 + index); // A, B, C, D
                  const isSelected = currentAnswer === optionLetter;
                  const isCorrectOption = optionLetter === currentQuestion.correctAnswer;
                  const showCorrect = isAnswered && isCorrectOption;
                  const showIncorrect = isAnswered && isSelected && !isCorrect;

                  return (
                    <div
                      key={index}
                      className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                        showCorrect
                          ? "border-green-500 bg-green-50 dark:bg-green-950"
                          : showIncorrect
                            ? "border-red-500 bg-red-50 dark:bg-red-950"
                            : isSelected
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                              : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                      }`}
                    >
                      <RadioGroupItem value={optionLetter} id={`option-${index}`} disabled={isAnswered} />
                      <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer font-medium">
                        <span className="font-semibold mr-2">{optionLetter}.</span>
                        {option}
                      </Label>
                      {showCorrect && <CheckCircle className="w-5 h-5 text-green-600" />}
                      {showIncorrect && <XCircle className="w-5 h-5 text-red-600" />}
                    </div>
                  );
                })}
              </div>
            </RadioGroup>

            {isAnswered && currentQuestion.rationale && (
              <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-900 rounded-lg">
                <p className="text-sm font-semibold mb-1">Explanation:</p>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  {currentQuestion.rationale}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4">
          <Button
            onClick={handlePrev}
            variant="outline"
            size="icon"
            disabled={currentQuestionIndex === 0}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <Button
            onClick={handleNext}
            disabled={!isAnswered}
            className="flex-1"
          >
            {currentQuestionIndex === questions.length - 1 ? "Finish Quiz" : "Next Question"}
          </Button>

          <Button
            onClick={handleNext}
            variant="outline"
            size="icon"
            disabled={currentQuestionIndex === questions.length - 1}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
