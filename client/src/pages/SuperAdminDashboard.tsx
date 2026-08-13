import { useState } from 'react';
import { useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Settings, TrendingUp, DollarSign, Zap } from 'lucide-react';

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'credit' | 'cards' | 'rewards' | 'market' | 'logs'>('overview');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [weights, setWeights] = useState({
    paymentReliabilityWeight: 25,
    accountHistoryWeight: 25,
    practiceConsistencyWeight: 20,
    netWorthWeight: 20,
    spendingBehaviorWeight: 10,
  });
  const selectedSchoolQuery = trpc.superAdmin.getSelectedSchool.useQuery(undefined, { enabled: user?.role === 'super_admin' });
  const economicConfigQuery = trpc.superAdmin.getEconomicConfig.useQuery(undefined, { enabled: user?.role === 'super_admin' });
  const auditLogQuery = trpc.superAdmin.getEconomicAuditLog.useQuery(undefined, { enabled: user?.role === 'super_admin' });
  const activityLogQuery = trpc.superAdmin.getActivityLog.useQuery(undefined, { enabled: user?.role === 'super_admin' });
  const monitoringQuery = trpc.superAdmin.getEconomicMonitoring.useQuery(undefined, { enabled: user?.role === 'super_admin' });
  const inflationHistoryQuery = trpc.superAdmin.getInflationHistory.useQuery(undefined, { enabled: user?.role === 'super_admin' });
  const adminStocksQuery = trpc.market.getAdminStocks.useQuery(undefined, { enabled: user?.role === 'super_admin' });
  const updateWeights = trpc.superAdmin.updateEconomicWeights.useMutation({
    onSuccess: async () => {
      setSaveMessage('Credit-score weights saved and added to the audit log.');
      await Promise.all([economicConfigQuery.refetch(), auditLogQuery.refetch(), activityLogQuery.refetch()]);
    },
    onError: (error) => setSaveMessage(error.message),
  });
  const exportBackup = trpc.superAdmin.exportChapterBackup.useMutation({
    onSuccess: (backup) => {
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `blue-blazer-${backup.schoolCode}-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setSaveMessage(`Chapter backup exported for ${backup.schoolCode}.`);
      activityLogQuery.refetch();
    },
    onError: (error) => setSaveMessage(error.message),
  });
  const setStockActive = trpc.market.setStockActive.useMutation({
    onSuccess: async () => {
      setSaveMessage('Stock availability updated and recorded in administrator activity.');
      await Promise.all([adminStocksQuery.refetch(), activityLogQuery.refetch()]);
    },
    onError: (error) => setSaveMessage(error.message),
  });

  useEffect(() => {
    if (!economicConfigQuery.data) return;
    setWeights({
      paymentReliabilityWeight: Number(economicConfigQuery.data.paymentReliabilityWeight),
      accountHistoryWeight: Number(economicConfigQuery.data.accountHistoryWeight),
      practiceConsistencyWeight: Number(economicConfigQuery.data.practiceConsistencyWeight),
      netWorthWeight: Number(economicConfigQuery.data.netWorthWeight),
      spendingBehaviorWeight: Number(economicConfigQuery.data.spendingBehaviorWeight),
    });
  }, [economicConfigQuery.data]);

  const totalWeight = Object.values(weights).reduce((sum, value) => sum + value, 0);
  const weightFields = [
    { key: 'paymentReliabilityWeight' as const, label: 'Payment Reliability Weight', description: 'Influence of on-time payments on credit score' },
    { key: 'accountHistoryWeight' as const, label: 'Account History Weight', description: 'Influence of account age on credit score' },
    { key: 'practiceConsistencyWeight' as const, label: 'Practice Consistency Weight', description: 'Influence of practice activity on credit score' },
    { key: 'netWorthWeight' as const, label: 'Net Worth Weight', description: 'Influence of net worth on credit score' },
    { key: 'spendingBehaviorWeight' as const, label: 'Spending Behavior Weight', description: 'Influence of spending patterns on credit score' },
  ];

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
            { id: 'market' as const, label: 'Market', icon: TrendingUp },
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
                  <span className="font-bold text-foreground">{monitoringQuery.data?.activeUsers ?? '—'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-foreground/70">30-Day Transactions</span>
                  <span className="font-bold text-foreground">{monitoringQuery.data ? monitoringQuery.data.marketTransactions + monitoringQuery.data.cardTransactions : '—'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-foreground/70">Simulation Monetary Pressure</span>
                  <span className="font-bold text-foreground">{monitoringQuery.data ? `${monitoringQuery.data.pressureIndex}% · ${monitoringQuery.data.status}` : '—'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-foreground/70">Blue Bucks Inflation Index</span>
                  <span className="font-bold text-foreground">{monitoringQuery.data ? `${monitoringQuery.data.inflationIndex} · ${monitoringQuery.data.inflationPeriod}` : '—'}</span>
                </div>
              </div>
              <p className="mt-4 text-xs text-foreground/60">The inflation index is 100 plus monthly net Blue Bucks issued per active member. It is a transparent in-app purchasing-power signal, not a real-world inflation measure.</p>
            </Card>

            <Card className="border border-border p-6 bg-card">
              <h3 className="text-lg font-bold text-foreground mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  View Economic Audit Log
                </Button>
                <Button variant="outline" className="w-full justify-start" disabled={exportBackup.isPending} onClick={() => exportBackup.mutate()}>
                  {exportBackup.isPending ? 'Preparing Chapter Backup…' : 'Download Chapter Backup'}
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Reset Daily Metrics
                </Button>
              </div>
            </Card>

            <Card className="border border-border p-6 bg-card">
              <h3 className="text-lg font-bold text-foreground mb-4">Operational Health</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between gap-4"><span className="text-foreground/70">Database</span><span className="font-medium text-emerald-500">{monitoringQuery.data?.databaseStatus ?? 'checking'}</span></div>
                <div className="flex justify-between gap-4"><span className="text-foreground/70">Reward units issued</span><span className="font-medium text-foreground">{monitoringQuery.data?.rewardUnitsIssued.toLocaleString() ?? '—'}</span></div>
                <div className="flex justify-between gap-4"><span className="text-foreground/70">Market turnover</span><span className="font-medium text-foreground">{monitoringQuery.data ? `${monitoringQuery.data.marketTurnover.toFixed(2)} BB` : '—'}</span></div>
                <div className="flex justify-between gap-4"><span className="text-foreground/70">Card spending</span><span className="font-medium text-foreground">{monitoringQuery.data ? `${monitoringQuery.data.cardSpending.toFixed(2)} BB` : '—'}</span></div>
              </div>
            </Card>

            <Card className="border border-border p-6 bg-card md:col-span-2">
              <div className="flex items-baseline justify-between gap-4"><h3 className="text-lg font-bold text-foreground">Blue Bucks Inflation History</h3><span className="text-xs text-foreground/60">Baseline: 100</span></div>
              <p className="mt-1 text-sm text-foreground/60">Monthly index of net Blue Bucks issued per active member. Values above 100 indicate net issuance; values below 100 indicate net sinks.</p>
              {inflationHistoryQuery.data?.length ? (
                <div className="mt-6 flex h-36 items-end gap-3 border-b border-border pb-1">
                  {[...inflationHistoryQuery.data].reverse().map((snapshot) => {
                    const index = Number(snapshot.inflationIndex);
                    const height = Math.min(100, Math.max(8, index));
                    return <div key={snapshot.id} className="flex flex-1 flex-col items-center gap-2 text-center"><div className="w-full rounded-t bg-blue-500/80" style={{ height: `${height}%` }} title={`${snapshot.periodKey}: ${index}`} /><span className="text-[10px] text-foreground/60">{snapshot.periodKey}</span></div>;
                  })}
                </div>
              ) : <p className="mt-6 text-sm text-foreground/60">No monthly snapshots yet. Open the overview after chapter activity to create the first snapshot.</p>}
            </Card>
          </div>
        )}

        {/* Credit Score Tab */}
        {activeTab === 'credit' && (
          <Card className="border border-border p-6 bg-card">
            <h3 className="text-lg font-bold text-foreground mb-6">Credit Score Configuration</h3>
            <div className="space-y-6">
              <p className="text-sm text-foreground/60">Managing economics for {selectedSchoolQuery.data?.selectedSchoolCode ?? user.schoolCode}. Weights must total 100%.</p>
              {weightFields.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-foreground mb-2">{field.label}</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={weights[field.key]}
                      onChange={(event) => setWeights((current) => ({ ...current, [field.key]: Number(event.target.value) }))}
                      className="flex-1"
                    />
                    <span className="text-foreground font-bold w-12">{weights[field.key]}%</span>
                  </div>
                  <p className="text-xs text-foreground/60 mt-1">{field.description}</p>
                </div>
              ))}
              <div className={`text-sm font-medium ${totalWeight === 100 ? 'text-emerald-500' : 'text-red-500'}`}>Total: {totalWeight}%</div>
              {saveMessage && <p className="text-sm text-foreground/70">{saveMessage}</p>}
              <Button
                className="w-full mt-6"
                disabled={totalWeight !== 100 || updateWeights.isPending}
                onClick={() => updateWeights.mutate(weights)}
              >
                {updateWeights.isPending ? 'Saving configuration...' : 'Save Credit Score Configuration'}
              </Button>
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

        {activeTab === 'market' && (
          <Card className="border border-border p-6 bg-card">
            <h3 className="text-lg font-bold text-foreground">Market Stock Management</h3>
            <p className="mt-1 text-sm text-foreground/60">Activate or pause stocks for the selected chapter. Paused stocks are excluded from member-facing market listings; prior holdings remain recorded.</p>
            {saveMessage && <p className="mt-4 text-sm text-foreground/70">{saveMessage}</p>}
            <div className="mt-6 divide-y divide-border rounded-lg border border-border">
              {adminStocksQuery.isLoading ? <p className="p-4 text-sm text-foreground/60">Loading chapter stocks…</p> : adminStocksQuery.data?.length ? adminStocksQuery.data.map((stock) => (
                <div key={stock.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div><p className="font-semibold text-foreground">{stock.ticker} <span className="font-normal text-foreground/60">· {stock.companyName}</span></p><p className={`mt-1 text-xs ${stock.isActive ? 'text-emerald-500' : 'text-amber-500'}`}>{stock.isActive ? 'Active for members' : 'Paused for members'}</p></div>
                  <Button variant="outline" disabled={setStockActive.isPending} onClick={() => setStockActive.mutate({ stockId: stock.id, isActive: !stock.isActive })}>{stock.isActive ? 'Pause Stock' : 'Activate Stock'}</Button>
                </div>
              )) : <p className="p-4 text-sm text-foreground/60">No stocks have been initialized for the selected chapter.</p>}
            </div>
          </Card>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card className="border border-border p-6 bg-card">
              <h3 className="text-lg font-bold text-foreground mb-4">Economic Audit Log</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {auditLogQuery.isLoading ? (
                  <div className="text-sm text-foreground/60 p-3 bg-foreground/5 rounded">Loading audit history…</div>
                ) : auditLogQuery.data?.length ? auditLogQuery.data.map((entry) => (
                  <div key={entry.id} className="text-sm p-3 bg-foreground/5 rounded space-y-1">
                    <div className="flex justify-between gap-4"><span className="font-medium text-foreground">{entry.fieldChanged}</span><span className="text-foreground/60">{new Date(entry.createdAt).toLocaleString()}</span></div>
                    <p className="text-foreground/70">{entry.oldValue ?? '—'} → {entry.newValue ?? '—'}</p>
                    {entry.reason && <p className="text-foreground/60">Reason: {entry.reason}</p>}
                  </div>
                )) : (
                  <div className="text-sm text-foreground/60 p-3 bg-foreground/5 rounded">No audit logs available yet.</div>
                )}
              </div>
            </Card>
            <Card className="border border-border p-6 bg-card">
              <h3 className="text-lg font-bold text-foreground mb-1">Administrator Activity</h3>
              <p className="text-sm text-foreground/60 mb-4">Recent privileged actions for the selected chapter.</p>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {activityLogQuery.isLoading ? (
                  <div className="text-sm text-foreground/60 p-3 bg-foreground/5 rounded">Loading administrator activity…</div>
                ) : activityLogQuery.data?.length ? activityLogQuery.data.map((entry) => (
                  <div key={entry.id} className="text-sm p-3 bg-foreground/5 rounded space-y-1">
                    <div className="flex justify-between gap-4"><span className="font-medium text-foreground">{entry.action.replaceAll('_', ' ')}</span><span className="text-foreground/60">{new Date(entry.createdAt).toLocaleString()}</span></div>
                    <p className="text-foreground/70">Target: {entry.targetType}{entry.targetId ? ` · ${entry.targetId}` : ''}</p>
                  </div>
                )) : (
                  <div className="text-sm text-foreground/60 p-3 bg-foreground/5 rounded">No administrator activity has been recorded for this chapter yet.</div>
                )}
              </div>
            </Card>
            </div>
        )}
      </div>
    </div>
  );
}
