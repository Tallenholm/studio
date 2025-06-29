
'use client';

import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getJobs, addNoteToJob } from '@/lib/firestoreService';
import type { Job } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { Save } from 'lucide-react';
import { getJobStatus } from '@/lib/job-utils';
import { startOfDay } from 'date-fns';

interface SaveToJobProps {
  calculatorName: string;
  resultString: string;
}

export default function SaveToJob({ calculatorName, resultString }: SaveToJobProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchJobs = async () => {
      const allJobs = await getJobs();
      const activeOrUpcomingJobs = allJobs.filter(job => {
        const status = getJobStatus(job);
        return status === 'active' || status === 'upcoming';
      });
      setJobs(activeOrUpcomingJobs);
    };
    fetchJobs();
  }, []);

  const handleSave = async () => {
    if (!selectedJobId || !user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a job to save the note to.',
      });
      return;
    }
    
    const newNote = {
      timestamp: new Date().toISOString(),
      content: `[${calculatorName}]: ${resultString}`,
      author: user.name,
    };
    
    try {
        await addNoteToJob(selectedJobId, newNote);
        const job = jobs.find(j => j.id === selectedJobId);
        toast({
          title: 'Note Saved',
          description: `Calculation saved to job: ${job?.name}.`,
        });
        setSelectedJobId(''); // Reset after saving
    } catch (error) {
        toast({ variant: 'destructive', title: 'Database Error', description: 'Could not save note to job.' });
    }
  };

  if (jobs.length === 0) {
    return <p className="text-sm text-center text-muted-foreground">No active jobs available to save notes to.</p>;
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-center text-muted-foreground">Save Result to Job Notes</h4>
      <div className="flex items-center gap-2">
        <Select value={selectedJobId} onValueChange={setSelectedJobId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a job..." />
          </SelectTrigger>
          <SelectContent>
            {jobs.map(job => (
              <SelectItem key={job.id} value={job.id}>{job.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleSave} disabled={!selectedJobId} aria-label="Save to Job Notes">
          <Save className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
