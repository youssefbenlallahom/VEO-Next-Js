"use client";
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface AddJobModalProps {
  onCreated?: () => void;
}

export function AddJobModal({ onCreated }: AddJobModalProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('Tunisia');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null); setSuccess(null);
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, location, description, department })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setSuccess('Job created');
      if (onCreated) onCreated();
  setTimeout(() => { setOpen(false); setTitle(''); setDescription(''); setDepartment(''); }, 800);
    } catch(err:any){
      setError(err.message);
    } finally { setLoading(false); }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="bg-veo-green hover:bg-veo-green/90 text-white flex items-center gap-2 shadow-sm">
        <Plus className="h-4 w-4" /> Add Job
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl border border-gray-200 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold tracking-tight">Create New Job Opening</DialogTitle>
            <p className="text-[11px] text-gray-500 mt-0.5">Fill the details; description supports bullet lists.</p>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium">Job Title<span className="text-red-500"> *</span></label>
                <Input value={title} onChange={e=>setTitle(e.target.value)} required placeholder="e.g. Data Analyst" className="h-11" />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium">Department</label>
                <Input value={department} onChange={e=>setDepartment(e.target.value)} placeholder="e.g. Analytics" className="h-11" />
              </div>
              <div className="space-y-1 md:col-span-2 md:grid md:grid-cols-2 md:gap-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium">Location</label>
                  <Input value={location} onChange={e=>setLocation(e.target.value)} placeholder="City, Country" className="h-11" />
                </div>
                <div className="hidden md:block"></div>
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="block text-sm font-medium">Job Description</label>
                <Textarea value={description} onChange={e=>setDescription(e.target.value)} rows={6} placeholder="Paste or write the job description including responsibilities & requirements..." className="resize-none" />
                <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                  <span>{description.length} characters</span>
                  <span>Include bullet points for better parsing</span>
                </div>
              </div>
            </div>
            {error && <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>}
            {success && <div className="rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-700">{success}</div>}
            <div className="flex justify-end gap-3 pt-1">
              <Button type="button" variant="outline" onClick={()=>setOpen(false)} disabled={loading} className="h-10">Cancel</Button>
              <Button type="submit" disabled={loading || !title} className="h-10 px-6">{loading? 'Creating...' : 'Create Job'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
