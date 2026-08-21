import { useMemo, useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Users, Search, ChevronRight, KeyRound, ShieldCheck, LayoutDashboard, FolderKanban, UsersRound, FileSearch, ChartNoAxesCombined } from 'lucide-react';
import { useLocation } from 'wouter';
import MemberDetailPanel from '@/components/MemberDetailPanel';
import { ChapterExamAdminControls } from '@/components/ChapterExamAdminControls';
import { toast } from 'sonner';
import { PortfolioManagementPanels, type PortfolioManagementTab } from '@/components/PortfolioManagementPanels';

type ActiveTab = 'overview' | 'members' | PortfolioManagementTab;

export default function MembersPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const schoolCode = user?.role === 'super_admin' ? user?.selectedSchoolCode || user?.schoolCode : user?.schoolCode;
  const utils = trpc.useUtils();
  const { data: members = [], isLoading, error } = trpc.members.getMembers.useQuery({ schoolCode: schoolCode || '' }, { enabled: !!schoolCode && isAdmin });
  const { data: passwordResetRequests = [] } = trpc.members.getPasswordResetRequests.useQuery({ schoolCode: schoolCode || undefined }, { enabled: !!schoolCode && isAdmin, refetchInterval: 30_000 });
  const { data: portfolioMemberSummaries = [] } = trpc.portfolio.getMemberSummaries.useQuery({ schoolCode: schoolCode || '' }, { enabled: !!schoolCode && isAdmin });
  const approvePasswordReset = trpc.members.approvePasswordResetRequest.useMutation({
    onSuccess: async (result) => {
      await utils.members.getPasswordResetRequests.invalidate();
      if (result.emailDelivered) return toast.success('One-hour password reset link sent to the member.');
      if (result.fallbackToken && navigator.clipboard) {
        await navigator.clipboard.writeText(`${window.location.origin}/reset-password?token=${result.fallbackToken}`);
        return toast.warning('Email delivery was unavailable. The one-time reset link was copied for secure sharing.');
      }
      toast.warning('Email delivery was unavailable. Ask the member to submit a new request after delivery is restored.');
    },
    onError: (mutationError) => toast.error(mutationError.message),
  });
  const filteredMembers = useMemo(() => members.filter((member) => `${member.name || ''} ${member.email || ''}`.toLowerCase().includes(searchQuery.toLowerCase())), [members, searchQuery]);
  const portfolioSummaryByMember = useMemo(() => new Map(portfolioMemberSummaries.map((summary) => [summary.memberId, summary])), [portfolioMemberSummaries]);
  const stats = { totalMembers: members.length, activeMembers: members.filter((member) => member.lastSignedIn && new Date(member.lastSignedIn).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000).length };
  const tabs: Array<{ id: ActiveTab; label: string; icon: any }> = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard }, { id: 'members', label: 'Members', icon: Users }, { id: 'teams', label: 'Teams', icon: UsersRound }, { id: 'checkpoints', label: 'Portfolio Checkpoints', icon: FolderKanban }, { id: 'reviews', label: 'Portfolio Reviews', icon: FileSearch }, { id: 'progress', label: 'Chapter Progress', icon: ChartNoAxesCombined },
  ];
  if (!isAdmin) return <div className="flex min-h-screen items-center justify-center"><div className="text-center"><h1 className="mb-4 text-2xl font-bold">Access Denied</h1><p className="mb-6 text-gray-600">Only chapter admins can access this page.</p><Button onClick={() => navigate('/')}>Go Home</Button></div></div>;
  if (error) return <div className="flex min-h-screen items-center justify-center"><div className="text-center"><h1 className="mb-4 text-2xl font-bold">Error Loading Members</h1><p className="text-red-600">{error.message}</p></div></div>;

  return <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-6"><div className="mx-auto max-w-7xl">
    <header className="mb-7 pt-16"><div className="mb-2 flex items-center gap-3"><Users className="h-8 w-8 text-blue-400" /><h1 className="text-4xl font-bold text-white">Chapter Members</h1></div><p className="text-gray-400">A DECA advisor workspace for roster, portfolios, checkpoints, feedback, and chapter progress.</p></header>
    <nav className="mb-6 flex gap-2 overflow-x-auto rounded-xl border border-white/10 bg-slate-950/45 p-2" aria-label="Member Management sections">{tabs.map((tab) => { const Icon = tab.icon; const active = activeTab === tab.id; return <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${active ? 'bg-blue-500/20 text-blue-50' : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'}`} aria-current={active ? 'page' : undefined}><Icon className="h-4 w-4" />{tab.label}</button>; })}</nav>
    {activeTab === 'overview' && <PortfolioManagementPanels tab="overview" schoolCode={schoolCode || ''} members={members} />}
    {activeTab !== 'overview' && activeTab !== 'members' && <PortfolioManagementPanels tab={activeTab} schoolCode={schoolCode || ''} members={members} />}
    {activeTab === 'members' && <section>
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4"><Card className="border-slate-700 bg-slate-800 p-5"><p className="text-sm text-gray-400">Total Members</p><p className="mt-2 text-3xl font-bold text-white">{stats.totalMembers}</p></Card><Card className="border-slate-700 bg-slate-800 p-5"><p className="text-sm text-gray-400">Active Members</p><p className="mt-2 text-3xl font-bold text-emerald-400">{stats.activeMembers}</p></Card><Card className="border-slate-700 bg-slate-800 p-5"><p className="text-sm text-gray-400">Average Exam Score</p><p className="mt-2 text-3xl font-bold text-blue-400">—</p></Card><Card className="border-slate-700 bg-slate-800 p-5"><p className="text-sm text-gray-400">Portfolio Checkpoints</p><p className="mt-2 text-3xl font-bold text-purple-400">{portfolioMemberSummaries.filter((summary) => summary.portfolioStatus !== 'No checkpoint').length || '—'}</p></Card></div>
      {passwordResetRequests.length > 0 && <section className="mb-6 rounded-xl border border-amber-300/25 bg-amber-500/10 p-5" aria-label="Pending password reset requests"><div className="flex gap-3"><span className="rounded-lg bg-amber-300/15 p-2 text-amber-100"><KeyRound className="h-5 w-5" /></span><div><h2 className="font-semibold text-amber-50">{passwordResetRequests.length} pending password reset request{passwordResetRequests.length === 1 ? '' : 's'}</h2><p className="mt-1 text-sm text-amber-50/75">Approve only a member request. Approval sends a one-time link that expires in one hour; no passwords are visible to administrators.</p></div></div><div className="mt-4 divide-y divide-amber-100/15 rounded-lg border border-amber-100/15 bg-slate-950/20">{passwordResetRequests.map((request) => <div key={request.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"><div><p className="font-medium text-white">{request.name || [request.firstName, request.lastName].filter(Boolean).join(' ') || 'Chapter member'}</p><p className="text-xs text-amber-50/65">{request.email} · Requested {new Date(request.requestedAt).toLocaleString()}</p></div><Button onClick={() => approvePasswordReset.mutate({ requestId: request.id, schoolCode: schoolCode || undefined })} disabled={approvePasswordReset.isPending} className="bg-blue-600 text-white hover:bg-blue-500"><ShieldCheck className="mr-2 h-4 w-4" />Issue one-hour reset link</Button></div>)}</div></section>}
      <ChapterExamAdminControls />
      <div className="mb-6 rounded-lg border border-slate-700 bg-slate-800 p-6"><div className="relative"><Search className="absolute left-3 top-3 h-5 w-5 text-gray-500" /><Input placeholder="Search by name or email…" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="border-slate-600 bg-slate-700 pl-10 text-white placeholder:text-gray-500" /></div></div>
      <div className="overflow-hidden rounded-lg border border-slate-700 bg-slate-800">{isLoading ? <div className="p-8 text-center text-gray-400">Loading members…</div> : !filteredMembers.length ? <div className="p-8 text-center text-gray-400">{members.length ? 'No members match your search.' : 'No members in this chapter yet.'}</div> : <div className="overflow-x-auto"><table className="w-full min-w-[1450px]"><thead className="border-b border-slate-600 bg-slate-700"><tr>{['Member', 'Email', 'Event', 'Team', 'Portfolio Status', 'Next Checkpoint', 'Last Upload', 'AI Review', 'Advisor Score', 'Last Active', ''].map((label) => <th key={label || 'action'} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-300">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-700">{filteredMembers.map((member) => { const portfolio = portfolioSummaryByMember.get(member.id); return <tr key={member.id} className="transition-colors hover:bg-slate-700/50"><td className="px-4 py-4"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 font-semibold text-white">{(member.name || 'U').charAt(0).toUpperCase()}</div><div><p className="font-medium text-white">{member.name || 'Unknown'}</p><p className="text-xs text-gray-400">{member.firstName} {member.lastName}</p></div></div></td><td className="px-4 py-4 text-sm text-gray-300">{member.email || '—'}</td><td className="px-4 py-4 text-sm text-gray-300">{portfolio?.eventCode || '—'}</td><td className="px-4 py-4 text-sm text-gray-300">{portfolio?.teamName || 'Individual'}</td><td className="px-4 py-4"><span className="rounded-full border border-blue-300/15 bg-blue-400/10 px-2 py-1 text-xs text-blue-100">{portfolio?.portfolioStatus || 'No checkpoint'}</span></td><td className="px-4 py-4 text-sm text-gray-300">{portfolio?.nextCheckpointTitle || '—'}{portfolio?.nextCheckpointDueAt ? <span className="block text-xs text-gray-500">{new Date(portfolio.nextCheckpointDueAt).toLocaleDateString()}</span> : null}</td><td className="px-4 py-4 text-sm text-gray-300">{portfolio?.lastUploadAt ? new Date(portfolio.lastUploadAt).toLocaleDateString() : '—'}</td><td className="px-4 py-4 text-sm text-gray-300">{portfolio?.aiReviewStatus || 'Not run'}</td><td className="px-4 py-4 text-sm text-gray-300">{portfolio?.advisorScore ?? '—'}</td><td className="px-4 py-4 text-sm text-gray-400">{member.lastSignedIn ? new Date(member.lastSignedIn).toLocaleDateString() : '—'}</td><td className="px-4 py-4 text-right"><Button size="sm" variant="ghost" onClick={() => { setSelectedMember(member); setShowDetailPanel(true); }} className="text-blue-300 hover:bg-blue-500/10"><ChevronRight className="h-4 w-4" /></Button></td></tr>; })}</tbody></table></div>}</div>
    </section>}
  </div>{selectedMember && <MemberDetailPanel member={selectedMember} isOpen={showDetailPanel} onClose={() => setShowDetailPanel(false)} />}</div>;
}
