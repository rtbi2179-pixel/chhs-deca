import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface CreditScoreData {
  date: string;
  periodStart?: string;
  periodEnd?: string;
  score: number;
  change: number;
  sampleCount?: number;
  reason?: string | null;
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
  if (!value) return "Not recorded yet";
  return new Date(value).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" });
}

function formatChange(value: number) {
  return `${value > 0 ? "+" : ""}${value}`;
}

export function CreditScoreChart({ data, isLoading = false, currentScore, refreshSchedule }: CreditScoreChartProps) {
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Credit Score Trend</CardTitle>
          <CardDescription>Weekly trend across the last 30 days</CardDescription>
        </CardHeader>
        <CardContent className="flex h-80 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Credit Score Trend</CardTitle>
          <CardDescription>Weekly trend across the last 30 days</CardDescription>
          {currentScore !== undefined && <div className="mt-2 text-2xl font-bold text-blue-600">Current Score: {currentScore}</div>}
        </CardHeader>
        <CardContent className="space-y-3 py-10 text-gray-500">
          <p>No monthly credit-score trend is available yet.</p>
          <p className="text-xs leading-5 text-gray-500">The score recalculates once daily. Once history is recorded, the chart groups the last 30 days into weekly periods.</p>
          {refreshSchedule && <p className="text-xs leading-5 text-gray-500">Next update: {formatScheduleTime(refreshSchedule.nextRunAt)}. Last update: {formatScheduleTime(refreshSchedule.lastRunAt)}.</p>}
        </CardContent>
      </Card>
    );
  }

  const minScore = Math.max(300, Math.min(...data.map((point) => point.score)) - 20);
  const maxScore = Math.min(850, Math.max(...data.map((point) => point.score)) + 20);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Credit Score Trend</CardTitle>
        <CardDescription>Last 30 days, grouped into weekly periods so the direction is easy to read.</CardDescription>
        {currentScore !== undefined && <div className="mt-2 text-2xl font-bold text-blue-600">Current Score: {currentScore}</div>}
        <p className="mt-3 text-xs leading-5 text-muted-foreground">Updates once daily. Next update: {formatScheduleTime(refreshSchedule?.nextRunAt)}. Last update: {formatScheduleTime(refreshSchedule?.lastRunAt)}.</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="date" stroke="#888" tick={{ fill: "#888" }} minTickGap={18} />
            <YAxis domain={[minScore, maxScore]} stroke="#888" tick={{ fill: "#888" }} />
            <Tooltip
              contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #444", borderRadius: "8px" }}
              formatter={(value: number, name: string, item) => {
                if (name === "Credit Score") return [`${value}`, name];
                if (name === "Period change") return [formatChange(value), name];
                return [value, name];
              }}
              labelFormatter={(label) => `Period: ${label}`}
            />
            <Legend />
            <Line type="monotone" dataKey="score" stroke="#3b82f6" dot={{ fill: "#3b82f6", r: 4 }} activeDot={{ r: 6 }} strokeWidth={2} name="Credit Score" />
            <Line type="monotone" dataKey="change" stroke="#34d399" dot={{ fill: "#34d399", r: 3 }} activeDot={{ r: 5 }} strokeWidth={1.5} name="Period change" />
          </LineChart>
        </ResponsiveContainer>
        <p className="mt-3 text-xs text-muted-foreground">Each point is the latest recorded score in that week; period change compares it with the prior weekly point.</p>
      </CardContent>
    </Card>
  );
}
