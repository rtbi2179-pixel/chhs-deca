import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface CreditScoreData {
  date: string;
  score: number;
  change: number;
}

interface CreditScoreChartProps {
  data: CreditScoreData[];
  isLoading?: boolean;
  currentScore?: number;
  refreshSchedule?: {
    lastRunAt?: Date | string | null;
    nextRunAt?: Date | string | null;
  };
}

function formatScheduleTime(value: Date | string | null | undefined) {
  if (!value) return 'Not recorded yet';
  return new Date(value).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
}

export function CreditScoreChart({ data, isLoading = false, currentScore, refreshSchedule }: CreditScoreChartProps) {
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Credit Score History</CardTitle>
          <CardDescription>Your credit score over time</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-80">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Credit Score History</CardTitle>
          <CardDescription>Your credit score over time</CardDescription>
          {currentScore !== undefined && <div className="mt-2 text-2xl font-bold text-blue-600">Current Score: {currentScore}</div>}
        </CardHeader>
        <CardContent className="space-y-3 py-10 text-gray-500">
          <p>No credit score history available yet</p>
          {refreshSchedule && <p className="text-xs leading-5 text-gray-500">Updates once daily. Next update: {formatScheduleTime(refreshSchedule.nextRunAt)}. Last update: {formatScheduleTime(refreshSchedule.lastRunAt)}.</p>}
        </CardContent>
      </Card>
    );
  }

  const minScore = Math.min(...data.map(d => d.score)) - 20;
  const maxScore = Math.max(...data.map(d => d.score)) + 20;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Credit Score History</CardTitle>
        <CardDescription>Your credit score over the last 30 days</CardDescription>
        {currentScore && (
          <div className="mt-2 text-2xl font-bold text-blue-600">
            Current Score: {currentScore}
          </div>
        )}
        {refreshSchedule && <p className="mt-3 text-xs leading-5 text-muted-foreground">Updates once daily. Next update: {formatScheduleTime(refreshSchedule.nextRunAt)}. Last update: {formatScheduleTime(refreshSchedule.lastRunAt)}.</p>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="date" 
              stroke="#888"
              tick={{ fill: '#888' }}
            />
            <YAxis 
              domain={[minScore, maxScore]}
              stroke="#888"
              tick={{ fill: '#888' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1a1a1a', 
                border: '1px solid #444',
                borderRadius: '8px'
              }}
              formatter={(value: number) => [`${value}`, 'Score']}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="score" 
              stroke="#3b82f6" 
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
              strokeWidth={2}
              name="Credit Score"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
