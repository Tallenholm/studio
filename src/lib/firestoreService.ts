
import { db } from './firebase';
import { collection, getDocs, addDoc, doc, getDoc, updateDoc, deleteDoc, arrayUnion, writeBatch } from 'firebase/firestore';
import type { Job, Client, ExpenseReport, FleetAsset, InspectionReport, MaintenanceLog, WorkOrder, Task, TimeOffRequest, Violation, ManagedDocument, InventoryItem, SnowRoute, Rental, CalendarEvent } from './types';

// Generic CRUD factory
const createCrudService = <T extends { id: string }>(collectionName: string) => {
    if (!db) {
        console.error(`Firestore not initialized. Cannot create service for ${collectionName}.`);
        // Return dummy functions if Firestore is not available
        return {
            getAll: async (): Promise<T[]> => [],
            getById: async (id: string): Promise<T | null> => null,
            add: async (data: Omit<T, 'id'>): Promise<string> => { throw new Error("Firestore not initialized."); },
            update: async (id: string, data: Partial<T>): Promise<void> => { throw new Error("Firestore not initialized."); },
            delete: async (id: string): Promise<void> => { throw new Error("Firestore not initialized."); },
            batchAdd: async (data: Omit<T, 'id'>[]): Promise<void> => { throw new Error("Firestore not initialized."); },
        };
    }
    const serviceCollection = collection(db, collectionName);

    return {
        getAll: async (): Promise<T[]> => {
            const snapshot = await getDocs(serviceCollection);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
        },
        getById: async (id: string): Promise<T | null> => {
            const docRef = doc(db, collectionName, id);
            const docSnap = await getDoc(docRef);
            return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as T : null;
        },
        add: async (data: Omit<T, 'id'>): Promise<string> => {
            const docRef = await addDoc(serviceCollection, data);
            return docRef.id;
        },
        update: async (id: string, data: Partial<T>): Promise<void> => {
            const docRef = doc(db, collectionName, id);
            await updateDoc(docRef, data);
        },
        delete: async (id: string): Promise<void> => {
            const docRef = doc(db, collectionName, id);
            await deleteDoc(docRef);
        },
        batchAdd: async (data: Omit<T, 'id'>[]): Promise<void> => {
            const batch = writeBatch(db!);
            data.forEach(item => {
                const docRef = doc(serviceCollection);
                batch.set(docRef, item);
            });
            await batch.commit();
        }
    };
};

// Create services for each collection
export const { getAll: getJobs, getById: getJobById, add: addJob, update: updateJob, delete: deleteJob } = createCrudService<Job>('jobs');
export const { getAll: getClients, add: addClient, update: updateClient, delete: deleteClient } = createCrudService<Client>('clients');
export const { getAll: getExpenseReports, add: addExpenseReport, update: updateExpenseReport } = createCrudService<ExpenseReport>('expenseReports');
export const { getAll: getFleetAssets, add: addFleetAsset, update: updateFleetAsset, delete: deleteFleetAsset } = createCrudService<FleetAsset>('fleetAssets');
export const { getAll: getInspectionReports, getById: getInspectionReportById, add: addInspectionReport, update: updateInspectionReport } = createCrudService<InspectionReport>('inspectionReports');
export const { getAll: getMaintenanceLogs, add: addMaintenanceLog, update: updateMaintenanceLog, delete: deleteMaintenanceLog, batchAdd: batchAddMaintenanceLogs } = createCrudService<MaintenanceLog>('maintenanceLogs');
export const { getAll: getWorkOrders, add: addWorkOrder, update: updateWorkOrder, delete: deleteWorkOrder } = createCrudService<WorkOrder>('workOrders');
export const { getAll: getTasks, add: addTask, update: updateTask, delete: deleteTask } = createCrudService<Task>('tasks');
export const { getAll: getTimeOffRequests, add: addTimeOffRequest, update: updateTimeOffRequest } = createCrudService<TimeOffRequest>('timeOffRequests');
export const { getAll: getViolations, add: addViolation, delete: deleteViolation } = createCrudService<Violation>('violations');
export const { getAll: getDocuments, add: addDocument, delete: deleteDocument } = createCrudService<ManagedDocument>('documents');
export const { getAll: getInventory, add: addInventoryItem, update: updateInventoryItem, delete: deleteInventoryItem } = createCrudService<InventoryItem>('inventory');
export const { getAll: getSnowRoutes, add: addSnowRoute, update: updateSnowRoute, delete: deleteSnowRoute } = createCrudService<SnowRoute>('snowRoutes');
export const { getAll: getRentals, add: addRental, update: updateRental, delete: deleteRental } = createCrudService<Rental>('rentals');
export const { getAll: getCalendarEvents, add: addCalendarEvent, delete: deleteCalendarEvent } = createCrudService<CalendarEvent>('calendarEvents');


// Special case functions
export const addNoteToJob = async (jobId: string, note: Job['notes'][0]) => {
  if (!db) throw new Error('Firestore is not initialized.');
  const jobDocRef = doc(db, 'jobs', jobId);
  await updateDoc(jobDocRef, {
    notes: arrayUnion(note)
  });
};
