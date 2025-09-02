"use client";
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Upload, FileText, ArrowLeft, CheckCircle2, X, Eye } from 'lucide-react';

interface CandidateDraft {
  file: File;
  fullName: string;
  location: string;
  jobTitle: string;
}

interface AddCandidatesModalProps {
  onUploaded?: () => void;
}

export function AddCandidatesModal({ onUploaded }: AddCandidatesModalProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [drafts, setDrafts] = useState<CandidateDraft[]>([]);
  const [jobs, setJobs] = useState<string[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(()=>{
    if (open) {
      fetchJobs();
    }
  },[open]);

  async function fetchJobs() {
    try {
      setLoadingJobs(true);
      const res = await fetch('/api/jobs', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load jobs');
      const data = await res.json();
      setJobs(data.map((j:any)=> j.title));
    } catch(err:any){
      setError(err.message);
    } finally { setLoadingJobs(false); }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const incoming = Array.from(e.target.files || []).filter(f=> f.type === 'application/pdf');
    if (!incoming.length) return;
    setSelectedFiles(incoming);
    setDrafts(incoming.map(f=> ({ file: f, fullName: '', location: 'Tunisia', jobTitle: jobs[0] || '' })));
    setStep(2);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const incoming = Array.from(e.dataTransfer.files || []).filter(f=> f.type === 'application/pdf');
    if (!incoming.length) return;
    setSelectedFiles(incoming);
    setDrafts(incoming.map(f=> ({ file: f, fullName: '', location: 'Tunisia', jobTitle: jobs[0] || '' })));
    setStep(2);
  }
  function handleDragOver(e: React.DragEvent){ e.preventDefault(); }

  function updateDraft(index: number, patch: Partial<CandidateDraft>) {
    setDrafts(d => d.map((dr,i)=> i===index ? { ...dr, ...patch } : dr));
  }

  async function handleUpload() {
    setUploading(true); setError(null); setSuccess(null);
    try {
      const form = new FormData();
      drafts.forEach(dr => {
        form.append('file', dr.file);
        form.append('fullName', dr.fullName);
        form.append('location', dr.location);
        form.append('jobTitle', dr.jobTitle);
      });
      const res = await fetch('/api/candidates', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setSuccess(`${data.count} candidate(s) uploaded`);
      if (onUploaded) onUploaded();
      setTimeout(()=>{ setOpen(false); reset(); }, 1000);
    } catch(err:any){
      setError(err.message);
    } finally { setUploading(false); }
  }

  function reset(){
  setStep(1); setSelectedFiles([]); setDrafts([]); setError(null); setSuccess(null); setUploading(false); setPreviewUrl(null);
  }

  return (
    <>
      <Button
        onClick={()=> setOpen(true)}
        variant="outline"
        className="flex items-center gap-2"
      >
        <Plus className="h-4 w-4" />
        Add Candidates
      </Button>
      <Dialog open={open} onOpenChange={(v)=> { setOpen(v); if(!v) reset(); }}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold tracking-tight flex items-center gap-2">
              {step===2 && <button type="button" onClick={()=> setStep(1)} className="p-1 rounded hover:bg-gray-100"><ArrowLeft className="h-4 w-4" /></button>}
              {step===1? 'Upload CVs (PDF)' : 'Candidate Details'}
            </DialogTitle>
            <div className="flex items-center gap-3 mt-2 text-xs font-medium">
              <div className={`flex items-center gap-1 ${step===1? 'text-veo-green':'text-gray-400'}`}><div className={`h-5 w-5 flex items-center justify-center rounded-full border ${step===1? 'bg-veo-green text-white border-veo-green':'border-gray-300'}`}>1</div> Upload</div>
              <div className="h-px flex-1 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200" />
              <div className={`flex items-center gap-1 ${step===2? 'text-veo-green':'text-gray-400'}`}><div className={`h-5 w-5 flex items-center justify-center rounded-full border ${step===2? 'bg-veo-green text-white border-veo-green':'border-gray-300'}`}>2</div> Details</div>
            </div>
          </DialogHeader>
          {step === 1 && (
            <div className="space-y-6">
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="relative border-2 border-dashed rounded-xl p-14 text-center bg-gradient-to-br from-gray-50 to-white hover:border-veo-green/60 transition-colors"
              >
                <input id="cv-upload" type="file" accept="application/pdf" multiple hidden onChange={handleFileInput} />
                <div className="flex flex-col items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-veo-green/10 flex items-center justify-center"><Upload className="h-7 w-7 text-veo-green" /></div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">Drag & drop PDF CVs here</p>
                    <p className="text-xs text-gray-500 mt-1">or click to browse your files (multiple allowed)</p>
                  </div>
                  <Button onClick={()=> document.getElementById('cv-upload')?.click()} className="px-5">Browse Files</Button>
                </div>
              </div>
              {selectedFiles.length > 0 && (
                <div className="rounded-lg border bg-gray-50/60 p-3 text-xs text-gray-600 flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-veo-green" /> {selectedFiles.length} file(s) ready – proceeding to details...</div>
              )}
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {drafts.map((dr, i)=>(
                <div key={i} className="border rounded-lg p-4 space-y-4 bg-white shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700"><FileText className="h-4 w-4 text-veo-green" /> {dr.file.name}</div>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={()=> {
                        const url = URL.createObjectURL(dr.file);
                        setPreviewUrl(url);
                      }} className="h-8 px-3 flex items-center gap-1"><Eye className="h-3 w-3" /> View</Button>
                      <Button type="button" variant="outline" size="sm" onClick={()=> {
                        setDrafts(d => d.filter((_,idx)=> idx!==i));
                      }} className="h-8 px-2 text-red-600 border-red-200 hover:bg-red-50"><X className="h-3 w-3" /></Button>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold tracking-wide">Full Name<span className="text-red-500"> *</span></label>
                      <Input value={dr.fullName} onChange={e=> updateDraft(i,{ fullName: e.target.value })} required placeholder="e.g. Youssef Ben Lallahom" className="h-10" />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold tracking-wide">Location</label>
                      <Input value={dr.location} onChange={e=> updateDraft(i,{ location: e.target.value })} placeholder="City, Country" className="h-10" />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold tracking-wide">Applied Job<span className="text-red-500"> *</span></label>
                      <Select value={dr.jobTitle} onValueChange={(v)=> updateDraft(i,{ jobTitle: v })}>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select job" />
                        </SelectTrigger>
                        <SelectContent>
                          {jobs.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
              {!drafts.length && <div className="text-center text-sm text-gray-500 py-10">No files remaining. <button className="underline" onClick={()=> setStep(1)}>Upload again</button></div>}
              {error && <p className="text-sm text-red-600">{error}</p>}
              {success && <p className="text-sm text-green-600">{success}</p>}
              <div className="flex justify-between pt-2">
                <Button type="button" variant="outline" onClick={()=> setStep(1)} disabled={uploading} className="h-10 px-5">Back</Button>
                <Button onClick={handleUpload} disabled={uploading || drafts.some(d=> !d.fullName || !d.jobTitle) || !drafts.length} className="h-10 px-6">
                  {uploading? 'Uploading...' : `Upload ${drafts.length} Candidate${drafts.length>1?'s':''}`}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Preview Modal */}
      <Dialog open={!!previewUrl} onOpenChange={(o)=> { if(!o && previewUrl){ URL.revokeObjectURL(previewUrl); setPreviewUrl(null);} }}>
        <DialogContent className="max-w-5xl h-[85vh] p-0 overflow-hidden bg-white">
          <DialogHeader className="sr-only"><DialogTitle>CV Preview</DialogTitle></DialogHeader>
          {previewUrl && (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-4 py-2 border-b bg-white">
                <h3 className="text-sm font-medium">CV Preview</h3>
                <span className="text-[11px] text-gray-500">Local (not uploaded)</span>
              </div>
              <embed src={`${previewUrl}#toolbar=0&navpanes=0&zoom=page-width`} type="application/pdf" className="flex-1 w-full" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
