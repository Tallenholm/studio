'use client';

import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { loadJobs, saveJobs } from '@/lib/localStorageService';
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
    const allJobs = loadJobs();
    const activeOrUpcomingJobs = allJobs.filter(job => {
      const status = getJobStatus(job);
      return status === 'active' || status === 'upcoming';
    });
    setJobs(activeOrUpcomingJobs);
  }, []);

  const handleSave = () => {
    if (!selectedJobId || !user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a job to save the note to.',
      });
      return;
    }

    const allJobs = loadJobs();
    const jobIndex = allJobs.findIndex(j => j.id === selectedJobId);

    if (jobIndex === -1) {
      toast({ variant: 'destructive', title: 'Error', description: 'Selected job not found.' });
      return;
    }
    
    const jobToUpdate = allJobs[jobIndex];
    const newNote = {
      timestamp: new Date().toISOString(),
      content: `[${calculatorName}]: ${resultString}`,
      author: user.name,
    };

    const updatedJob = {
      ...jobToUpdate,
      notes: [...(jobToUpdate.notes || []), newNote],
    };

    allJobs[jobIndex] = updatedJob;
    saveJobs(allJobs);

    toast({
      title: 'Note Saved',
      description: `Calculation saved to job: ${jobToUpdate.name}.`,
    });
    setSelectedJobId(''); // Reset after saving
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
