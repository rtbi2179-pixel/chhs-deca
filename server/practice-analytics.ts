/**
 * Practice System Analytics
 * Provides performance tracking and recommendations for practice questions
 */

import { z } from 'zod';
import { protectedProcedure, router } from './_core/trpc';
import { TRPCError } from '@trpc/server';
import { eq, desc } from 'drizzle-orm';

export const practiceAnalyticsRouter = router({
  /**
   * Get performance analytics by cluster
   * Returns: accuracy rate, average time, difficulty progression
   */
  getClusterAnalytics: protectedProcedure
    .input(z.object({ cluster: z.string().optional() }))
    .query(async ({ ctx }) => {
      const { getDb } = await import('./db');
      const database = await getDb();
      if (!database) return [];

      // Fetch user's practice answers grouped by cluster
      // Note: practiceAnswers table structure varies by school
      // This is a placeholder for the analytics structure
      const answers: any[] = [];

      // Group by cluster and calculate metrics
      const clusterMetrics: Record<string, any> = {};
      
      answers.forEach((answer: any) => {
        const cluster = answer.cluster || 'Unknown';
        if (!clusterMetrics[cluster]) {
          clusterMetrics[cluster] = {
            cluster,
            totalAttempts: 0,
            correctAnswers: 0,
            totalTime: 0,
            questions: [],
          };
        }
        
        clusterMetrics[cluster].totalAttempts += 1;
        if (answer.isCorrect) {
          clusterMetrics[cluster].correctAnswers += 1;
        }
        clusterMetrics[cluster].totalTime += answer.timeSpent || 0;
        clusterMetrics[cluster].questions.push({
          questionId: answer.questionId,
          isCorrect: answer.isCorrect,
          timeSpent: answer.timeSpent,
        });
      });

      // Calculate accuracy and averages
      return Object.values(clusterMetrics).map((metric: any) => ({
        cluster: metric.cluster,
        accuracy: metric.totalAttempts > 0 
          ? ((metric.correctAnswers / metric.totalAttempts) * 100).toFixed(1)
          : 0,
        totalAttempts: metric.totalAttempts,
        correctAnswers: metric.correctAnswers,
        avgTimePerQuestion: metric.totalAttempts > 0
          ? (metric.totalTime / metric.totalAttempts).toFixed(1)
          : 0,
        trend: calculateTrend(metric.questions),
      }));
    }),

  /**
   * Get difficulty progression recommendations
   * Analyzes performance and suggests next difficulty level
   */
  getDifficultyRecommendations: protectedProcedure.query(async ({ ctx }) => {
    const { getDb } = await import('./db');
    const database = await getDb();
    if (!database) return [];

    // Placeholder for difficulty recommendations
    const answers: any[] = [];

    // Group by difficulty and calculate accuracy
    const difficultyStats: Record<string, any> = {
      easy: { attempts: 0, correct: 0 },
      medium: { attempts: 0, correct: 0 },
      hard: { attempts: 0, correct: 0 },
    };

    answers.forEach((answer: any) => {
      const difficulty = answer.difficulty || 'medium';
      if (difficultyStats[difficulty]) {
        difficultyStats[difficulty].attempts += 1;
        if (answer.isCorrect) {
          difficultyStats[difficulty].correct += 1;
        }
      }
    });

    // Generate recommendations
    const recommendations = [];
    
    if (difficultyStats.easy.attempts > 0) {
      const easyAccuracy = (difficultyStats.easy.correct / difficultyStats.easy.attempts) * 100;
      if (easyAccuracy > 80) {
        recommendations.push({
          level: 'medium',
          reason: 'You are mastering easy questions. Try medium difficulty!',
          confidence: 'high',
        });
      }
    }

    if (difficultyStats.medium.attempts > 0) {
      const mediumAccuracy = (difficultyStats.medium.correct / difficultyStats.medium.attempts) * 100;
      if (mediumAccuracy > 75) {
        recommendations.push({
          level: 'hard',
          reason: 'You are doing well on medium questions. Challenge yourself with hard!',
          confidence: 'high',
        });
      } else if (mediumAccuracy < 40) {
        recommendations.push({
          level: 'easy',
          reason: 'Focus on easy questions to build confidence.',
          confidence: 'medium',
        });
      }
    }

    return recommendations;
  }),

  /**
   * Get personalized study path recommendations
   * Recommends which clusters/topics to focus on based on performance
   */
  getStudyPathRecommendations: protectedProcedure.query(async ({ ctx }) => {
    const { getDb } = await import('./db');
    const database = await getDb();
    if (!database) return [];

    // Placeholder for study path recommendations
    const answers: any[] = [];

    // Analyze performance by cluster
    const clusterPerformance: Record<string, any> = {};

    answers.forEach((answer: any) => {
      const cluster = answer.cluster || 'Unknown';
      if (!clusterPerformance[cluster]) {
        clusterPerformance[cluster] = {
          cluster,
          attempts: 0,
          correct: 0,
          lastAttempt: answer.answeredAt,
        };
      }
      clusterPerformance[cluster].attempts += 1;
      if (answer.isCorrect) {
        clusterPerformance[cluster].correct += 1;
      }
      clusterPerformance[cluster].lastAttempt = new Date(answer.answeredAt) > 
        new Date(clusterPerformance[cluster].lastAttempt)
        ? answer.answeredAt
        : clusterPerformance[cluster].lastAttempt;
    });

    // Rank clusters by accuracy
    const rankedClusters = Object.values(clusterPerformance)
      .map((cluster: any) => ({
        ...cluster,
        accuracy: cluster.attempts > 0 
          ? ((cluster.correct / cluster.attempts) * 100).toFixed(1)
          : 0,
      }))
      .sort((a: any, b: any) => parseFloat(a.accuracy) - parseFloat(b.accuracy));

    // Generate study path
    const studyPath: any[] = [];
    
    // Focus on weakest areas first
    rankedClusters.slice(0, 3).forEach((cluster: any) => {
      studyPath.push({
        cluster: cluster.cluster,
        priority: 'high',
        reason: `Your accuracy in ${cluster.cluster} is ${cluster.accuracy}%. Focus here first.`,
        suggestedQuestions: 5,
      });
    });

    // Then maintain strong areas
    rankedClusters.slice(-2).forEach((cluster: any) => {
      studyPath.push({
        cluster: cluster.cluster,
        priority: 'low',
        reason: `You are strong in ${cluster.cluster}. Maintain with 2-3 questions weekly.`,
        suggestedQuestions: 2,
      });
    });

    return studyPath;
  }),

  /**
   * Get performance trend (improving, stable, declining)
   */
  getPerformanceTrend: protectedProcedure.query(async ({ ctx }) => {
    const { getDb } = await import('./db');
    const database = await getDb();
    if (!database) return { trend: 'stable', change: 0 };

    // Placeholder for performance trend
    const answers: any[] = [];

    // Return placeholder trend data
    return {
      trend: 'stable',
      change: 0,
      recentAccuracy: 75,
      olderAccuracy: 75,
    };
  }),
});

/**
 * Helper function to calculate trend from question attempts
 */
function calculateTrend(questions: any[]): string {
  if (questions.length < 5) return 'insufficient_data';
  
  const recent = questions.slice(-5);
  const older = questions.slice(0, 5);
  
  const recentCorrect = recent.filter(q => q.isCorrect).length;
  const olderCorrect = older.filter(q => q.isCorrect).length;
  
  if (recentCorrect > olderCorrect + 1) return 'improving';
  if (recentCorrect < olderCorrect - 1) return 'declining';
  return 'stable';
}
