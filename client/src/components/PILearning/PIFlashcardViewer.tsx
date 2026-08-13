import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, RotateCw } from "lucide-react";

interface Flashcard {
  id: number;
  question: string;
  answer: string;
  type: "multiple_choice" | "true_false" | "fill_in_the_blank";
  options?: string;
  correctAnswer?: string;
}

interface PIFlashcardViewerProps {
  flashcards: Flashcard[];
  sectionId: number;
}

export default function PIFlashcardViewer({ flashcards, sectionId }: PIFlashcardViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [mastered, setMastered] = useState<Set<number>>(new Set());

  const currentCard = flashcards[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % flashcards.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
  };

  const handleMastered = () => {
    const newMastered = new Set(mastered);
    if (newMastered.has(currentCard.id)) {
      newMastered.delete(currentCard.id);
    } else {
      newMastered.add(currentCard.id);
    }
    setMastered(newMastered);
  };

  const handleShuffle = () => {
    setCurrentIndex(Math.floor(Math.random() * flashcards.length));
    setIsFlipped(false);
  };

  const progress = Math.round(((currentIndex + 1) / flashcards.length) * 100);
  const masteredCount = mastered.size;

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                Card {currentIndex + 1} of {flashcards.length}
              </span>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {masteredCount} mastered
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Flashcard */}
      <div
        className="h-64 cursor-pointer perspective"
        onClick={() => setIsFlipped(!isFlipped)}
        style={{
          perspective: "1000px",
        }}
      >
        <div
          className="relative w-full h-full transition-transform duration-500"
          style={{
            transformStyle: "preserve-3d",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Front of card */}
          <Card
            className="absolute w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-2 border-blue-200 dark:border-blue-800"
            style={{
              backfaceVisibility: "hidden",
            }}
          >
            <CardContent className="text-center p-8">
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 uppercase tracking-wide">
                Question
              </p>
              <p className="text-xl font-semibold text-slate-900 dark:text-white">
                {currentCard.question}
              </p>
              <p className="text-xs text-slate-500 mt-6">Click to reveal answer</p>
            </CardContent>
          </Card>

          {/* Back of card */}
          <Card
            className="absolute w-full h-full flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-2 border-green-200 dark:border-green-800"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <CardContent className="text-center p-8">
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 uppercase tracking-wide">
                Answer
              </p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">
                {currentCard.answer}
              </p>
              {currentCard.type === "multiple_choice" && currentCard.options && (
                <div className="mt-4 text-xs text-slate-600 dark:text-slate-400">
                  <p className="font-medium mb-2">Options:</p>
                  <p>{currentCard.options}</p>
                </div>
              )}
              <p className="text-xs text-slate-500 mt-6">Click to see question</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Card Type Badge */}
      <div className="flex justify-center">
        <Badge variant="outline" className="capitalize">
          {currentCard.type.replace(/_/g, " ")}
        </Badge>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        <Button
          onClick={handlePrev}
          variant="outline"
          size="icon"
          disabled={flashcards.length <= 1}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleMastered}
            variant={mastered.has(currentCard.id) ? "default" : "outline"}
            className="flex-1"
          >
            {mastered.has(currentCard.id) ? "✓ Mastered" : "Mark as Mastered"}
          </Button>

          <Button
            onClick={handleShuffle}
            variant="outline"
            size="icon"
            title="Shuffle cards"
          >
            <RotateCw className="w-4 h-4" />
          </Button>
        </div>

        <Button
          onClick={handleNext}
          variant="outline"
          size="icon"
          disabled={flashcards.length <= 1}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Summary */}
      {masteredCount === flashcards.length && flashcards.length > 0 && (
        <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <p className="text-center text-green-700 dark:text-green-300 font-semibold">
              🎉 Great job! You've mastered all {flashcards.length} flashcards!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
