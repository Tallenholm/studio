

import { initializeFirebase } from './firebase-initialize';
import { collection, getDocs, doc, getDoc, writeBatch, arrayUnion } from 'firebase/firestore';
import type { Job, Client, ExpenseReport, FleetAsset, InspectionReport, MaintenanceLog, WorkOrder, Task, TimeOffRequest, Violation, ManagedDocument, InventoryItem, SnowRoute, Rental, CalendarEvent, User, NotificationMessage } from './types';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

const { db } = initializeFirebase();

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
                const docRef = doc(getCollection(), id);
                setDocumentNonBlocking(docRef, data, {});
                return id;
            }
            const docRef = await addDocumentNonBlocking(getCollection(), data);
            return docRef.id;
        },
        update: async (id: string, data: Partial<Omit<T, 'id'>>): Promise<void> => {
            const docRef = doc(getCollection(), id);
            updateDocumentNonBlocking(docRef, data);
        },
        delete: async (id: string): Promise<void> => {
            const docRef = doc(getCollection(), id);
            deleteDocumentNonBlocking(docRef);
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
export const { getAll: getClients, getById: getClientById, add: addClient, update: updateClient, delete: deleteClient } = createCrudService<Client>('clients');
export const { getAll: getUsers, getById: getUserById, add: addUser, update: updateUser, delete: deleteUser } = createCrudService<User>('users');
export const { getAll: getExpenseReports, getById: getExpenseReportById, add: addExpenseReport, update: updateExpenseReport } = createCrudService<ExpenseReport>('expenseReports');
export const { getAll: getFleetAssets, getById: getFleetAssetById, add: addFleetAsset, update: updateFleetAsset, delete: deleteFleetAsset } = createCrudService<FleetAsset>('fleetAssets');
export const { getAll: getInspectionReports, getById: getInspectionReportById, add: addInspectionReport, update: updateInspectionReport } = createCrudService<InspectionReport>('inspectionReports');
export const { getAll: getMaintenanceLogs, getById: getMaintenanceLogById, add: addMaintenanceLog, update: updateMaintenanceLog, delete: deleteMaintenanceLog, batchAdd: batchAddMaintenanceLogs } = createCrudService<MaintenanceLog>('maintenanceLogs');
export const { getAll: getWorkOrders, getById: getWorkOrderById, add: addWorkOrder, update: updateWorkOrder, delete: deleteWorkOrder } = createCrudService<WorkOrder>('workOrders');
export const { getAll: getTasks, getById: getTaskById, add: addTask, update: updateTask, delete: deleteTask } = createCrudService<Task>('tasks');
export const { getAll: getTimeOffRequests, getById: getTimeOffRequestById, add: addTimeOffRequest, update: updateTimeOffRequest } = createCrudService<TimeOffRequest>('timeOffRequests');
export const { getAll: getViolations, getById: getViolationById, add: addViolation, delete: deleteViolation } = createCrudService<Violation>('violations');
export const { getAll: getDocuments, getById: getDocumentById, add: addDocument, delete: deleteDocument } = createCrudService<ManagedDocument>('documents');
export const { getAll: getInventory, getById: getInventoryItemById, add: addInventoryItem, update: updateInventoryItem, delete: deleteInventoryItem } = createCrudService<InventoryItem>('inventory');
export const { getAll: getSnowRoutes, getById: getSnowRouteById, add: addSnowRoute, update: updateSnowRoute, delete: deleteSnowRoute } = createCrudService<SnowRoute>('snowRoutes');
export const { getAll: getRentals, getById: getRentalById, add: addRental, update: updateRental, delete: deleteRental } = createCrudService<Rental>('rentals');
export const { getAll: getCalendarEvents, getById: getCalendarEventById, add: addCalendarEvent, update: updateCalendarEvent, delete: deleteCalendarEvent } = createCrudService<CalendarEvent>('calendarEvents');
export const { getAll: getNotifications, getById: getNotificationById, add: addNotification, update: updateNotification, delete: deleteNotification } = createCrudService<NotificationMessage>('notifications');


// Special case functions
export const addNoteToJob = async (jobId: string, note: Job['notes'][number]) => {
  if (!db) throw new Error('Firestore is not initialized.');
  const jobDocRef = doc(db, 'jobs', jobId);
  updateDocumentNonBlocking(jobDocRef, {
    notes: arrayUnion(note)
  });
};
