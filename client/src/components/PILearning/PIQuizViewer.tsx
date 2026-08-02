import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, CheckCircle, XCircle } from "lucide-react";

interface QuizQuestion {
  id: number;
  question: string;
  options: string;
  correctAnswer: string;
  rationale?: string;
}

interface PIQuizViewerProps {
  questions: QuizQuestion[];
  sectionId: number;
}

export default function PIQuizViewer({ questions, sectionId }: PIQuizViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);

  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers[currentQuestion.id];
  const isAnswered = currentAnswer !== undefined;

  const options = JSON.parse(currentQuestion.options || "[]");
  const isCorrect = currentAnswer === currentQuestion.correctAnswer;

  const handleSelectAnswer = (value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setShowResults(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleReset = () => {
    setAnswers({});
    setCurrentIndex(0);
    setShowResults(false);
  };

  const correctCount = Object.entries(answers).filter(([qId, answer]) => {
    const q = questions.find((q) => q.id === parseInt(qId));
    return q && answer === q.correctAnswer;
  }).length;

  const score = Math.round((correctCount / questions.length) * 100);

  if (showResults) {
    return (
      <div className="space-y-6">
        {/* Score Card */}
        <Card className={`bg-gradient-to-br ${
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
        <div className="flex gap-3">
          <Button onClick={handleReset} className="flex-1">
            Retake Quiz
          </Button>
          <Button variant="outline" className="flex-1">
            Back to Section
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <Badge variant="outline">
                {Object.keys(answers).length} answered
              </Badge>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question */}
      <Card>
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
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <Button
          onClick={handleNext}
          disabled={!isAnswered}
          className="flex-1"
        >
          {currentIndex === questions.length - 1 ? "Finish Quiz" : "Next Question"}
        </Button>

        <Button
          onClick={handleNext}
          variant="outline"
          size="icon"
          disabled={currentIndex === questions.length - 1}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
