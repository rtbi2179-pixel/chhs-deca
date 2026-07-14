import { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FileText, Trash2, Download, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminPortfolios() {
  const { user } = useAuth();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Check if user is admin
  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="bg-red-900/20 border-red-700 p-8">
            <div className="flex items-center gap-4">
              <AlertCircle className="w-8 h-8 text-red-400 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-bold text-red-400">Access Denied</h2>
                <p className="text-red-300">Only admins can view student portfolios</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Queries and mutations
  const { data: portfolios = [], isLoading, refetch } = trpc.portfolios.getSchoolPortfolios.useQuery();
  const deleteMutation = trpc.portfolios.deletePortfolio.useMutation();

  const handleDelete = async (portfolioId: number) => {
    if (!window.confirm('Are you sure you want to delete this portfolio?')) return;

    setDeletingId(portfolioId);
    try {
      await deleteMutation.mutateAsync({ portfolioId });
      toast.success('Portfolio deleted');
      refetch();
    } catch (error) {
      toast.error('Failed to delete portfolio');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Student Portfolios</h1>
          <p className="text-slate-400">View and manage all student DECA portfolios for your school</p>
        </div>

        {/* Portfolios Grid */}
        {isLoading ? (
          <div className="text-center py-12 text-slate-400">Loading portfolios...</div>
        ) : portfolios.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700 p-12 text-center">
            <FileText className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">No Portfolios Yet</h2>
            <p className="text-slate-400">Students haven't uploaded any portfolios yet</p>
          </Card>
        ) : (
          <div className="grid gap-6">
            {portfolios.map((portfolio: any) => (
              <Card key={portfolio.id} className="bg-slate-800/50 border-slate-700 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white text-lg">{portfolio.fileName}</h3>
                      <div className="flex gap-4 text-sm text-slate-400 mt-1">
                        <span>Size: {(portfolio.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                        <span>•</span>
                        <span>Uploaded: {new Date(portfolio.uploadedAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>Type: {portfolio.mimeType === 'application/pdf' ? 'PDF' : 'Word'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={portfolio.fileUrl}
                      download={portfolio.fileName}
                      className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                      title="Download"
                    >
                      <Download className="w-5 h-5" />
                    </a>
                    <button
                      onClick={() => handleDelete(portfolio.id)}
                      disabled={deletingId === portfolio.id}
                      className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
