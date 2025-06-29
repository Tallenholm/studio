
import { db } from './firebase';
import { collection, getDocs, addDoc, doc, getDoc, updateDoc, deleteDoc, arrayUnion } from 'firebase/firestore';
import type { Job } from './types';

const JOBS_COLLECTION = 'jobs';

// === Job Functions ===

export const getJobs = async (): Promise<Job[]> => {
  if (!db) return [];
  const jobsCollection = collection(db, JOBS_COLLECTION);
  const jobsSnapshot = await getDocs(jobsCollection);
  return jobsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
};

export const getJobById = async (id: string): Promise<Job | null> => {
    if (!db) return null;
    const jobDocRef = doc(db, JOBS_COLLECTION, id);
    const jobDoc = await getDoc(jobDocRef);
    if (jobDoc.exists()) {
        return { id: jobDoc.id, ...jobDoc.data() } as Job;
    }
    return null;
}

export const addJob = async (jobData: Omit<Job, 'id'>): Promise<string> => {
    if (!db) throw new Error("Firestore is not initialized.");
    const jobsCollection = collection(db, JOBS_COLLECTION);
    const docRef = await addDoc(jobsCollection, jobData);
    return docRef.id;
};

export const updateJob = async (id: string, jobData: Partial<Job>): Promise<void> => {
    if (!db) throw new Error("Firestore is not initialized.");
    const jobDocRef = doc(db, JOBS_COLLECTION, id);
    await updateDoc(jobDocRef, jobData);
};

export const deleteJob = async (id: string): Promise<void> => {
    if (!db) throw new Error("Firestore is not initialized.");
    const jobDocRef = doc(db, JOBS_COLLECTION, id);
    await deleteDoc(jobDocRef);
};

export const addNoteToJob = async (jobId: string, note: Job['notes'][0]) => {
  if (!db) throw new Error('Firestore is not initialized.');
  const jobDocRef = doc(db, JOBS_COLLECTION, jobId);
  await updateDoc(jobDocRef, {
    notes: arrayUnion(note)
  });
};
