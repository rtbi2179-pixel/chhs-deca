import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function PracticeDebug() {
  const [selectedCluster, setSelectedCluster] = useState("Marketing");
  
  const { data: questionsData, isLoading } = trpc.practice.getQuestions.useQuery({
    cluster: selectedCluster,
    difficulty: undefined,
    page: 1,
    pageSize: 1,
  });

  if (isLoading) return <div>Loading...</div>;

  const question = questionsData?.questions?.[0];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-6">Practice Debug</h1>
        
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-foreground mb-4">Question Data</h2>
          
          {question ? (
            <div className="space-y-4">
              <div className="bg-foreground/5 p-4 rounded">
                <p className="text-sm text-foreground/70 mb-1">ID:</p>
                <p className="text-foreground font-mono">{question.id}</p>
              </div>
              
              <div className="bg-foreground/5 p-4 rounded">
                <p className="text-sm text-foreground/70 mb-1">Stem:</p>
                <p className="text-foreground">{question.stem}</p>
              </div>
              
              <div className="bg-foreground/5 p-4 rounded">
                <p className="text-sm text-foreground/70 mb-1">Rationale:</p>
                <p className="text-foreground">{question.rationale || "NOT FOUND"}</p>
              </div>
              
              <div className="bg-foreground/5 p-4 rounded">
                <p className="text-sm text-foreground/70 mb-1">Distractor Rationale A:</p>
                <p className="text-foreground">{question.distractorRationaleA || "NOT FOUND"}</p>
              </div>
              
              <div className="bg-foreground/5 p-4 rounded">
                <p className="text-sm text-foreground/70 mb-1">Distractor Rationale B:</p>
                <p className="text-foreground">{question.distractorRationaleB || "NOT FOUND"}</p>
              </div>
              
              <div className="bg-foreground/5 p-4 rounded">
                <p className="text-sm text-foreground/70 mb-1">Distractor Rationale C:</p>
                <p className="text-foreground">{question.distractorRationaleC || "NOT FOUND"}</p>
              </div>
              
              <div className="bg-foreground/5 p-4 rounded">
                <p className="text-sm text-foreground/70 mb-1">Distractor Rationale D:</p>
                <p className="text-foreground">{question.distractorRationaleD || "NOT FOUND"}</p>
              </div>
              
              <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded">
                <p className="text-sm text-foreground/70 mb-2">Full Question Object:</p>
                <pre className="text-foreground text-xs overflow-auto max-h-96 bg-foreground/5 p-3 rounded">
                  {JSON.stringify(question, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <p className="text-foreground/70">No question data found</p>
          )}
        </div>
      </div>
    </div>
  );
}
