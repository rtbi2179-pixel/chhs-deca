import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Award, Trophy, Target, Zap, Star, Crown, UsersRound } from "lucide-react";
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
      <div className="page-shell flex min-h-screen items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-foreground">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell leaderboard-page p-8">
      <div className="max-w-6xl mx-auto">
        <div className="leaderboard-hero">
          <div><p className="page-eyebrow">Performance board</p><h1 className="page-title mt-2">DECA Leaderboard</h1><p className="page-intro mt-3">Top performers in DECA practice questions, ranked from live practice records.</p></div>
          <div className="leaderboard-hero-status"><div className="flex items-center gap-2"><UsersRound className="h-4 w-4 text-blue-200" /><p className="data-label">Active board</p></div><p className="mt-1 text-lg font-semibold text-white">{currentData?.length ?? 0} members</p><p className="mt-1 text-xs text-slate-400">Select a cluster to narrow the view.</p></div>
        </div>

        {/* Personal Stats Card */}
        {user && userStats && (
          <Card className="editorial-panel leaderboard-section-card p-6 mb-8 border border-blue-500/30">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Rank */}
              <div className="leaderboard-metric flex flex-col items-center justify-center p-4 rounded-lg">
                <div className="banking-metric-value text-blue-400 mb-2">#{userRank + 1}</div>
                <div className="data-label">Your Rank</div>
              </div>

              {/* Accuracy */}
              <div className="leaderboard-metric flex flex-col items-center justify-center p-4 rounded-lg">
                <div className="banking-metric-value text-green-400 mb-2">{userStats.leaderboard.accuracyPercentage}%</div>
                <div className="data-label">Accuracy</div>
              </div>

              {/* Questions Answered */}
              <div className="leaderboard-metric flex flex-col items-center justify-center p-4 rounded-lg">
                <div className="banking-metric-value text-purple-400 mb-2">{userStats.leaderboard.totalQuestionsAnswered}</div>
                <div className="data-label">Questions</div>
              </div>

              {/* Comparison to Top */}
              <div className="leaderboard-metric flex flex-col items-center justify-center p-4 rounded-lg">
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
        <Card className="editorial-panel leaderboard-section-card p-6 mb-8">
          <label className="data-label block text-blue-200 mb-4">Filter by Cluster</label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {clusters.map((cluster) => (
              <button
                key={cluster.value}
                onClick={() => setSelectedCluster(cluster.value)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedCluster === cluster.value
                    ? "editorial-tab editorial-tab-active"
                    : "editorial-tab bg-white/[0.025]"
                }`}
              >
                {cluster.label}
              </button>
            ))}
          </div>
        </Card>

        {/* Leaderboard Table */}
        <Card className="editorial-panel leaderboard-table-shell">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-blue-600/10 border-b border-border">
                  <th className="px-6 py-4 text-left text-foreground">Rank</th>
                  <th className="px-6 py-4 text-left text-foreground">Student Name</th>
                  <th className="px-6 py-4 text-left text-foreground">Accuracy</th>
                  <th className="px-6 py-4 text-left text-foreground">Questions Answered</th>
                  <th className="px-6 py-4 text-left text-foreground">Correct Answers</th>
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
        <Card className="editorial-panel leaderboard-section-card mt-8 p-6">
          <div className="flex items-center gap-2"><Crown className="h-5 w-5 text-blue-300" /><h3 className="section-heading">How the Leaderboard Works</h3></div>
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
