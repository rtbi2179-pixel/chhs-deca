import { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Settings, TrendingUp, DollarSign, Zap } from 'lucide-react';

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'credit' | 'cards' | 'rewards' | 'logs'>('overview');

  // Redirect if not super admin
  if (user?.role !== 'super_admin') {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-500">Access denied. Super admin privileges required.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="w-8 h-8 text-blue-500" />
            <h1 className="text-4xl font-bold text-foreground">Economic Management</h1>
          </div>
          <p className="text-foreground/70">Configure credit scoring, card tiers, and system economics</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 border-b border-border overflow-x-auto">
          {[
            { id: 'overview' as const, label: 'Overview', icon: TrendingUp },
            { id: 'credit' as const, label: 'Credit Score', icon: Zap },
            { id: 'cards' as const, label: 'Card Tiers', icon: DollarSign },
            { id: 'rewards' as const, label: 'Rewards', icon: TrendingUp },
            { id: 'logs' as const, label: 'Audit Logs', icon: AlertCircle },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-500'
                  : 'border-transparent text-foreground/60 hover:text-foreground'
              }`}
            >
              <tab.icon className="w-4 h-4 inline mr-2" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border border-border p-6 bg-card">
              <h3 className="text-lg font-bold text-foreground mb-4">System Status</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-foreground/70">Active Users</span>
                  <span className="font-bold text-foreground">--</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-foreground/70">Total Transactions</span>
                  <span className="font-bold text-foreground">--</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-foreground/70">System Inflation Rate</span>
                  <span className="font-bold text-foreground">0%</span>
                </div>
              </div>
            </Card>

            <Card className="border border-border p-6 bg-card">
              <h3 className="text-lg font-bold text-foreground mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  View Economic Audit Log
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Export System Report
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Reset Daily Metrics
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Credit Score Tab */}
        {activeTab === 'credit' && (
          <Card className="border border-border p-6 bg-card">
            <h3 className="text-lg font-bold text-foreground mb-6">Credit Score Configuration</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Payment Reliability Weight
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    defaultValue="25"
                    className="flex-1"
                  />
                  <span className="text-foreground font-bold w-12">25%</span>
                </div>
                <p className="text-xs text-foreground/60 mt-1">Influence of on-time payments on credit score</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Account History Weight
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    defaultValue="25"
                    className="flex-1"
                  />
                  <span className="text-foreground font-bold w-12">25%</span>
                </div>
                <p className="text-xs text-foreground/60 mt-1">Influence of account age on credit score</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Practice Consistency Weight
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    defaultValue="20"
                    className="flex-1"
                  />
                  <span className="text-foreground font-bold w-12">20%</span>
                </div>
                <p className="text-xs text-foreground/60 mt-1">Influence of practice activity on credit score</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Net Worth Weight
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    defaultValue="20"
                    className="flex-1"
                  />
                  <span className="text-foreground font-bold w-12">20%</span>
                </div>
                <p className="text-xs text-foreground/60 mt-1">Influence of net worth on credit score</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Spending Behavior Weight
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    defaultValue="10"
                    className="flex-1"
                  />
                  <span className="text-foreground font-bold w-12">10%</span>
                </div>
                <p className="text-xs text-foreground/60 mt-1">Influence of spending patterns on credit score</p>
              </div>

              <Button className="w-full mt-6">Save Credit Score Configuration</Button>
            </div>
          </Card>
        )}

        {/* Card Tiers Tab */}
        {activeTab === 'cards' && (
          <div className="space-y-6">
            {['Starter', 'Rewards', 'Elite'].map(tier => (
              <Card key={tier} className="border border-border p-6 bg-card">
                <h4 className="text-lg font-bold text-foreground mb-4">{tier} Tier</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Min Credit Score
                    </label>
                    <input
                      type="number"
                      placeholder="e.g., 500"
                      className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Rewards %
                    </label>
                    <input
                      type="number"
                      placeholder="e.g., 1"
                      step="0.1"
                      className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Annual Fee
                    </label>
                    <input
                      type="number"
                      placeholder="e.g., 0"
                      className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
                    />
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-4">Update {tier} Tier</Button>
              </Card>
            ))}
          </div>
        )}

        {/* Rewards Tab */}
        {activeTab === 'rewards' && (
          <Card className="border border-border p-6 bg-card">
            <h3 className="text-lg font-bold text-foreground mb-6">Rewards Configuration</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Correct Answer Reward
                </label>
                <input
                  type="number"
                  defaultValue="100"
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Stock Profit Multiplier
                </label>
                <input
                  type="number"
                  step="0.1"
                  defaultValue="1"
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
                />
              </div>
              <Button className="w-full mt-6">Save Rewards Configuration</Button>
            </div>
          </Card>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <Card className="border border-border p-6 bg-card">
            <h3 className="text-lg font-bold text-foreground mb-4">Economic Audit Log</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              <div className="text-sm text-foreground/60 p-3 bg-foreground/5 rounded">
                No audit logs available yet
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
