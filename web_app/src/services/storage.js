/**
 * storage.js
 * Unified data repository layer.
 * 
 * Supports two operational backends:
 * 1. Cloud Firestore (when user is Google-authenticated and Firebase is configured)
 * 2. Local Storage (when running offline, in demo mode, or prior to configuring Firebase)
 * 
 * Also handles JSON Backup/Restore interoperable with Android FuelTracker schema.
 */

import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  writeBatch,
  query,
  where
} from 'firebase/firestore';
import { getDb, isFirebaseConfigured } from './firebase';
import { DEFAULT_FUEL_TYPES, INITIAL_VEHICLES, INITIAL_FUEL_ENTRIES } from './defaultData';

const STORAGE_KEYS = {
  VEHICLES: 'fueltracker_vehicles',
  ENTRIES: 'fueltracker_entries',
  FUEL_TYPES: 'fueltracker_fuel_types',
  PREFERENCES: 'fueltracker_preferences',
  ACTIVE_VEHICLE: 'fueltracker_active_vehicle_id',
};

export const StorageService = {
  /**
   * Initializes local storage with empty data structures and system fuel types.
   */
  initLocalStorage() {
    if (!localStorage.getItem(STORAGE_KEYS.VEHICLES)) {
      localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ENTRIES)) {
      localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.FUEL_TYPES)) {
      localStorage.setItem(STORAGE_KEYS.FUEL_TYPES, JSON.stringify(DEFAULT_FUEL_TYPES));
    }
    // Clean up any legacy pre-seeded demo entries from previous sessions
    try {
      const v = JSON.parse(localStorage.getItem(STORAGE_KEYS.VEHICLES) || '[]');
      if (v.some(item => item.id === 'veh_bike_1' || item.id === 'veh_car_1')) {
        localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify([]));
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_VEHICLE);
      }
      const e = JSON.parse(localStorage.getItem(STORAGE_KEYS.ENTRIES) || '[]');
      if (e.some(item => item.id?.startsWith('entry_b') || item.id?.startsWith('entry_c'))) {
        localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify([]));
      }
    } catch {
      // Ignore JSON parse errors
    }
  },

  /**
   * Loads all application data for the current session.
   * @param {Object|null} user - Firebase User object if signed in.
   * @returns {Promise<{ vehicles: Array, entries: Array, fuelTypes: Array, activeVehicleId: string|null }>}
   */
  async loadData(user) {
    this.initLocalStorage();

    if (user && isFirebaseConfigured()) {
      try {
        const db = getDb();
        if (db) {
          // Fetch from Firestore
          const vehiclesRef = collection(db, `users/${user.uid}/vehicles`);
          const entriesRef = collection(db, `users/${user.uid}/fuel_entries`);
          const fuelTypesRef = collection(db, `users/${user.uid}/fuel_types`);

          const [vehiclesSnap, entriesSnap, fuelTypesSnap] = await Promise.all([
            getDocs(vehiclesRef),
            getDocs(entriesRef),
            getDocs(fuelTypesRef),
          ]);

          const vehicles = vehiclesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          const entries = entriesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          const fuelTypes = fuelTypesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

          const activeId = localStorage.getItem(STORAGE_KEYS.ACTIVE_VEHICLE) || (vehicles[0]?.id || null);

          return {
            vehicles,
            entries,
            fuelTypes: fuelTypes.length > 0 ? fuelTypes : DEFAULT_FUEL_TYPES,
            activeVehicleId: activeId,
          };
        }
      } catch (err) {
        console.warn('Error fetching from Firestore, falling back to local cache:', err);
      }
    }

    // Fallback to local storage (strictly empty fields for new users)
    const localVehicles = this.getLocalVehicles();
    return {
      vehicles: localVehicles,
      entries: this.getLocalEntries(),
      fuelTypes: this.getLocalFuelTypes(),
      activeVehicleId: localStorage.getItem(STORAGE_KEYS.ACTIVE_VEHICLE) || (localVehicles[0]?.id || null),
    };
  },

  getLocalVehicles() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.VEHICLES);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  getLocalEntries() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ENTRIES);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  getLocalFuelTypes() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.FUEL_TYPES);
      return raw ? JSON.parse(raw) : DEFAULT_FUEL_TYPES;
    } catch {
      return DEFAULT_FUEL_TYPES;
    }
  },

  /**
   * Saves or updates a vehicle.
   */
  async saveVehicle(user, vehicle) {
    const isNew = !vehicle.id;
    const vehicleId = vehicle.id || `veh_${Date.now()}`;
    const vehicleToSave = {
      ...vehicle,
      id: vehicleId,
      updatedAt: Date.now(),
      createdAt: vehicle.createdAt || Date.now(),
    };

    // Update Local Storage
    const vehicles = this.getLocalVehicles();
    const index = vehicles.findIndex(v => v.id === vehicleId);
    if (index >= 0) {
      vehicles[index] = vehicleToSave;
    } else {
      vehicles.push(vehicleToSave);
    }
    localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(vehicles));

    // Update Firestore if connected
    if (user && isFirebaseConfigured()) {
      try {
        const db = getDb();
        if (db) {
          const docRef = doc(db, `users/${user.uid}/vehicles`, vehicleId);
          await setDoc(docRef, vehicleToSave, { merge: true });
        }
      } catch (e) {
        console.error('Firestore saveVehicle error:', e);
      }
    }

    return vehicleToSave;
  },

  /**
   * Deletes a vehicle and cascades deletion to all associated fuel entries.
   */
  async deleteVehicle(user, vehicleId) {
    // Cascade delete in Local Storage
    const vehicles = this.getLocalVehicles().filter(v => v.id !== vehicleId);
    localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(vehicles));

    const entries = this.getLocalEntries().filter(e => e.vehicleId !== vehicleId);
    localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));

    // Update active vehicle if the deleted vehicle was active
    const activeId = localStorage.getItem(STORAGE_KEYS.ACTIVE_VEHICLE);
    if (activeId === vehicleId) {
      const nextActive = vehicles.length > 0 ? vehicles[0].id : null;
      if (nextActive) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_VEHICLE, nextActive);
      } else {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_VEHICLE);
      }
    }

    // Cascade delete in Firestore
    if (user && isFirebaseConfigured()) {
      try {
        const db = getDb();
        if (db) {
          // Delete vehicle doc
          await deleteDoc(doc(db, `users/${user.uid}/vehicles`, vehicleId));

          // Query & batch delete associated entries
          const entriesRef = collection(db, `users/${user.uid}/fuel_entries`);
          const q = query(entriesRef, where('vehicleId', '==', vehicleId));
          const snap = await getDocs(q);
          const batch = writeBatch(db);
          snap.docs.forEach(d => batch.delete(d.ref));
          await batch.commit();
        }
      } catch (e) {
        console.error('Firestore deleteVehicle error:', e);
      }
    }
  },

  /**
   * Saves or updates a fuel refill entry.
   */
  async saveFuelEntry(user, entry) {
    const entryId = entry.id || `entry_${Date.now()}`;
    const entryToSave = {
      ...entry,
      id: entryId,
      updatedAt: Date.now(),
      createdAt: entry.createdAt || Date.now(),
    };

    // Update Local Storage
    const entries = this.getLocalEntries();
    const index = entries.findIndex(e => e.id === entryId);
    if (index >= 0) {
      entries[index] = entryToSave;
    } else {
      entries.push(entryToSave);
    }
    localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));

    // Update Firestore
    if (user && isFirebaseConfigured()) {
      try {
        const db = getDb();
        if (db) {
          const docRef = doc(db, `users/${user.uid}/fuel_entries`, entryId);
          await setDoc(docRef, entryToSave, { merge: true });
        }
      } catch (e) {
        console.error('Firestore saveFuelEntry error:', e);
      }
    }

    return entryToSave;
  },

  /**
   * Deletes a fuel refill entry.
   */
  async deleteFuelEntry(user, entryId) {
    // Update Local Storage
    const entries = this.getLocalEntries().filter(e => e.id !== entryId);
    localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));

    // Delete in Firestore
    if (user && isFirebaseConfigured()) {
      try {
        const db = getDb();
        if (db) {
          await deleteDoc(doc(db, `users/${user.uid}/fuel_entries`, entryId));
        }
      } catch (e) {
        console.error('Firestore deleteFuelEntry error:', e);
      }
    }
  },

  /**
   * Uploads an entire payload into Firestore in batches.
   */
  async uploadToFirestore(user, { vehicles, entries, fuelTypes }) {
    if (!user || !isFirebaseConfigured()) return;
    const db = getDb();
    if (!db) return;

    try {
      const batch = writeBatch(db);

      vehicles.forEach(v => {
        batch.set(doc(db, `users/${user.uid}/vehicles`, String(v.id)), v, { merge: true });
      });

      entries.forEach(e => {
        batch.set(doc(db, `users/${user.uid}/fuel_entries`, String(e.id)), e, { merge: true });
      });

      fuelTypes.forEach(ft => {
        batch.set(doc(db, `users/${user.uid}/fuel_types`, String(ft.id)), ft, { merge: true });
      });

      await batch.commit();
    } catch (e) {
      console.error('Failed to sync data to Firestore:', e);
    }
  },

  /**
   * Generates a JSON export string matching Android's FuelTrackerBackup schema.
   * Ensures numeric IDs and millisecond refillDate timestamps for Android Gson parsing compatibility.
   */
  exportBackup(vehicles = [], fuelTypes = DEFAULT_FUEL_TYPES, fuelEntries = []) {
    // Map vehicle IDs to consistent numeric IDs for Android Room entity compatibility
    const vehicleIdMap = new Map();
    const formattedVehicles = vehicles.map((v, idx) => {
      const numericId = typeof v.id === 'number' ? v.id : (idx + 1);
      vehicleIdMap.set(String(v.id), numericId);
      return {
        id: numericId,
        name: v.name || 'Vehicle',
        registrationNumber: v.registrationNumber || null,
        vehicleType: (v.vehicleType || 'CAR').toUpperCase(),
        manufacturer: v.manufacturer || null,
        model: v.model || null,
        year: v.year ? parseInt(v.year, 10) : null,
        createdAt: typeof v.createdAt === 'number' ? v.createdAt : (Date.now() - (idx * 86400000)),
      };
    });

    const fuelTypeIdMap = new Map();
    const formattedFuelTypes = (fuelTypes.length > 0 ? fuelTypes : DEFAULT_FUEL_TYPES).map((ft, idx) => {
      const numericId = typeof ft.id === 'number' ? ft.id : (idx + 1);
      fuelTypeIdMap.set(String(ft.id), numericId);
      return {
        id: numericId,
        name: ft.name,
        category: ft.category || 'Petrol',
        brand: ft.brand || null,
        isSystemFuel: Boolean(ft.isSystemFuel),
      };
    });

    const formattedEntries = fuelEntries.map((e, idx) => {
      const numericId = typeof e.id === 'number' ? e.id : (idx + 1);
      const mappedVehId = vehicleIdMap.get(String(e.vehicleId)) || 1;
      const mappedTypeId = fuelTypeIdMap.get(String(e.fuelTypeId)) || 1;

      // Ensure refillDate is a numeric millisecond timestamp for Android's Gson
      let dateTimestamp = Date.now();
      if (typeof e.refillDate === 'number') {
        dateTimestamp = e.refillDate;
      } else if (typeof e.refillDate === 'string') {
        const parsed = new Date(e.refillDate).getTime();
        if (!isNaN(parsed)) dateTimestamp = parsed;
      }

      return {
        id: numericId,
        vehicleId: mappedVehId,
        fuelTypeId: mappedTypeId,
        odometer: Number(e.odometer) || 0,
        fuelAmount: Number(e.fuelAmount) || 0,
        totalCost: Number(e.totalCost) || 0,
        pricePerLiter: Number(e.pricePerLiter) || (e.fuelAmount > 0 ? Number((e.totalCost / e.fuelAmount).toFixed(2)) : 0),
        refillDate: dateTimestamp,
        notes: e.notes || null,
        createdAt: typeof e.createdAt === 'number' ? e.createdAt : dateTimestamp,
      };
    });

    const backupObj = {
      appName: 'FuelTracker',
      version: 1,
      exportedAt: new Date().toISOString(),
      vehicles: formattedVehicles,
      fuelTypes: formattedFuelTypes,
      fuelEntries: formattedEntries,
    };

    return JSON.stringify(backupObj, null, 2);
  },

  /**
   * Validates a backup JSON string and returns parsed metadata for user confirmation.
   */
  validateBackup(jsonString) {
    let parsed;
    try {
      parsed = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
    } catch {
      throw new Error('The selected file is not a valid JSON document.');
    }

    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid FuelTracker backup format.');
    }

    const vehicles = Array.isArray(parsed.vehicles) ? parsed.vehicles : [];
    const entries = Array.isArray(parsed.fuelEntries) 
      ? parsed.fuelEntries 
      : (Array.isArray(parsed.entries) ? parsed.entries : []);
    const fuelTypes = Array.isArray(parsed.fuelTypes) ? parsed.fuelTypes : [];

    if (vehicles.length === 0 && entries.length === 0) {
      throw new Error('Backup file contains no vehicle profiles or fuel refill entries.');
    }

    return {
      vehiclesCount: vehicles.length,
      entriesCount: entries.length,
      fuelTypesCount: fuelTypes.length,
      appName: parsed.appName || 'FuelTracker',
      exportedAt: parsed.exportedAt || null,
      parsedData: parsed,
    };
  },

  /**
   * Imports a backup JSON file with re-mapping and validation.
   */
  async importBackup(user, jsonString) {
    const { parsedData } = this.validateBackup(jsonString);

    const importedVehicles = (parsedData.vehicles || []).map((v, idx) => ({
      id: String(v.id || `veh_${Date.now()}_${idx}`),
      name: v.name || `Vehicle ${idx + 1}`,
      registrationNumber: v.registrationNumber || '',
      vehicleType: (v.vehicleType || 'CAR').toUpperCase(),
      manufacturer: v.manufacturer || '',
      model: v.model || '',
      year: v.year ? parseInt(v.year, 10) : '',
      createdAt: typeof v.createdAt === 'number' ? v.createdAt : Date.now(),
    }));

    const importedFuelTypes = (parsedData.fuelTypes && parsedData.fuelTypes.length > 0)
      ? parsedData.fuelTypes
      : DEFAULT_FUEL_TYPES;

    const importedEntries = (parsedData.fuelEntries || parsedData.entries || []).map((e, idx) => {
      // Normalize refillDate: handle Android millisecond timestamp or ISO date string
      let dateStr = new Date().toISOString().split('T')[0];
      if (typeof e.refillDate === 'number') {
        const d = new Date(e.refillDate);
        if (!isNaN(d.getTime())) dateStr = d.toISOString().split('T')[0];
      } else if (typeof e.refillDate === 'string') {
        if (/^\d{4}-\d{2}-\d{2}$/.test(e.refillDate)) {
          dateStr = e.refillDate;
        } else {
          const d = new Date(e.refillDate);
          if (!isNaN(d.getTime())) dateStr = d.toISOString().split('T')[0];
        }
      }

      const matchedType = importedFuelTypes.find(ft => String(ft.id) === String(e.fuelTypeId));
      const fuelTypeName = e.fuelTypeName || matchedType?.name || 'Regular Petrol';

      return {
        id: String(e.id || `entry_${Date.now()}_${idx}`),
        vehicleId: String(e.vehicleId),
        fuelTypeId: String(e.fuelTypeId || 'ft_1'),
        fuelTypeName,
        odometer: Number(e.odometer) || 0,
        fuelAmount: Number(e.fuelAmount) || 0,
        totalCost: Number(e.totalCost) || 0,
        pricePerLiter: Number(e.pricePerLiter) || (Number(e.fuelAmount) > 0 ? Number((Number(e.totalCost) / Number(e.fuelAmount)).toFixed(2)) : 0),
        refillDate: dateStr,
        notes: e.notes || '',
        createdAt: typeof e.createdAt === 'number' ? e.createdAt : Date.now(),
      };
    });

    // Save to local storage
    localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(importedVehicles));
    localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(importedEntries));
    localStorage.setItem(STORAGE_KEYS.FUEL_TYPES, JSON.stringify(importedFuelTypes));

    if (importedVehicles.length > 0) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_VEHICLE, importedVehicles[0].id);
    }

    // Sync to Firestore if signed in
    if (user && isFirebaseConfigured()) {
      await this.uploadToFirestore(user, {
        vehicles: importedVehicles,
        entries: importedEntries,
        fuelTypes: importedFuelTypes,
      });
    }

    return {
      vehicles: importedVehicles,
      entries: importedEntries,
      fuelTypes: importedFuelTypes,
      activeVehicleId: importedVehicles[0]?.id || null,
    };
  }
};
