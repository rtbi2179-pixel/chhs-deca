import { useMemo, useRef, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock3, FileText, FolderUp, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useLocation } from 'wouter';

const MAX_BYTES = 12 * 1024 * 1024;

async function fileToBase64(file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    let chunk = '';
    const end = Math.min(offset + chunkSize, bytes.length);
    for (let index = offset; index < end; index += 1) chunk += String.fromCharCode(bytes[index] ?? 0);
    binary += chunk;
  }
  return window.btoa(binary);
}

function statusCopy(status: string) {
  const labels: Record<string, string> = {
    uploading: 'Uploading file', uploaded: 'File uploaded', reading_submission: 'Reading submission', checking_requirements: 'Checking event requirements', analyzing_rubric: 'Analyzing rubric', reviewing_evidence: 'Reviewing evidence', checking_consistency: 'Checking consistency', building_evaluation: 'Building evaluation', ready: 'Ready for review', failed: 'Processing needs attention',
  };
  return labels[status] ?? status.replaceAll('_', ' ');
}

export default function PortfolioUpload() {
  const [, navigate] = useLocation();
  const checkpointId = useMemo(() => Number(new URLSearchParams(window.location.search).get('checkpoint') || 0), []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const utils = trpc.useUtils();
  const { data: checkpoints = [], isLoading: checkpointsLoading } = trpc.portfolio.listMyCheckpoints.useQuery();
  const selected = checkpoints.find((entry) => entry.checkpoint.id === checkpointId) ?? null;
  const submissionId = selected?.submission?.id;
  const { data: versions = [], isLoading: versionsLoading } = trpc.portfolio.listVersions.useQuery({ submissionId: submissionId || 0 }, { enabled: Boolean(submissionId) });
  const upload = trpc.portfolio.uploadVersion.useMutation({
    onSuccess: async (result) => {
      await Promise.all([utils.portfolio.listMyCheckpoints.invalidate(), utils.portfolio.listVersions.invalidate()]);
      setSelectedFile(null);
      setNote('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      toast.success(`Version ${result.versionNumber} is saved and ready for review.`);
    },
    onError: (error) => toast.error(error.message),
  });
  const chooseFile = (file?: File) => {
    if (!file) return;
    if (file.size > MAX_BYTES) return toast.error('Choose a file smaller than 12 MB.');
    setSelectedFile(file);
  };
  const submit = async () => {
    if (!selected || !selectedFile) return;
    try {
      const fileBase64 = await fileToBase64(selectedFile);
      upload.mutate({ checkpointId: selected.checkpoint.id, fileName: selectedFile.name, mimeType: selectedFile.type || 'application/octet-stream', fileBase64, notes: note.trim() || undefined });
    } catch {
      toast.error('The selected file could not be prepared for upload.');
    }
  };

  if (checkpointsLoading) return <main className="min-h-screen px-5 pb-12 pt-28"><Card className="mx-auto max-w-4xl border-white/10 bg-slate-950/55 p-6 text-slate-300">Loading your chapter portfolio checkpoints…</Card></main>;
  if (!checkpointId || !selected) return <main className="min-h-screen px-5 pb-12 pt-28"><div className="mx-auto max-w-4xl"><button type="button" onClick={() => navigate('/timeline')} className="mb-5 inline-flex items-center gap-2 text-sm text-blue-200 hover:text-white"><ArrowLeft className="h-4 w-4" />Back to timeline</button><Card className="border-white/10 bg-slate-950/55 p-6"><div className="flex items-center gap-3"><FolderUp className="h-6 w-6 text-blue-300" /><div><h1 className="text-2xl font-semibold text-white">Your portfolio checkpoints</h1><p className="mt-1 text-sm text-slate-400">Choose a chapter-assigned checkpoint. Blue Blazer already knows the event, team, requirement, and due date.</p></div></div><div className="mt-6 space-y-3">{checkpoints.length ? checkpoints.map((entry) => <button type="button" key={`${entry.checkpoint.id}-${entry.subject.subjectKey}`} onClick={() => navigate(`/portfolio-upload?checkpoint=${entry.checkpoint.id}`)} className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-blue-300/30 hover:bg-blue-400/[0.06]"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold text-white">{entry.checkpoint.title}</p><p className="mt-1 text-sm text-slate-400">{entry.subject.subjectType === 'team' ? 'Shared team portfolio' : 'Individual portfolio'} · {entry.subject.eventCode}</p></div><div className="text-right"><p className="text-sm text-slate-200">{entry.checkpoint.dueAt ? new Date(entry.checkpoint.dueAt).toLocaleString() : 'No due date'}</p><p className="mt-1 text-xs text-blue-200">{entry.submission?.status?.replaceAll('_', ' ') || 'Not started'}</p></div></div></button>) : <div className="rounded-xl border border-dashed border-white/15 p-8 text-center"><CheckCircle2 className="mx-auto h-8 w-8 text-slate-500" /><p className="mt-3 font-medium text-white">No published portfolio checkpoints</p><p className="mt-1 text-sm text-slate-400">Your chapter advisor has not assigned portfolio work to your event or team yet.</p></div>}</div></Card></div></main>;

  const checkpoint = selected.checkpoint;
  const isLate = Boolean(checkpoint.dueAt && new Date(checkpoint.dueAt).getTime() < Date.now());
  return <main className="min-h-screen px-4 pb-12 pt-24 sm:px-6"><div className="mx-auto max-w-5xl"><button type="button" onClick={() => navigate('/portfolio-upload')} className="mb-5 inline-flex items-center gap-2 text-sm text-blue-200 hover:text-white"><ArrowLeft className="h-4 w-4" />All assigned checkpoints</button><div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]"><section className="space-y-5"><Card className="border-blue-300/15 bg-gradient-to-br from-blue-500/10 via-slate-950/60 to-slate-950/40 p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">{selected.subject.eventCode} · {selected.subject.subjectType === 'team' ? 'Shared team submission' : 'Individual submission'}</p><h1 className="mt-2 text-3xl font-semibold text-white">{checkpoint.title}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">{checkpoint.description || 'Your chapter advisor has not added additional instructions for this checkpoint.'}</p></div><div className="rounded-xl border border-white/10 bg-slate-950/35 px-4 py-3 text-right"><p className="text-xs uppercase tracking-[0.12em] text-slate-400">Due</p><p className="mt-1 font-medium text-white">{checkpoint.dueAt ? new Date(checkpoint.dueAt).toLocaleString() : 'No due date'}</p></div></div></Card>
  {isLate && !checkpoint.allowLate ? <Card className="border-rose-300/20 bg-rose-500/10 p-4"><div className="flex gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-200" /><p className="text-sm leading-6 text-rose-50">This deadline has passed and late submissions are not accepted. Contact your advisor; Blue Blazer does not discard prior portfolio work.</p></div></Card> : <Card className="border-white/10 bg-slate-950/55 p-6"><div className="flex items-center gap-3"><Upload className="h-5 w-5 text-blue-300" /><div><h2 className="font-semibold text-white">Upload a new version</h2><p className="text-sm text-slate-400">This is a real numbered submission version. The recorded processing status reflects completed server work, not a timer.</p></div></div><div className="mt-5 rounded-xl border border-dashed border-white/15 bg-white/[0.025] p-5"><input ref={fileInputRef} type="file" className="hidden" onChange={(event) => chooseFile(event.target.files?.[0])} disabled={upload.isPending} /><div className="flex flex-col items-center text-center"><FileText className="h-9 w-9 text-blue-300" /><p className="mt-3 font-medium text-white">{selectedFile ? selectedFile.name : 'Choose your portfolio file'}</p><p className="mt-1 text-xs text-slate-400">{selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : `Required type: ${checkpoint.submissionType.replaceAll('_', ' ')} · Maximum 12 MB`}</p><Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={upload.isPending} className="mt-4 border-blue-300/20 text-blue-100 hover:bg-blue-400/10">Choose file</Button></div></div><label className="mt-4 block text-sm font-medium text-slate-200">Revision note <span className="font-normal text-slate-500">(optional)</span><textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={2000} placeholder="What changed in this version?" className="mt-2 min-h-24 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm font-normal text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400/60" /></label><Button type="button" onClick={submit} disabled={!selectedFile || upload.isPending} className="mt-4 w-full bg-blue-600 text-white hover:bg-blue-500">{upload.isPending ? 'Saving version…' : 'Save portfolio version'}</Button></Card>}</section>
  <aside><Card className="border-white/10 bg-slate-950/55 p-5"><div className="flex items-center gap-2"><Clock3 className="h-5 w-5 text-blue-300" /><h2 className="font-semibold text-white">Version history</h2></div><div className="mt-4 space-y-3">{versionsLoading ? <p className="text-sm text-slate-400">Loading versions…</p> : versions.length ? versions.map((version) => <div key={version.id} className="rounded-lg border border-white/10 bg-white/[0.025] p-3"><div className="flex items-center justify-between gap-2"><p className="font-medium text-white">Version {version.versionNumber}</p><span className="text-xs text-blue-200">{statusCopy(version.processingStatus)}</span></div><p className="mt-1 text-xs text-slate-400">{new Date(version.submittedAt).toLocaleString()}</p>{version.notes ? <p className="mt-2 text-xs leading-5 text-slate-300">{version.notes}</p> : null}{version.files.map((file) => <p key={file.id} className="mt-2 truncate text-xs text-slate-400">{file.fileName} · {file.extractionStatus === 'extracted' ? 'text read' : file.extractionStatus.replaceAll('_', ' ')}</p>)}</div>) : <p className="text-sm leading-6 text-slate-400">No saved version yet. Uploading does not overwrite your work.</p>}</div></Card></aside></div></div></main>;
}
