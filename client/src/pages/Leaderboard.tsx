import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function Leaderboard() {
  const [selectedCluster, setSelectedCluster] = useState<string>("all");

  // Fetch leaderboard data
  const { data: leaderboardData, isLoading } = trpc.practice.getLeaderboard.useQuery(
    { limit: 100 },
    { enabled: selectedCluster === "all" }
  );

  const { data: clusterLeaderboardData, isLoading: isClusterLoading } = trpc.practice.getLeaderboardByCluster.useQuery(
    { cluster: selectedCluster, limit: 100 },
    { enabled: selectedCluster !== "all" }
  );

  const clusters = [
    { value: "all", label: "Overall" },
    { value: "Marketing", label: "Marketing" },
    { value: "Business Management & Administration", label: "Business Management" },
    { value: "Finance", label: "Finance" },
    { value: "Hospitality & Tourism", label: "Hospitality & Tourism" },
  ];

  const currentData = selectedCluster === "all" ? leaderboardData : clusterLeaderboardData;
  const isCurrentLoading = selectedCluster === "all" ? isLoading : isClusterLoading;

  if (isCurrentLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-foreground">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">DECA Leaderboard</h1>
          <p className="text-foreground/70">Top performers in DECA practice questions</p>
        </div>

        {/* Cluster Filter */}
        <Card className="p-6 mb-8 border border-border">
          <label className="block text-foreground font-semibold mb-4">Filter by Cluster</label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {clusters.map((cluster) => (
              <button
                key={cluster.value}
                onClick={() => setSelectedCluster(cluster.value)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedCluster === cluster.value
                    ? "bg-blue-600 text-white"
                    : "bg-background border border-border text-foreground hover:bg-border"
                }`}
              >
                {cluster.label}
              </button>
            ))}
          </div>
        </Card>

        {/* Leaderboard Table */}
        <Card className="border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-blue-600/10 border-b border-border">
                  <th className="px-6 py-4 text-left text-foreground font-semibold">Rank</th>
                  <th className="px-6 py-4 text-left text-foreground font-semibold">Student Name</th>
                  <th className="px-6 py-4 text-left text-foreground font-semibold">Accuracy</th>
                  <th className="px-6 py-4 text-left text-foreground font-semibold">Questions Answered</th>
                  <th className="px-6 py-4 text-left text-foreground font-semibold">Correct Answers</th>
                </tr>
              </thead>
              <tbody>
                {currentData && currentData.length > 0 ? (
                  currentData.map((entry: any, index: number) => (
                    <tr
                      key={entry.leaderboard.id}
                      className="border-b border-border hover:bg-blue-600/5 transition-colors"
                    >
                      <td className="px-6 py-4 text-foreground font-semibold">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                          index === 0
                            ? "bg-yellow-600/20 text-yellow-400"
                            : index === 1
                            ? "bg-gray-400/20 text-gray-300"
                            : index === 2
                            ? "bg-orange-600/20 text-orange-400"
                            : "bg-background border border-border"
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-foreground">{entry.user.name || "Anonymous"}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-background border border-border rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${entry.leaderboard.accuracyPercentage}%` }}
                            ></div>
                          </div>
                          <span className="text-foreground font-semibold">
                            {entry.leaderboard.accuracyPercentage}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-foreground">
                        {entry.leaderboard.totalQuestionsAnswered}
                      </td>
                      <td className="px-6 py-4 text-foreground">
                        {entry.leaderboard.totalCorrectAnswers}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-foreground/70">
                      No leaderboard data available yet. Start practicing to appear on the leaderboard!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Info Box */}
        <Card className="mt-8 p-6 border border-border bg-blue-600/5">
          <h3 className="text-lg font-semibold text-foreground mb-2">How the Leaderboard Works</h3>
          <ul className="text-foreground/70 space-y-2">
            <li>• Your accuracy percentage is calculated from all practice questions you answer</li>
            <li>• The leaderboard updates automatically after you submit answers</li>
            <li>• Filter by cluster to see rankings for specific DECA categories</li>
            <li>• Your ranking is based on accuracy percentage and total questions answered</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
