
import type { Job, JobStatus, Rental } from './types';
import { isAfter, isBefore, startOfDay, parseISO } from 'date-fns';

export const getJobStatus = (job: Job): JobStatus => {
  const today = startOfDay(new Date());
  const startDate = parseISO(job.startDate);
  const endDate = parseISO(job.endDate);

  if (isBefore(today, startDate)) {
    return 'upcoming';
  } else if (isAfter(today, endDate)) {
    return 'completed';
  } else {
    return 'active';
  }
};

export const getRentalStatus = (rental: Rental): JobStatus => {
  const today = startOfDay(new Date());
  const startDate = parseISO(rental.startDate);
  const endDate = parseISO(rental.endDate);

  if (isBefore(today, startDate)) {
    return 'upcoming';
  } else if (isAfter(today, endDate)) {
    return 'completed';
  } else {
    return 'active';
  }
};
