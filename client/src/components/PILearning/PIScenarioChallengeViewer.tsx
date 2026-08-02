import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, ChevronRight, Send } from "lucide-react";

interface ScenarioChallenge {
  id: number;
  title: string;
  scenarioText: string;
  difficulty: "easy" | "medium" | "hard";
  expectedResponse?: string;
}

interface PIScenarioChallengeViewerProps {
  scenarios: ScenarioChallenge[];
  sectionId: number;
}

export default function PIScenarioChallengeViewer({
  scenarios,
  sectionId,
}: PIScenarioChallengeViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userResponse, setUserResponse] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState("");

  const currentScenario = scenarios[currentIndex];

  const handleNext = () => {
    if (currentIndex < scenarios.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setUserResponse("");
      setSubmitted(false);
      setFeedback("");
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setUserResponse("");
      setSubmitted(false);
      setFeedback("");
    }
  };

  const handleSubmit = async () => {
    if (!userResponse.trim()) {
      setFeedback("Please provide a response before submitting.");
      return;
    }

    setSubmitted(true);

    // Simulate AI feedback generation
    // In a real app, this would call an AI service
    const mockFeedback = `Your response shows understanding of the scenario. 
    
Key points you addressed:
- ${userResponse.substring(0, 50)}...

Areas for improvement:
- Consider the broader business implications
- Think about stakeholder perspectives
- Provide more specific examples

Expected response elements:
${currentScenario.expectedResponse || "No expected response available"}`;

    setFeedback(mockFeedback);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
      case "medium":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";
      case "hard":
        return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                Scenario {currentIndex + 1} of {scenarios.length}
              </span>
              <Badge className={getDifficultyColor(currentScenario.difficulty)}>
                {currentScenario.difficulty.toUpperCase()}
              </Badge>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all"
                style={{ width: `${((currentIndex + 1) / scenarios.length) * 100}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scenario Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{currentScenario.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
              {currentScenario.scenarioText}
            </p>
          </div>

          <div className="space-y-3">
            <label htmlFor="response" className="block text-sm font-semibold">
              Your Response
            </label>
            <Textarea
              id="response"
              placeholder="Provide your detailed response to this scenario..."
              value={userResponse}
              onChange={(e) => setUserResponse(e.target.value)}
              disabled={submitted}
              className="min-h-32 resize-none"
            />
            <p className="text-xs text-slate-500">
              {userResponse.length} characters
            </p>
          </div>

          {!submitted && (
            <Button
              onClick={handleSubmit}
              disabled={!userResponse.trim()}
              className="w-full"
            >
              <Send className="w-4 h-4 mr-2" />
              Submit Response
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Feedback Card */}
      {submitted && feedback && (
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-base">🤖 AI Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
              {feedback}
            </p>

            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Next Steps:
              </p>
              <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                <li>• Review the feedback and consider how to improve</li>
                <li>• Try the scenario again with a revised approach</li>
                <li>• Move to the next scenario when ready</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

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

        <div className="flex-1 text-center">
          {submitted && (
            <Button
              onClick={() => {
                setUserResponse("");
                setSubmitted(false);
                setFeedback("");
              }}
              variant="outline"
              className="w-full"
            >
              Try Again
            </Button>
          )}
        </div>

        <Button
          onClick={handleNext}
          variant="outline"
          size="icon"
          disabled={currentIndex === scenarios.length - 1}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Completion Message */}
      {currentIndex === scenarios.length - 1 && submitted && (
        <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <p className="text-center text-green-700 dark:text-green-300 font-semibold">
              ✅ You've completed all scenario challenges! Great work!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
