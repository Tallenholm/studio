
import { db } from './firebase';
import { collection, getDocs, addDoc, doc, getDoc, updateDoc, deleteDoc, arrayUnion, writeBatch, setDoc } from 'firebase/firestore';
import type { Job, Client, ExpenseReport, FleetAsset, InspectionReport, MaintenanceLog, WorkOrder, Task, TimeOffRequest, Violation, ManagedDocument, InventoryItem, SnowRoute, Rental, CalendarEvent, User, NotificationMessage } from './types';

// Generic CRUD factory
const createCrudService = <T extends { id: string }>(collectionName: string) => {
    
    const getCollection = () => {
        if (!db) {
            throw new Error(`Firestore not initialized. Cannot access collection '${collectionName}'.`);
        }
        return collection(db, collectionName);
    };

    return {
        getAll: async (): Promise<T[]> => {
            const snapshot = await getDocs(getCollection());
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
        },
        getById: async (id: string): Promise<T | null> => {
            const docRef = doc(getCollection(), id);
            const docSnap = await getDoc(docRef);
            return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as T : null;
        },
        add: async (data: Omit<T, 'id'>, id?: string): Promise<string> => {
            if (id) {
                // If an ID is provided, use it to create the document
                const docRef = doc(getCollection(), id);
                await setDoc(docRef, data);
                return id;
            }
            const docRef = await addDoc(getCollection(), data);
            return docRef.id;
        },
        update: async (id: string, data: Partial<Omit<T, 'id'>>): Promise<void> => {
            const docRef = doc(getCollection(), id);
            await updateDoc(docRef, data);
        },
        delete: async (id: string): Promise<void> => {
            const docRef = doc(getCollection(), id);
            await deleteDoc(docRef);
        },
        batchAdd: async (data: Omit<T, 'id'>[]): Promise<void> => {
            if (!db) throw new Error("Firestore not initialized.");
            const batch = writeBatch(db);
            const col = getCollection();
            data.forEach(item => {
                const docRef = doc(col);
                batch.set(docRef, item);
            });
            await batch.commit();
        }
    };
};

// Create services for each collection
export const { getAll: getJobs, getById: getJobById, add: addJob, update: updateJob, delete: deleteJob } = createCrudService<Job>('jobs');
export const { getAll: getClients, add: addClient, update: updateClient, delete: deleteClient } = createCrudService<Client>('clients');
export const { getAll: getUsers, getById: getUserById, add: addUser, update: updateUser, delete: deleteUser } = createCrudService<User>('users');
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
export const { getAll: getNotifications, add: addNotification, update: updateNotification } = createCrudService<NotificationMessage>('notifications');


// Special case functions
export const addNoteToJob = async (jobId: string, note: Job['notes'][0]) => {
  if (!db) throw new Error('Firestore is not initialized.');
  const jobDocRef = doc(db, 'jobs', jobId);
  await updateDoc(jobDocRef, {
    notes: arrayUnion(note)
  });
};
