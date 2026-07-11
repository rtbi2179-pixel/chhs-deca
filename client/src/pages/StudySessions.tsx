import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, BookmarkIcon, Play } from "lucide-react";

export default function StudySessions() {
  const { user, isAuthenticated } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [sessionName, setSessionName] = useState("");

  const { data: bookmarkedQuestions, isLoading: isLoadingBookmarks } =
    trpc.practice.getBookmarkedQuestions.useQuery(undefined, {
      enabled: isAuthenticated && !!user,
    });

  const createSessionMutation = trpc.practice.createStudySession.useMutation({
    onSuccess: () => {
      setSessionName("");
      setIsCreating(false);
      // Refetch sessions
    },
  });

  const handleCreateSession = async () => {
    if (!sessionName.trim() || !bookmarkedQuestions || bookmarkedQuestions.length === 0) {
      return;
    }

    try {
      await createSessionMutation.mutateAsync({
        name: sessionName,
        questionIds: bookmarkedQuestions.map((q: any) => q.id),
      });
    } catch (error) {
      console.error("Failed to create study session", error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-foreground mb-4">Please log in to create study sessions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container max-w-4xl">
        <h1 className="text-4xl font-bold text-foreground mb-2">Study Sessions</h1>
        <p className="text-foreground/70 mb-8">
          Create custom quizzes from your bookmarked questions
        </p>

        {/* Create New Session */}
        <Card className="p-6 mb-8 border-border bg-card">
          <h2 className="text-xl font-semibold text-card-foreground mb-4">
            Create New Study Session
          </h2>

          {isLoadingBookmarks ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : bookmarkedQuestions && bookmarkedQuestions.length > 0 ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Session Name
                </label>
                <input
                  type="text"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  placeholder="e.g., Marketing Cluster Review"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-foreground/70">
                  {bookmarkedQuestions.length} bookmarked questions will be included
                </p>
                <Button
                  onClick={handleCreateSession}
                  disabled={!sessionName.trim() || createSessionMutation.isPending}
                  className="bg-primary hover:bg-primary/90"
                >
                  {createSessionMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <BookmarkIcon className="w-4 h-4 mr-2" />
                      Create Session
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-foreground/70">
                No bookmarked questions yet. Start bookmarking questions in the Practice section!
              </p>
            </div>
          )}
        </Card>

        {/* Active Sessions */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">Your Study Sessions</h2>
          {sessions.length === 0 ? (
            <Card className="p-8 text-center border-border bg-card">
              <p className="text-foreground/70">
                No study sessions yet. Create one from your bookmarked questions above!
              </p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {sessions.map((session: any) => (
                <Card
                  key={session.id}
                  className="p-6 border-border bg-card hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-card-foreground">
                        {session.name}
                      </h3>
                      <p className="text-sm text-foreground/70">
                        {session.questionCount} questions
                      </p>
                    </div>
                    <Button
                      className="bg-primary hover:bg-primary/90"
                      onClick={() => {
                        // Navigate to study session
                      }}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
