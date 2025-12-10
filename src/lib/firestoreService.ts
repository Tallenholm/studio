
import { initializeFirebase } from './firebase-initialize';
import { collection, getDocs, doc, getDoc, writeBatch, arrayUnion, Firestore, addDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { Job, Client, ExpenseReport, FleetAsset, InspectionReport, MaintenanceLog, WorkOrder, Task, TimeOffRequest, Violation, ManagedDocument, InventoryItem, SnowRoute, Rental, CalendarEvent, User, NotificationMessage } from './types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';


let dbInstance: Firestore | null = null;
/**
 * Retrieves the global Firestore instance.
 * This is safe to call from both server and client components because
 * `initializeFirebase` ensures it only initializes once.
 * @returns {Firestore} The Firestore database instance.
 */
export function getFirestoreInstance(): Firestore {
    if (!dbInstance) {
        const { db } = initializeFirebase();
        if (!db) {
            throw new Error("Firestore is not initialized. Ensure Firebase config is set up correctly.");
        }
        dbInstance = db;
    }
    return dbInstance;
}

// Generic CRUD factory
const createCrudService = <T extends { id: string }>(collectionName: string) => {
    
    const getCollection = () => {
        const db = getFirestoreInstance();
        return collection(db, collectionName);
    }

    return {
        getAll: async (): Promise<T[]> => {
            const snapshot = await getDocs(getCollection());
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
        },
        getById: async (id: string): Promise<T | null> => {
            const db = getFirestoreInstance();
            const docRef = doc(db, collectionName, id);
            const docSnap = await getDoc(docRef);
            return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as T : null;
        },
        add: async (data: Omit<T, 'id'>, id?: string): Promise<string> => {
            const db = getFirestoreInstance();
            const colRef = collection(db, collectionName);
            if (id) {
                const docRef = doc(colRef, id);
                setDoc(docRef, data, {}).catch(error => {
                    errorEmitter.emit(
                        'permission-error',
                        new FirestorePermissionError({
                            path: docRef.path,
                            operation: 'create',
                            requestResourceData: data,
                        })
                    );
                });
                return id;
            }
            // Use server-side addDoc for Server Actions for reliability
            if (typeof window === 'undefined') {
                const docRef = await addDoc(colRef, data);
                return docRef.id;
            }
            const docRef = addDoc(colRef, data)
              .catch(error => {
                errorEmitter.emit(
                  'permission-error',
                  new FirestorePermissionError({
                    path: colRef.path,
                    operation: 'create',
                    requestResourceData: data,
                  })
                );
                // Return a rejected promise to propagate the error if needed
                return Promise.reject(error);
              });
            return (await docRef).id;
        },
        update: async (id: string, data: Partial<Omit<T, 'id'>>): Promise<void> => {
            const db = getFirestoreInstance();
            const docRef = doc(db, collectionName, id);
            updateDoc(docRef, data).catch(error => {
                errorEmitter.emit(
                  'permission-error',
                  new FirestorePermissionError({
                    path: docRef.path,
                    operation: 'update',
                    requestResourceData: data,
                  })
                );
            });
        },
        delete: async (id: string): Promise<void> => {
            const db = getFirestoreInstance();
            const docRef = doc(db, collectionName, id);
            deleteDoc(docRef).catch(error => {
                errorEmitter.emit(
                  'permission-error',
                  new FirestorePermissionError({
                    path: docRef.path,
                    operation: 'delete',
                  })
                );
            });
        },
        batchAdd: async (data: Omit<T, 'id'>[]): Promise<void> => {
            const db = getFirestoreInstance();
            const batch = writeBatch(db);
            const col = collection(db, collectionName);
            data.forEach(item => {
                const docRef = doc(col);
                batch.set(docRef, item);
            });
            batch.commit().catch(error => {
                 errorEmitter.emit(
                  'permission-error',
                  new FirestorePermissionError({
                    path: col.path,
                    operation: 'write',
                    requestResourceData: data,
                  })
                );
            })
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
  const db = getFirestoreInstance();
  const jobDocRef = doc(db, 'jobs', jobId);
  updateDoc(jobDocRef, {
    notes: arrayUnion(note)
  }).catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: jobDocRef.path,
          operation: 'update',
          requestResourceData: { notes: arrayUnion(note) },
        })
      );
  });
};
