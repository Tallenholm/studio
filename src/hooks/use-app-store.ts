import { create } from 'zustand';
import { getClients, getFleetAssets, getUsers } from '@/lib/firestoreService';
import type { Client, FleetAsset, User } from '@/lib/types';

interface AppState {
  clients: Client[];
  users: User[];
  fleetAssets: FleetAsset[];
  isClientsFetched: boolean;
  isUsersFetched: boolean;
  isAssetsFetched: boolean;
  fetchClients: () => Promise<void>;
  fetchUsers: () => Promise<void>;
  fetchFleetAssets: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  clients: [],
  users: [],
  fleetAssets: [],
  isClientsFetched: false,
  isUsersFetched: false,
  isAssetsFetched: false,

  fetchClients: async () => {
    if (get().isClientsFetched) return;
    try {
      const clients = await getClients();
      set({ clients, isClientsFetched: true });
    } catch (error) {
      console.error("Failed to fetch clients:", error);
    }
  },

  fetchUsers: async () => {
    if (get().isUsersFetched) return;
    try {
      // Fetch all users once, filtering can be done in components
      const users = await getUsers();
      set({ users, isUsersFetched: true });
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  },

  fetchFleetAssets: async () => {
    if (get().isAssetsFetched) return;
    try {
      const fleetAssets = await getFleetAssets();
      set({ fleetAssets, isAssetsFetched: true });
    } catch (error) {
      console.error("Failed to fetch fleet assets:", error);
    }
  },
}));
