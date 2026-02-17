import { initializeFirebase } from '@/firebase';
import { collection, getDocs, doc, getDoc, writeBatch, arrayUnion, Firestore, addDoc, setDoc, updateDoc, deleteDoc, query, where, documentId } from 'firebase/firestore';
import type { Job, Client, ExpenseReport, FleetAsset, InspectionReport, MaintenanceLog, WorkOrder, Task, TimeOffRequest, Violation, ManagedDocument, InventoryItem, SnowRoute, Rental, CalendarEvent, User, NotificationMessage, InspectionStatus, JobNote } from './types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { format, startOfDay, subMonths } from 'date-fns';


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
                await setDoc(docRef, data).catch(error => {
                    errorEmitter.emit(
                        'permission-error',
                        new FirestorePermissionError({
                            path: docRef.path,
                            operation: 'create',
                            requestResourceData: data,
                        })
                    );
                    throw error;
                });
                return id;
            }

            const docRefPromise = addDoc(colRef, data).catch(error => {
                errorEmitter.emit(
                    'permission-error',
                    new FirestorePermissionError({
                        path: colRef.path,
                        operation: 'create',
                        requestResourceData: data,
                    })
                );
                throw error;
            });

            return (await docRefPromise).id;
        },
        update: async (id: string, data: Partial<Omit<T, 'id'>>): Promise<void> => {
            const db = getFirestoreInstance();
            const docRef = doc(db, collectionName, id);
            await updateDoc(docRef, data).catch(error => {
                errorEmitter.emit(
                    'permission-error',
                    new FirestorePermissionError({
                        path: docRef.path,
                        operation: 'update',
                        requestResourceData: data,
                    })
                );
                throw error;
            });
        },
        delete: async (id: string): Promise<void> => {
            const db = getFirestoreInstance();
            const docRef = doc(db, collectionName, id);
            await deleteDoc(docRef).catch(error => {
                errorEmitter.emit(
                    'permission-error',
                    new FirestorePermissionError({
                        path: docRef.path,
                        operation: 'delete',
                    })
                );
                throw error;
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
            await batch.commit().catch(error => {
                errorEmitter.emit(
                    'permission-error',
                    new FirestorePermissionError({
                        path: col.path,
                        operation: 'write',
                        requestResourceData: data,
                    })
                );
                throw error;
            });
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


export const getUsersByIds = async (userIds: string[]): Promise<User[]> => {
    if (!userIds || userIds.length === 0) return [];
    const db = getFirestoreInstance();
    const usersRef = collection(db, 'users');
    const promises = [];
    // Firestore 'in' query is limited to 30 items per query. Batch if necessary.
    for (let i = 0; i < userIds.length; i += 30) {
        const batchIds = userIds.slice(i, i + 30);
        if (batchIds.length > 0) {
            const q = query(usersRef, where(documentId(), 'in', batchIds));
            promises.push(getDocs(q));
        }
    }
    const snapshots = await Promise.all(promises);
    const results: User[] = [];
    snapshots.forEach(snapshot => {
        snapshot.docs.forEach(doc => {
            results.push({ id: doc.id, ...doc.data() } as User);
        });
    });
    return results;
};

export const getAssetsByIds = async (assetIds: string[]): Promise<FleetAsset[]> => {
    if (!assetIds || assetIds.length === 0) return [];
    const db = getFirestoreInstance();
    const assetsRef = collection(db, 'fleetAssets');
    const promises = [];
    // Firestore 'in' query is limited to 30 items per query. Batch if necessary.
    for (let i = 0; i < assetIds.length; i += 30) {
        const batchIds = assetIds.slice(i, i + 30);
        if (batchIds.length > 0) {
            const q = query(assetsRef, where(documentId(), 'in', batchIds));
            promises.push(getDocs(q));
        }
    }
    const snapshots = await Promise.all(promises);
    const results: FleetAsset[] = [];
    snapshots.forEach(snapshot => {
        snapshot.docs.forEach(doc => {
            results.push({ id: doc.id, ...doc.data() } as FleetAsset);
        });
    });
    return results;
};

export const getMaintenanceLogsInDateRange = async (startDate: string, endDate: string): Promise<MaintenanceLog[]> => {
    const db = getFirestoreInstance();
    const logsRef = collection(db, 'maintenanceLogs');
    const q = query(logsRef, where('date', '>=', startDate), where('date', '<=', endDate));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MaintenanceLog));
};

export const getMaintenanceLogsByAssetIds = async (assetIds: string[]): Promise<MaintenanceLog[]> => {
    if (!assetIds || assetIds.length === 0) return [];
    const db = getFirestoreInstance();
    const logsRef = collection(db, 'maintenanceLogs');
    const promises = [];
    for (let i = 0; i < assetIds.length; i += 30) {
        const batchIds = assetIds.slice(i, i + 30);
        if (batchIds.length > 0) {
            const q = query(logsRef, where('assetId', 'in', batchIds));
            promises.push(getDocs(q));
        }
    }
    const snapshots = await Promise.all(promises);
    const results: MaintenanceLog[] = [];
    snapshots.forEach(snapshot => {
        snapshot.docs.forEach(doc => {
            results.push({ id: doc.id, ...doc.data() } as MaintenanceLog);
        });
    });
    return results;
};

export const getExpenseReportsByEmployeeIds = async (employeeIds: string[]): Promise<ExpenseReport[]> => {
    if (!employeeIds || employeeIds.length === 0) return [];
    const db = getFirestoreInstance();
    const reportsRef = collection(db, 'expenseReports');
    const promises = [];
    for (let i = 0; i < employeeIds.length; i += 30) {
        const batchIds = employeeIds.slice(i, i + 30);
        if (batchIds.length > 0) {
            const q = query(reportsRef, where('employeeId', 'in', batchIds));
            promises.push(getDocs(q));
        }
    }
    const snapshots = await Promise.all(promises);
    const results: ExpenseReport[] = [];
    snapshots.forEach(snapshot => {
        snapshot.docs.forEach(doc => {
            results.push({ id: doc.id, ...doc.data() } as ExpenseReport);
        });
    });
    return results;
};

export const getExpenseReportsInDateRange = async (startDate: string, endDate: string): Promise<ExpenseReport[]> => {
    const db = getFirestoreInstance();
    const reportsRef = collection(db, 'expenseReports');
    const q = query(reportsRef, where('date', '>=', startDate), where('date', '<=', endDate));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExpenseReport));
};

