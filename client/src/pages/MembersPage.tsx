import { useState, useMemo } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Users, Search, ChevronRight, KeyRound, ShieldCheck } from 'lucide-react';
import { useLocation } from 'wouter';
import MemberDetailPanel from '@/components/MemberDetailPanel';
import { ChapterExamAdminControls } from '@/components/ChapterExamAdminControls';
import { toast } from 'sonner';

export default function MembersPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);

  // Check permission
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  
  // Use selectedSchoolCode for super admins, otherwise use their own schoolCode
  const schoolCode = user?.role === 'super_admin' ? user?.selectedSchoolCode || user?.schoolCode : user?.schoolCode;
  const { data: members = [], isLoading, error } = trpc.members.getMembers.useQuery(
    { schoolCode: schoolCode || '' },
    { enabled: !!schoolCode && isAdmin }
  );
  const utils = trpc.useUtils();
  const { data: passwordResetRequests = [] } = trpc.members.getPasswordResetRequests.useQuery(
    { schoolCode: schoolCode || undefined },
    { enabled: !!schoolCode && isAdmin, refetchInterval: 30_000 },
  );
  const approvePasswordReset = trpc.members.approvePasswordResetRequest.useMutation({
    onSuccess: async (result) => {
      await utils.members.getPasswordResetRequests.invalidate();
      if (result.emailDelivered) {
        toast.success('One-hour password reset link sent to the member.');
        return;
      }
      if (result.fallbackToken && navigator.clipboard) {
        await navigator.clipboard.writeText(`${window.location.origin}/reset-password?token=${result.fallbackToken}`);
        toast.warning('Email delivery was unavailable. The one-time reset link was copied for secure sharing with the member.');
        return;
      }
      toast.warning('Email delivery was unavailable. Ask the member to submit a new request after delivery is restored.');
    },
    onError: (mutationError) => toast.error(mutationError.message),
  });

  // Filter and search members
  const filteredMembers = useMemo(() => {
    return members.filter(member => {
      const matchesSearch = 
        (member.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (member.email?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      
      return matchesSearch;
    });
  }, [members, searchQuery]);

  // Calculate stats
  const stats = {
    totalMembers: members.length,
    activeMembers: members.filter(m => m.lastSignedIn && new Date(m.lastSignedIn).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000).length,
  };

  const handleViewMember = (member: any) => {
    setSelectedMember(member);
    setShowDetailPanel(true);
  };

  // Redirect if not admin
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">Only chapter admins can access this page.</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error Loading Members</h1>
          <p className="text-red-600">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 pt-16">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-8 h-8 text-blue-500" />
            <h1 className="text-4xl font-bold text-white">Chapter Members</h1>
          </div>
          <p className="text-gray-400">Manage and view member profiles, portfolios, and progress</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-800 border-slate-700 p-6">
            <div className="text-gray-400 text-sm mb-2">Total Members</div>
            <div className="text-3xl font-bold text-white">{stats.totalMembers}</div>
          </Card>
          <Card className="bg-slate-800 border-slate-700 p-6">
            <div className="text-gray-400 text-sm mb-2">Active Members</div>
            <div className="text-3xl font-bold text-green-400">{stats.activeMembers}</div>
          </Card>
          <Card className="bg-slate-800 border-slate-700 p-6">
            <div className="text-gray-400 text-sm mb-2">Average Exam Score</div>
            <div className="text-3xl font-bold text-blue-400">—</div>
          </Card>
          <Card className="bg-slate-800 border-slate-700 p-6">
            <div className="text-gray-400 text-sm mb-2">Portfolios Complete</div>
            <div className="text-3xl font-bold text-purple-400">—</div>
          </Card>
        </div>

        {passwordResetRequests.length > 0 && (
          <section className="mb-6 rounded-xl border border-amber-300/25 bg-amber-500/10 p-5" aria-label="Pending password reset requests">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex gap-3">
                <span className="rounded-lg bg-amber-300/15 p-2 text-amber-100"><KeyRound className="h-5 w-5" /></span>
                <div>
                  <h2 className="font-semibold text-amber-50">{passwordResetRequests.length} pending password reset request{passwordResetRequests.length === 1 ? '' : 's'}</h2>
                  <p className="mt-1 text-sm text-amber-50/75">Approve only a member request. Approval sends that member a one-time link that expires in one hour; no passwords are visible to administrators.</p>
                </div>
              </div>
            </div>
            <div className="mt-4 divide-y divide-amber-100/15 rounded-lg border border-amber-100/15 bg-slate-950/20">
              {passwordResetRequests.map((request) => (
                <div key={request.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <p className="font-medium text-white">{request.name || [request.firstName, request.lastName].filter(Boolean).join(' ') || 'Chapter member'}</p>
                    <p className="text-xs text-amber-50/65">{request.email} · Requested {new Date(request.requestedAt).toLocaleString()}</p>
                  </div>
                  <Button
                    onClick={() => approvePasswordReset.mutate({ requestId: request.id, schoolCode: schoolCode || undefined })}
                    disabled={approvePasswordReset.isPending}
                    className="bg-blue-600 text-white hover:bg-blue-500"
                  >
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Issue one-hour reset link
                  </Button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Search */}
        <ChapterExamAdminControls />
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-gray-500"
            />
          </div>
        </div>

        {/* Members Table */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-gray-400">Loading members...</div>
          ) : filteredMembers.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              {members.length === 0 ? 'No members in this chapter yet.' : 'No members match your search.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700 border-b border-slate-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Member</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Last Active</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Joined</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {filteredMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                            {(member.name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-white">{member.name || 'Unknown'}</div>
                            <div className="text-sm text-gray-400">{member.firstName} {member.lastName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-300">{member.email || '—'}</td>
                      <td className="px-6 py-4 text-gray-400">
                        {member.lastSignedIn ? new Date(member.lastSignedIn).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewMember(member)}
                            className="text-blue-400 hover:bg-blue-500/10"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Member Detail Panel */}
      {selectedMember && (
        <MemberDetailPanel
          member={selectedMember}
          isOpen={showDetailPanel}
          onClose={() => setShowDetailPanel(false)}
        />
      )}
    </div>
  );
}
