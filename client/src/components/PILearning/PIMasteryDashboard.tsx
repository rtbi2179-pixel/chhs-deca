import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, TrendingUp, Award, Target, Zap } from "lucide-react";

export default function PIMasteryDashboard() {
  const { data: dashboard, isLoading } = trpc.piLearning.getUserMasteryDashboard.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!dashboard) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-slate-600 dark:text-slate-400">
            No mastery data available yet. Start studying to see your progress!
          </p>
        </CardContent>
      </Card>
    );
  }

  const getClusterColor = (index: number) => {
    const colors = [
      "from-blue-500 to-blue-600",
      "from-purple-500 to-purple-600",
      "from-green-500 to-green-600",
      "from-orange-500 to-orange-600",
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-6">
      {/* Overall Mastery Card */}
      <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Overall Mastery</CardTitle>
              <CardDescription>Your progress across all clusters</CardDescription>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-600" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold text-blue-600">{dashboard.overallMastery}%</span>
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {dashboard.totalModulesCompleted} modules completed
            </span>
          </div>
          <Progress value={dashboard.overallMastery} className="h-3" />
        </CardContent>
      </Card>

      {/* Cluster Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {dashboard.clusterStats.map((cluster, index) => (
          <Card key={cluster.cluster} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">{cluster.cluster}</CardTitle>
                <Badge variant="outline" className="text-xs">
                  {cluster.completedModules}/{cluster.totalModules}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Mastery Score */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-600 dark:text-slate-400">Average Mastery</span>
                  <span className="font-bold text-lg">{cluster.averageMastery}%</span>
                </div>
                <Progress value={cluster.averageMastery} className="h-2" />
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                {cluster.averageMastery >= 80 ? (
                  <>
                    <Award className="w-4 h-4 text-green-600" />
                    <span className="text-xs font-medium text-green-600">Mastered</span>
                  </>
                ) : cluster.averageMastery >= 50 ? (
                  <>
                    <Zap className="w-4 h-4 text-yellow-600" />
                    <span className="text-xs font-medium text-yellow-600">In Progress</span>
                  </>
                ) : (
                  <>
                    <Target className="w-4 h-4 text-red-600" />
                    <span className="text-xs font-medium text-red-600">Needs Review</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recently Reviewed Modules */}
      {dashboard.recentlyReviewed.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recently Reviewed</CardTitle>
            <CardDescription>Modules you've studied recently</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboard.recentlyReviewed.map((module) => (
                <div key={module.moduleId} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
                  <div className="flex-1">
                    <p className="text-sm font-medium">Module {module.moduleId}</p>
                    <p className="text-xs text-slate-500">
                      Last reviewed {new Date(module.lastReviewedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-600">{module.masteryScore}%</p>
                    <Badge
                      variant="outline"
                      className="text-xs"
                    >
                      {module.reviewStatus}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Learning Tips */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-base">💡 Learning Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
            <li>• Use flashcards to memorize key terms and definitions</li>
            <li>• Take quizzes to test your understanding</li>
            <li>• Practice scenario challenges to apply knowledge</li>
            <li>• Review modules marked as "Needs Review" regularly</li>
            <li>• Aim for 80%+ mastery on each module</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