export const getInspectionReportsInDateRange = async (
    startDate: string,
    endDate: string,
    status?: InspectionStatus
): Promise<InspectionReport[]> => {
    const db = getFirestoreInstance();
    const reportsRef = collection(db, 'inspectionReports');

    const queryConstraints = [
        where('date', '>=', startDate),
        where('date', '<=', endDate),
    ];

    if (status && status !== 'pending') {
        queryConstraints.push(where('overallStatus', '==', status));
    }

    const q = query(reportsRef, ...queryConstraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InspectionReport));
};

export const getPendingTimeOffRequests = async (): Promise<TimeOffRequest[]> => {
    const db = getFirestoreInstance();
    const requestsRef = collection(db, 'timeOffRequests');
    const q = query(requestsRef, where('status', '==', 'pending'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TimeOffRequest));
};

export const getReviewedTimeOffRequests = async (): Promise<TimeOffRequest[]> => {
    const db = getFirestoreInstance();
    const requestsRef = collection(db, 'timeOffRequests');
    const q = query(requestsRef, where('status', 'in', ['approved', 'denied']));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TimeOffRequest));
}

export const getOpenWorkOrders = async (): Promise<WorkOrder[]> => {
    const db = getFirestoreInstance();
    const ordersRef = collection(db, 'workOrders');
    const q = query(ordersRef, where('status', '!=', 'completed'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WorkOrder));
}

export const getCompletedWorkOrders = async (): Promise<WorkOrder[]> => {
    const db = getFirestoreInstance();
    const ordersRef = collection(db, 'workOrders');
    const q = query(ordersRef, where('status', '==', 'completed'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WorkOrder));
}

