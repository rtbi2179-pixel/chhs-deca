import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, BookOpen, Award } from "lucide-react";

interface PIModuleBrowserProps {
  onSelectModule: (moduleId: number) => void;
}

const CLUSTERS = [
  "Marketing",
  "Finance",
  "Business Management & Administration",
  "Hospitality & Tourism",
  "Business Administration Core",
  "Entrepreneurship",
  "Personal Financial Literacy",
] as const;
type PICluster = (typeof CLUSTERS)[number];

export default function PIModuleBrowser({ onSelectModule }: PIModuleBrowserProps) {
  const [selectedCluster, setSelectedCluster] = useState<PICluster>("Marketing");

  const { data: modules, isLoading } = trpc.piLearning.getModulesByCluster.useQuery({
    cluster: selectedCluster,
  });

  const { data: userProgress } = trpc.piLearning.getUserClusterProgress.useQuery({
    cluster: selectedCluster,
  });

  const getMasteryColor = (score: number | undefined) => {
    if (!score) return "bg-slate-100 text-slate-700";
    if (score >= 80) return "bg-green-100 text-green-700";
    if (score >= 50) return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  };

  const getMasteryLabel = (score: number | undefined) => {
    if (!score) return "Not Started";
    if (score >= 80) return "Mastered";
    if (score >= 50) return "In Progress";
    return "Needs Review";
  };

  const getUserProgress = (moduleId: number) => {
    return userProgress?.find((p) => p.moduleId === moduleId);
  };

  return (
    <div className="space-y-6">
      {/* Cluster Tabs */}
      <Tabs value={selectedCluster} onValueChange={(cluster) => setSelectedCluster(cluster as PICluster)} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
          {CLUSTERS.map((cluster) => (
            <TabsTrigger key={cluster} value={cluster} className="text-xs sm:text-sm">
              {cluster.split(" ")[0]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Modules Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : modules && modules.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((module) => {
            const progress = getUserProgress(module.id);
            const masteryScore = progress?.masteryScore || 0;

            return (
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
                  {/* Mastery Score */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Mastery</span>
                      <span className="font-semibold">{masteryScore}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${masteryScore}%` }}
                      />
                    </div>
                    <Badge className={`w-full text-center justify-center ${getMasteryColor(masteryScore)}`}>
                      {getMasteryLabel(masteryScore)}
                    </Badge>
                  </div>

                  {/* PI ID */}
                  <div className="text-xs text-slate-500">
                    <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                      {module.piId}
                    </span>
                  </div>

                  {/* Action Button */}
                  <Button
                    onClick={() => onSelectModule(module.id)}
                    className="w-full mt-2"
                    variant={masteryScore >= 80 ? "outline" : "default"}
                  >
                    {masteryScore >= 80 ? "Review" : "Study"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
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

      {/* Cluster Stats */}
      {modules && modules.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-lg">Cluster Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Modules</p>
                <p className="text-2xl font-bold">{modules.length}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Completed</p>
                <p className="text-2xl font-bold">
                  {userProgress?.filter((p) => p.masteryScore >= 80).length || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Avg Mastery</p>
                <p className="text-2xl font-bold">
                  {userProgress && userProgress.length > 0
                    ? Math.round(
                        userProgress.reduce((sum, p) => sum + p.masteryScore, 0) / userProgress.length
                      )
                    : 0}
                  %
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
