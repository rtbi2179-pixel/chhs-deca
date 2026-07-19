import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface PortfolioData {
  date: string;
  value: number;
  gain: number;
}

interface PortfolioChartProps {
  data: PortfolioData[];
  isLoading?: boolean;
  currentValue?: number;
  totalGain?: number;
}

export function PortfolioChart({ data, isLoading = false, currentValue, totalGain }: PortfolioChartProps) {
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Portfolio Performance</CardTitle>
          <CardDescription>Your stock portfolio value over time</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-80">
          <Loader2 className="w-8 h-8 animate-spin text-green-500" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Portfolio Performance</CardTitle>
          <CardDescription>Your stock portfolio value over time</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-80 text-gray-500">
          No portfolio data available yet
        </CardContent>
      </Card>
    );
  }

  const minValue = Math.min(...data.map(d => d.value)) * 0.95;
  const maxValue = Math.max(...data.map(d => d.value)) * 1.05;
  const gainColor = totalGain && totalGain >= 0 ? '#10b981' : '#ef4444';

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Portfolio Performance</CardTitle>
        <CardDescription>Your stock portfolio value over time</CardDescription>
        <div className="mt-4 grid grid-cols-2 gap-4">
          {currentValue && (
            <div>
              <div className="text-sm text-gray-400">Current Value</div>
              <div className="text-2xl font-bold text-green-500">
                ${parseFloat(currentValue.toString()).toFixed(2)}
              </div>
            </div>
          )}
          {totalGain !== undefined && (
            <div>
              <div className="text-sm text-gray-400">Total Gain</div>
              <div className="text-2xl font-bold" style={{ color: gainColor }}>
                {totalGain >= 0 ? '+' : ''}{parseFloat(totalGain.toString()).toFixed(2)}%
              </div>
            </div>
          )}
        </div>
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
              domain={[minValue, maxValue]}
              stroke="#888"
              tick={{ fill: '#888' }}
              label={{ value: 'Blue Bucks', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1a1a1a', 
                border: '1px solid #444',
                borderRadius: '8px'
              }}
              formatter={(value: number) => [`$${parseFloat(value.toString()).toFixed(2)}`, 'Value']}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#10b981" 
              dot={{ fill: '#10b981', r: 4 }}
              activeDot={{ r: 6 }}
              strokeWidth={2}
              name="Portfolio Value"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