export const getPendingTasks = async (): Promise<Task[]> => {
    const db = getFirestoreInstance();
    const tasksRef = collection(db, 'tasks');
    const q = query(tasksRef, where('status', '==', 'pending'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
}

export const getCompletedTasks = async (): Promise<Task[]> => {
    const db = getFirestoreInstance();
    const tasksRef = collection(db, 'tasks');
    const q = query(tasksRef, where('status', '==', 'completed'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
}


export const getActiveAndUpcomingJobs = async (): Promise<Job[]> => {
    const db = getFirestoreInstance();
    const jobsRef = collection(db, 'jobs');
    // Format today's date as YYYY-MM-DD for string comparison
    const todayStr = format(startOfDay(new Date()), 'yyyy-MM-dd');
    const q = query(jobsRef, where('endDate', '>=', todayStr));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
};

export const getSnowJobs = async (): Promise<Job[]> => {
    const db = getFirestoreInstance();
    const jobsRef = collection(db, 'jobs');
    const q = query(jobsRef, where('jobType', '==', 'snow_removal'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
};

export const getJobsForUser = async (userId: string): Promise<Job[]> => {
    const db = getFirestoreInstance();
    const jobsRef = collection(db, 'jobs');

    const q1 = query(jobsRef, where('assignedEmployeeIds', 'array-contains', userId));
    const q2 = query(jobsRef, where('assignedSidewalkCrewIds', 'array-contains', userId));

    const [snapshot1, snapshot2] = await Promise.all([
        getDocs(q1),
        getDocs(q2),
    ]);

    const resultsMap = new Map<string, Job>();
    snapshot1.docs.forEach(doc => resultsMap.set(doc.id, { id: doc.id, ...doc.data() } as Job));
    snapshot2.docs.forEach(doc => resultsMap.set(doc.id, { id: doc.id, ...doc.data() } as Job));

    return Array.from(resultsMap.values());
};

// Special case functions
export const addNoteToJob = async (jobId: string, note: JobNote) => {
    const db = getFirestoreInstance();
    const jobDocRef = doc(db, 'jobs', jobId);
    await updateDoc(jobDocRef, {
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
        throw error;
    });
};

/**
 * Efficiently fetches inspection reports by a vehicle's VIN for the last 6 months.
 * This function is optimized for use in AI analysis flows.
 * @param vin The Vehicle Identification Number to query for.
 * @returns A promise that resolves to an array of InspectionReport objects.
 */
export const getReportsByVin = async (vin: string): Promise<InspectionReport[]> => {
    const db = getFirestoreInstance();
    const reportsRef = collection(db, 'inspectionReports');

    const sixMonthsAgo = subMonths(new Date(), 6);
    const sixMonthsAgoStr = format(sixMonthsAgo, 'yyyy-MM-dd');

    // Create three separate queries for each possible VIN field, now with a date range
    // Firestore requires a composite index for this query. The platform should handle this.
    const q1 = query(reportsRef, where('truckVin', '==', vin), where('date', '>=', sixMonthsAgoStr));
    const q2 = query(reportsRef, where('trailerVin', '==', vin), where('date', '>=', sixMonthsAgoStr));
    const q3 = query(reportsRef, where('heavyEquipmentVin', '==', vin), where('date', '>=', sixMonthsAgoStr));

    // Execute all queries in parallel
    const [snapshot1, snapshot2, snapshot3] = await Promise.all([
        getDocs(q1),
        getDocs(q2),
        getDocs(q3),
    ]);

    // Use a map to merge results and avoid duplicates
    const resultsMap = new Map<string, InspectionReport>();
    snapshot1.docs.forEach(doc => resultsMap.set(doc.id, { id: doc.id, ...doc.data() } as InspectionReport));
    snapshot2.docs.forEach(doc => resultsMap.set(doc.id, { id: doc.id, ...doc.data() } as InspectionReport));
    snapshot3.docs.forEach(doc => resultsMap.set(doc.id, { id: doc.id, ...doc.data() } as InspectionReport));

    return Array.from(resultsMap.values());
};

export const getTasksForUser = async (userId: string): Promise<Task[]> => {
    const db = getFirestoreInstance();
    const tasksRef = collection(db, 'tasks');
    const q = query(tasksRef, where('assignedToEmployeeId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
};

export const getReportsForUser = async (userId: string): Promise<InspectionReport[]> => {
    const db = getFirestoreInstance();
    const reportsRef = collection(db, 'inspectionReports');
    const q = query(reportsRef, where('employeeId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InspectionReport));
};

export const getTasksInDateRange = async (startDate: string, endDate: string): Promise<Task[]> => {
    const db = getFirestoreInstance();
    const tasksRef = collection(db, 'tasks');
    const q = query(tasksRef, where('dateAssigned', '>=', startDate), where('dateAssigned', '<=', endDate));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
};

export const getViolationsInDateRange = async (startDate: string, endDate: string): Promise<Violation[]> => {
    const db = getFirestoreInstance();
    const violationsRef = collection(db, 'violations');
    const q = query(violationsRef, where('date', '>=', startDate), where('date', '<=', endDate));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Violation));
};

export const getViolationsForUser = async (userId: string): Promise<Violation[]> => {
    const db = getFirestoreInstance();
    const violationsRef = collection(db, 'violations');
    const q = query(violationsRef, where('employeeId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Violation));
};

export const getGeneralDocuments = async (): Promise<ManagedDocument[]> => {
    const db = getFirestoreInstance();
    const docsRef = collection(db, 'documents');
    const q = query(docsRef, where('documentType', '==', 'general'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ManagedDocument));
};

export const getDocumentsForUser = async (userId: string): Promise<ManagedDocument[]> => {
    const db = getFirestoreInstance();
    const docsRef = collection(db, 'documents');
    const q = query(docsRef, where('employeeId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ManagedDocument));
};

export const getExpenseReportsForUser = async (userId: string): Promise<ExpenseReport[]> => {
    const db = getFirestoreInstance();
    const reportsRef = collection(db, 'expenseReports');
    const q = query(reportsRef, where('employeeId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExpenseReport));
};

export const getTimeOffRequestsForUser = async (userId: string): Promise<TimeOffRequest[]> => {
    const db = getFirestoreInstance();
    const requestsRef = collection(db, 'timeOffRequests');
    const q = query(requestsRef, where('employeeId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TimeOffRequest));
};
