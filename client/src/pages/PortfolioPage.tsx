import { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, Plus, Trash2, Edit2, Upload } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = [
  'Written Event',
  'Roleplay',
  'Exam Preparation',
  'Presentation',
  'Resume',
  'Community Service',
  'Leadership',
  'Awards',
  'Other',
];

export default function PortfolioPage() {
  const { user } = useAuth();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    fileUrl: '',
    externalUrl: '',
    memberProgressNotes: '',
  });

  const { data: portfolio = [], refetch } = trpc.members.getPortfolioItems.useQuery(
    { userId: user?.id },
    { enabled: !!user?.id }
  );

  const createMutation = trpc.members.createPortfolioItem.useMutation({
    onSuccess: () => {
      setFormData({
        title: '',
        category: '',
        description: '',
        fileUrl: '',
        externalUrl: '',
        memberProgressNotes: '',
      });
      setShowAddDialog(false);
      refetch();
      toast.success('Portfolio item added');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = trpc.members.updatePortfolioItem.useMutation({
    onSuccess: () => {
      setEditingItem(null);
      setFormData({
        title: '',
        category: '',
        description: '',
        fileUrl: '',
        externalUrl: '',
        memberProgressNotes: '',
      });
      refetch();
      toast.success('Portfolio item updated');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = trpc.members.deletePortfolioItem.useMutation({
    onSuccess: () => {
      refetch();
      toast.success('Portfolio item deleted');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleAddItem = () => {
    if (!formData.title || !formData.category || (!formData.fileUrl && !formData.externalUrl)) {
      toast.error('Please fill in required fields');
      return;
    }

    createMutation.mutate(formData);
  };

  const handleUpdateItem = () => {
    if (!formData.title || !formData.category) {
      toast.error('Please fill in required fields');
      return;
    }

    updateMutation.mutate({
      itemId: editingItem.id,
      ...formData,
    });
  };

  const handleEditItem = (item: any) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      category: item.category,
      description: item.description || '',
      fileUrl: item.fileUrl || '',
      externalUrl: item.externalUrl || '',
      memberProgressNotes: item.memberProgressNotes || '',
    });
    setShowAddDialog(true);
  };

  const handleDeleteItem = (itemId: number) => {
    if (confirm('Are you sure you want to delete this portfolio item?')) {
      deleteMutation.mutate({ itemId });
    }
  };

  const handleCloseDialog = () => {
    setShowAddDialog(false);
    setEditingItem(null);
    setFormData({
      title: '',
      category: '',
      description: '',
      fileUrl: '',
      externalUrl: '',
      memberProgressNotes: '',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-500" />
              <h1 className="text-4xl font-bold text-white">My Portfolio</h1>
            </div>
            <Button
              onClick={() => setShowAddDialog(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>
          <p className="text-gray-400">Upload and manage your portfolio materials</p>
        </div>

        {/* Portfolio Items */}
        <div className="space-y-4">
          {portfolio.length === 0 ? (
            <Card className="bg-slate-800 border-slate-700 p-12 text-center">
              <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">No portfolio items yet</p>
              <Button
                onClick={() => setShowAddDialog(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Item
              </Button>
            </Card>
          ) : (
            portfolio.map((item: any) => (
              <Card key={item.id} className="bg-slate-800 border-slate-700 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-1">{item.title}</h3>
                    <p className="text-sm text-gray-400 mb-2">{item.category}</p>
                    {item.description && (
                      <p className="text-gray-300 text-sm mb-3">{item.description}</p>
                    )}
                  </div>
                  <span className={`text-xs px-3 py-1 rounded whitespace-nowrap ml-4 ${
                    item.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                    item.status === 'ready_for_review' ? 'bg-blue-500/20 text-blue-300' :
                    item.status === 'needs_revision' ? 'bg-red-500/20 text-red-300' :
                    item.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-300' :
                    'bg-gray-500/20 text-gray-300'
                  }`}>
                    {item.status.replace(/_/g, ' ')}
                  </span>
                </div>

                {item.adminFeedback && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded p-3 mb-4">
                    <p className="text-sm text-blue-200">
                      <strong>Admin Feedback:</strong> {item.adminFeedback}
                    </p>
                  </div>
                )}

                {item.memberProgressNotes && (
                  <p className="text-sm text-gray-400 mb-4">
                    <strong>Your Notes:</strong> {item.memberProgressNotes}
                  </p>
                )}

                <div className="flex items-center gap-2 mb-4">
                  {item.fileUrl && (
                    <a
                      href={item.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                    >
                      <Upload className="w-4 h-4" />
                      View File
                    </a>
                  )}
                  {item.externalUrl && (
                    <a
                      href={item.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                    >
                      <Upload className="w-4 h-4" />
                      External Link
                    </a>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditItem(item)}
                    className="border-slate-600 hover:bg-slate-700"
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteItem(item.id)}
                    className="border-red-600/50 hover:bg-red-500/10 text-red-400"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingItem ? 'Edit Portfolio Item' : 'Add Portfolio Item'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 block mb-2">Title *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Portfolio item title"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-2">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 text-white rounded px-3 py-2"
              >
                <option value="">Select a category</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your portfolio item..."
                className="w-full bg-slate-700 border border-slate-600 text-white rounded px-3 py-2"
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-2">File URL</label>
              <Input
                value={formData.fileUrl}
                onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                placeholder="https://example.com/file.pdf"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-2">External Link</label>
              <Input
                value={formData.externalUrl}
                onChange={(e) => setFormData({ ...formData, externalUrl: e.target.value })}
                placeholder="https://example.com"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-2">Your Progress Notes</label>
              <textarea
                value={formData.memberProgressNotes}
                onChange={(e) => setFormData({ ...formData, memberProgressNotes: e.target.value })}
                placeholder="Add your own notes about this item..."
                className="w-full bg-slate-700 border border-slate-600 text-white rounded px-3 py-2"
                rows={2}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={handleCloseDialog}
                className="border-slate-600 hover:bg-slate-700"
              >
                Cancel
              </Button>
              <Button
                onClick={editingItem ? handleUpdateItem : handleAddItem}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {editingItem ? 'Update' : 'Add'} Item
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
