
import type { Job, JobStatus } from './types';
import { isAfter, isBefore, startOfDay } from 'date-fns';

export const getJobStatus = (job: Job): JobStatus => {
  const today = startOfDay(new Date());
  const startDate = new Date(job.startDate);
  const endDate = new Date(job.endDate);

  if (isBefore(today, startDate)) {
    return 'upcoming';
  } else if (isAfter(today, endDate)) {
    return 'completed';
  } else {
    return 'active';
  }
};
