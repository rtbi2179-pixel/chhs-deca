import { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { X, Mail, FileText, MessageSquare, Plus, Trash2, ClipboardCheck, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

interface MemberDetailPanelProps {
  member: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function MemberDetailPanel({ member, isOpen, onClose }: MemberDetailPanelProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'portfolio' | 'exams' | 'notes' | 'messages'>('profile');
  const [adminNote, setAdminNote] = useState('');
  const [messageBody, setMessageBody] = useState('');

  const { data: portfolio = [] } = trpc.members.getPortfolioItems.useQuery(
    { userId: member.id },
    { enabled: isOpen }
  );

  const { data: adminNotes = [] } = trpc.members.getAdminNotes.useQuery(
    { memberId: member.id },
    { enabled: isOpen && (user?.role === 'admin' || user?.role === 'super_admin') }
  );

  const { data: messages = [] } = trpc.members.getMessages.useQuery(
    { otherUserId: member.id },
    { enabled: isOpen }
  );
  const { data: chapterExamRecords = [] } = trpc.mockExams.getMemberChapterRecords.useQuery(
    { memberId: member.id },
    { enabled: isOpen && (user?.role === 'admin' || user?.role === 'super_admin') }
  );

  const createNoteMutation = trpc.members.createAdminNote.useMutation({
    onSuccess: () => {
      setAdminNote('');
      toast.success('Note added');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const sendMessageMutation = trpc.members.sendMessage.useMutation({
    onSuccess: () => {
      setMessageBody('');
      toast.success('Message sent');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleAddNote = () => {
    if (!adminNote.trim()) return;
    createNoteMutation.mutate({
      memberId: member.id,
      note: adminNote,
    });
  };

  const handleSendMessage = () => {
    if (!messageBody.trim()) return;
    sendMessageMutation.mutate({
      recipientId: member.id,
      body: messageBody,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white">Member Profile</DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-700 mb-6">
          {['profile', 'portfolio', 'exams', 'notes', 'messages'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === tab
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400">Full Name</label>
                <p className="text-white font-medium">{member.name || '—'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Email</label>
                <p className="text-white font-medium">{member.email || '—'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Joined</label>
                <p className="text-white font-medium">
                  {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : '—'}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Last Active</label>
                <p className="text-white font-medium">
                  {member.lastSignedIn ? new Date(member.lastSignedIn).toLocaleDateString() : '—'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Portfolio Tab */}
        {activeTab === 'portfolio' && (
          <div className="space-y-4">
            {portfolio.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No portfolio items yet</p>
            ) : (
              portfolio.map((item: any) => (
                <Card key={item.id} className="bg-slate-700 border-slate-600 p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-white">{item.title}</h3>
                      <p className="text-sm text-gray-400">{item.category}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      item.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                      item.status === 'ready_for_review' ? 'bg-blue-500/20 text-blue-300' :
                      item.status === 'needs_revision' ? 'bg-red-500/20 text-red-300' :
                      'bg-gray-500/20 text-gray-300'
                    }`}>
                      {item.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-sm text-gray-300 mb-2">{item.description}</p>
                  )}
                  {item.adminFeedback && (
                    <div className="bg-slate-600 p-2 rounded text-sm text-gray-300 mb-2">
                      <strong>Feedback:</strong> {item.adminFeedback}
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === 'exams' && (user?.role === 'admin' || user?.role === 'super_admin') && (
          <div className="space-y-3">
            {chapterExamRecords.length === 0 ? <p className="py-8 text-center text-gray-400">No chapter mock exams recorded for this member.</p> : chapterExamRecords.map((record: any) => (
              <Card key={record.id} className="border-slate-600 bg-slate-700 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2 text-white"><ClipboardCheck className="h-4 w-4 text-blue-300" /><span className="font-semibold">{record.cluster} chapter exam</span></div><p className="mt-1 text-sm text-gray-400">Taken {record.completedAt ? new Date(record.completedAt).toLocaleString() : `Started ${new Date(record.startedAt).toLocaleString()}`} · {record.questionCount} questions</p></div><div className="text-right"><p className="font-mono text-lg font-semibold text-white">{record.score ?? '—'}{record.score !== null ? ` / ${record.questionCount}` : ''}</p><p className="text-xs text-gray-400">{record.accuracy ?? 'Pending'}{record.accuracy !== null ? '% accuracy' : ''}</p></div></div>
                {record.suspiciousActivityCount > 0 && <p className="mt-3 flex items-center gap-2 rounded-md border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-100"><ShieldAlert className="h-4 w-4" />{record.suspiciousActivityCount} activity flag{record.suspiciousActivityCount === 1 ? '' : 's'} for review</p>}
              </Card>
            ))}
          </div>
        )}

        {/* Notes Tab (Admin Only) */}
        {activeTab === 'notes' && (user?.role === 'admin' || user?.role === 'super_admin') && (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 block mb-2">Add Note</label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Add private notes about this member..."
                className="w-full bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 text-sm"
                rows={3}
              />
              <Button
                onClick={handleAddNote}
                disabled={createNoteMutation.isPending}
                className="mt-2 bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Note
              </Button>
            </div>

            <div className="space-y-2">
              {adminNotes.map((note: any) => (
                <Card key={note.id} className="bg-slate-700 border-slate-600 p-3">
                  <p className="text-sm text-gray-300">{note.note}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(note.createdAt).toLocaleDateString()}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div className="space-y-4">
            <div className="bg-slate-700 rounded p-3 max-h-64 overflow-y-auto space-y-2">
              {messages.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">No messages yet</p>
              ) : (
                messages.map((msg: any) => (
                  <div
                    key={msg.id}
                    className={`text-sm p-2 rounded ${
                      msg.senderId === user?.id
                        ? 'bg-blue-600/30 text-blue-200 ml-auto max-w-xs'
                        : 'bg-gray-600/30 text-gray-200 mr-auto max-w-xs'
                    }`}
                  >
                    {msg.body}
                  </div>
                ))
              )}
            </div>

            <div>
              <textarea
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                placeholder="Type a message..."
                className="w-full bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 text-sm"
                rows={2}
              />
              <Button
                onClick={handleSendMessage}
                disabled={sendMessageMutation.isPending}
                className="mt-2 bg-blue-600 hover:bg-blue-700 w-full"
              >
                <Mail className="w-4 h-4 mr-2" />
                Send Message
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
