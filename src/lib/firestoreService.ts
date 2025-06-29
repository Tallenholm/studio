
import { db } from './firebase';
import { collection, getDocs, addDoc, doc, getDoc, updateDoc, deleteDoc, arrayUnion } from 'firebase/firestore';
import type { Job, Client, ExpenseReport } from './types';

// === Job Functions ===
const JOBS_COLLECTION = 'jobs';
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


// === Client Functions ===
const CLIENTS_COLLECTION = 'clients';
export const getClients = async (): Promise<Client[]> => {
    if (!db) return [];
    const clientsCollection = collection(db, CLIENTS_COLLECTION);
    const clientsSnapshot = await getDocs(clientsCollection);
    return clientsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
};

export const addClient = async (clientData: Omit<Client, 'id'>): Promise<string> => {
    if (!db) throw new Error("Firestore is not initialized.");
    const clientsCollection = collection(db, CLIENTS_COLLECTION);
    const docRef = await addDoc(clientsCollection, clientData);
    return docRef.id;
};

export const updateClient = async (id: string, clientData: Partial<Client>): Promise<void> => {
    if (!db) throw new Error("Firestore is not initialized.");
    const clientDocRef = doc(db, CLIENTS_COLLECTION, id);
    await updateDoc(clientDocRef, clientData);
};

export const deleteClient = async (id: string): Promise<void> => {
    if (!db) throw new Error("Firestore is not initialized.");
    const clientDocRef = doc(db, CLIENTS_COLLECTION, id);
    await deleteDoc(clientDocRef);
};

// === Expense Report Functions ===
const EXPENSE_REPORTS_COLLECTION = 'expenseReports';
export const getExpenseReports = async (): Promise<ExpenseReport[]> => {
    if (!db) return [];
    const reportsCollection = collection(db, EXPENSE_REPORTS_COLLECTION);
    const reportsSnapshot = await getDocs(reportsCollection);
    return reportsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExpenseReport));
}

export const addExpenseReport = async (reportData: Omit<ExpenseReport, 'id'>): Promise<string> => {
    if (!db) throw new Error("Firestore is not initialized.");
    const reportsCollection = collection(db, EXPENSE_REPORTS_COLLECTION);
    const docRef = await addDoc(reportsCollection, reportData);
    return docRef.id;
}

export const updateExpenseReport = async (id: string, reportData: Partial<ExpenseReport>): Promise<void> => {
    if (!db) throw new Error("Firestore is not initialized.");
    const reportDocRef = doc(db, EXPENSE_REPORTS_COLLECTION, id);
    await updateDoc(reportDocRef, reportData);
}
