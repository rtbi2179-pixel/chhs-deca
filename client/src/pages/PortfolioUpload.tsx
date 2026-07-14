import { useState, useRef } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, FileText, Trash2, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function PortfolioUpload() {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Queries and mutations
  const { data: portfolios = [], isLoading } = trpc.portfolios.getUserPortfolios.useQuery();
  const uploadMutation = trpc.portfolios.uploadPortfolio.useMutation();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    // Validate file type (PDF, DOC, DOCX)
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only PDF and Word documents are allowed');
      return;
    }

    setUploading(true);
    try {
      // Upload file to S3 using manus-upload-file
      const formData = new FormData();
      formData.append('file', file);

      // For now, we'll use a simple approach - in production, use the S3 storage helper
      // This is a placeholder that would integrate with your storage system
      const fileUrl = URL.createObjectURL(file);
      const fileKey = `portfolios/${Date.now()}-${file.name}`;

      // Save to database
      await uploadMutation.mutateAsync({
        fileName: file.name,
        fileUrl,
        fileKey,
        fileSize: file.size,
        mimeType: file.type,
      });

      toast.success('Portfolio uploaded successfully!');
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Refetch portfolios
      const utils = trpc.useUtils();
      utils.portfolios.getUserPortfolios.invalidate();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload portfolio');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Your Portfolios</h1>
          <p className="text-slate-400">Upload and manage your DECA competition portfolios</p>
        </div>

        {/* Upload Card */}
        <Card className="bg-slate-800/50 border-slate-700 mb-8 p-8">
          <div className="flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Upload Your Portfolio</h2>
            <p className="text-slate-400 text-center mb-6">
              Upload PDF or Word documents (max 10MB). Only admins can view all portfolios.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {uploading ? 'Uploading...' : 'Choose File'}
            </Button>
          </div>
        </Card>

        {/* Portfolios List */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Your Uploads</h2>
          {isLoading ? (
            <div className="text-center py-8 text-slate-400">Loading...</div>
          ) : portfolios.length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700 p-8 text-center">
              <FileText className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No portfolios uploaded yet</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {portfolios.map((portfolio: any) => (
                <Card key={portfolio.id} className="bg-slate-800/50 border-slate-700 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <FileText className="w-8 h-8 text-blue-400 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">{portfolio.fileName}</h3>
                        <p className="text-sm text-slate-400">
                          {(portfolio.fileSize / 1024 / 1024).toFixed(2)} MB • Uploaded {new Date(portfolio.uploadedAt).toLocaleDateString()}
                        </p>
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
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
