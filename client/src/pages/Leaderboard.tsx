import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Award, Trophy, Target, Zap, Star } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Leaderboard() {
  const { user } = useAuth();
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

  // Find current user's stats
  const userStats = currentData?.find((entry: any) => {
    const userObj = 'user' in entry ? entry.user : entry.users;
    return userObj?.id === user?.id;
  });
  const userRank = currentData?.findIndex((entry: any) => {
    const userObj = 'user' in entry ? entry.user : entry.users;
    return userObj?.id === user?.id;
  }) ?? -1;
  const topPerformer = currentData?.[0];

  // Calculate achievements
  const getAchievements = () => {
    if (!userStats) return [];
    const achievements = [];
    const accuracy = userStats.leaderboard.accuracyPercentage;
    const questionsAnswered = userStats.leaderboard.totalQuestionsAnswered;

    if (accuracy === 100) {
      achievements.push({ id: 'perfect', name: '100% Accuracy', icon: Target, color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' });
    }
    if (questionsAnswered >= 1000) {
      achievements.push({ id: 'thousand', name: '1000 Questions', icon: Zap, color: 'text-purple-400', bgColor: 'bg-purple-500/20' });
    }
    if (questionsAnswered >= 500) {
      achievements.push({ id: 'fivehundred', name: '500 Questions', icon: Star, color: 'text-blue-400', bgColor: 'bg-blue-500/20' });
    }
    if (accuracy >= 95) {
      achievements.push({ id: 'excellent', name: '95%+ Accuracy', icon: Trophy, color: 'text-orange-400', bgColor: 'bg-orange-500/20' });
    }
    if (userRank === 0) {
      achievements.push({ id: 'champion', name: 'Top Performer', icon: Award, color: 'text-red-400', bgColor: 'bg-red-500/20' });
    }

    return achievements;
  };

  const achievements = getAchievements();

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
        <div className="mb-12 pt-6">
          <h1 className="text-4xl font-bold text-foreground mb-3">DECA Leaderboard</h1>
          <p className="text-foreground/70">Top performers in DECA practice questions</p>
        </div>

        {/* Personal Stats Card */}
        {user && userStats && (
          <Card className="p-8 mb-12 border border-blue-500/30 bg-gradient-to-r from-blue-600/10 to-cyan-600/10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Rank */}
              <div className="flex flex-col items-center justify-center p-6 rounded-lg bg-background/50 border border-border">
                <div className="text-3xl font-bold text-blue-400 mb-2">#{userRank + 1}</div>
                <div className="text-sm text-foreground/70">Your Rank</div>
              </div>

              {/* Accuracy */}
              <div className="flex flex-col items-center justify-center p-6 rounded-lg bg-background/50 border border-border">
                <div className="text-3xl font-bold text-green-400 mb-2">{userStats.leaderboard.accuracyPercentage}%</div>
                <div className="text-sm text-foreground/70">Accuracy</div>
              </div>

              {/* Questions Answered */}
              <div className="flex flex-col items-center justify-center p-6 rounded-lg bg-background/50 border border-border">
                <div className="text-3xl font-bold text-purple-400 mb-2">{userStats.leaderboard.totalQuestionsAnswered}</div>
                <div className="text-sm text-foreground/70">Questions</div>
              </div>

              {/* Comparison to Top */}
              <div className="flex flex-col items-center justify-center p-6 rounded-lg bg-background/50 border border-border">
                {topPerformer && (() => {
                  const topUserObj = 'user' in topPerformer ? topPerformer.user : (topPerformer as any).users;
                  return topUserObj?.id !== user?.id;
                })() ? (
                  <>
                    <div className="text-sm text-foreground/70 mb-2">vs Top Performer</div>
                    <div className="text-lg font-semibold text-yellow-400">
                      {Math.abs((userStats?.leaderboard?.accuracyPercentage || 0) - (topPerformer?.leaderboard?.accuracyPercentage || 0)).toFixed(1)}%
                    </div>
                    <div className="text-xs text-foreground/50 mt-1">
                      {(userStats?.leaderboard?.accuracyPercentage || 0) > (topPerformer?.leaderboard?.accuracyPercentage || 0) ? '↑ Ahead' : '↓ Behind'}
                    </div>
                  </>
                ) : (
                  <>
                    <Trophy className="w-6 h-6 text-yellow-400 mb-2" />
                    <div className="text-sm text-yellow-400 font-semibold">You're #1!</div>
                  </>
                )}
              </div>
            </div>

            {/* Achievements */}
            {achievements.length > 0 && (
              <div className="mt-6 pt-6 border-t border-border">
                <div className="text-sm font-semibold text-foreground mb-3">🏆 Achievements</div>
                <div className="flex flex-wrap gap-2">
                  {achievements.map((achievement) => {
                    const Icon = achievement.icon;
                    return (
                      <div
                        key={achievement.id}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg ${achievement.bgColor} border border-border`}
                      >
                        <Icon className={`w-4 h-4 ${achievement.color}`} />
                        <span className={`text-xs font-semibold ${achievement.color}`}>{achievement.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        )}

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
                      className={`border-b border-border hover:bg-blue-600/5 transition-colors ${
                        (() => {
                          const userObj = 'user' in entry ? entry.user : entry.users;
                          return userObj?.id === user?.id ? 'bg-blue-600/10' : '';
                        })()
                      }`}
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
                      <td className="px-6 py-4 text-foreground">
                        {(() => {
                          const userObj = 'user' in entry ? entry.user : entry.users;
                          return (
                            <>
                              {userObj?.name || userObj?.username || "Anonymous"}
                              {userObj?.id === user?.id && <span className="ml-2 text-blue-400 text-xs font-semibold">(You)</span>}
                            </>
                          );
                        })()}
                      </td>
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
            <li>• Unlock achievements by reaching milestones: 100% Accuracy, 500+ Questions, 1000+ Questions, 95%+ Accuracy, and Top Performer</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
