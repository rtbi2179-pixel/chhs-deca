import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Brain, Target, TrendingUp } from "lucide-react";
import PIModuleBrowser from "@/components/PILearning/PIModuleBrowser";
import PIMasteryDashboard from "@/components/PILearning/PIMasteryDashboard";
import PIModuleViewer from "@/components/PILearning/PIModuleViewer";

export default function PILearning() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Please Log In</CardTitle>
            <CardDescription>
              You need to be logged in to access the PI Learning Engine.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Brain className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
              PI Learning Engine
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            Master Performance Indicators across all DECA clusters
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Learning Clusters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4</div>
              <p className="text-xs text-slate-500 mt-1">Marketing, Finance, Business, Hospitality</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Interactive Sections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">7</div>
              <p className="text-xs text-slate-500 mt-1">Theory, Flashcards, Quizzes, & More</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Study Methods
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5+</div>
              <p className="text-xs text-slate-500 mt-1">Adaptive learning paths</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Spaced Repetition
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">✓</div>
              <p className="text-xs text-slate-500 mt-1">Optimize retention</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="browse" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Browse Modules</span>
            </TabsTrigger>
            <TabsTrigger value="study" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">Study</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <PIMasteryDashboard />
          </TabsContent>

          <TabsContent value="browse" className="space-y-6">
            <PIModuleBrowser onSelectModule={setSelectedModuleId} />
          </TabsContent>

          <TabsContent value="study" className="space-y-6">
            {selectedModuleId ? (
              <PIModuleViewer moduleId={selectedModuleId} />
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-slate-600 dark:text-slate-400">
                    Select a module from the "Browse Modules" tab to start studying.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
