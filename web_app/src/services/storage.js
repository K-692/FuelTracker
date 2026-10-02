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
   * Initializes local storage with seed data if currently empty.
   */
  initLocalStorage() {
    if (!localStorage.getItem(STORAGE_KEYS.VEHICLES)) {
      localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(INITIAL_VEHICLES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ENTRIES)) {
      localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(INITIAL_FUEL_ENTRIES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.FUEL_TYPES)) {
      localStorage.setItem(STORAGE_KEYS.FUEL_TYPES, JSON.stringify(DEFAULT_FUEL_TYPES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ACTIVE_VEHICLE)) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_VEHICLE, INITIAL_VEHICLES[0].id);
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

          // If user has no cloud data yet, offer their initial local data or seed data
          if (vehicles.length === 0) {
            const localVehicles = this.getLocalVehicles();
            const localEntries = this.getLocalEntries();
            const localTypes = this.getLocalFuelTypes();

            if (localVehicles.length > 0) {
              await this.uploadToFirestore(user, {
                vehicles: localVehicles,
                entries: localEntries,
                fuelTypes: localTypes.length > 0 ? localTypes : DEFAULT_FUEL_TYPES
              });
              return {
                vehicles: localVehicles,
                entries: localEntries,
                fuelTypes: localTypes.length > 0 ? localTypes : DEFAULT_FUEL_TYPES,
                activeVehicleId: localVehicles[0]?.id || null,
              };
            }
          }

          const activeId = localStorage.getItem(STORAGE_KEYS.ACTIVE_VEHICLE) || (vehicles[0]?.id || null);

          return {
            vehicles: vehicles.length > 0 ? vehicles : INITIAL_VEHICLES,
            entries,
            fuelTypes: fuelTypes.length > 0 ? fuelTypes : DEFAULT_FUEL_TYPES,
            activeVehicleId: activeId,
          };
        }
      } catch (err) {
        console.warn('Error fetching from Firestore, falling back to local cache:', err);
      }
    }

    // Fallback to local storage
    return {
      vehicles: this.getLocalVehicles(),
      entries: this.getLocalEntries(),
      fuelTypes: this.getLocalFuelTypes(),
      activeVehicleId: localStorage.getItem(STORAGE_KEYS.ACTIVE_VEHICLE) || INITIAL_VEHICLES[0].id,
    };
  },

  getLocalVehicles() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.VEHICLES);
      return raw ? JSON.parse(raw) : INITIAL_VEHICLES;
    } catch {
      return INITIAL_VEHICLES;
    }
  },

  getLocalEntries() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ENTRIES);
      return raw ? JSON.parse(raw) : INITIAL_FUEL_ENTRIES;
    } catch {
      return INITIAL_FUEL_ENTRIES;
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
   */
  exportBackup(vehicles, fuelTypes, fuelEntries) {
    const backupObj = {
      version: 1,
      appName: 'FuelTracker',
      exportedAt: new Date().toISOString(),
      vehicles: vehicles || [],
      fuelTypes: fuelTypes || [],
      fuelEntries: fuelEntries || [],
    };
    return JSON.stringify(backupObj, null, 2);
  },

  /**
   * Imports a backup JSON file with re-mapping and validation.
   */
  async importBackup(user, jsonString) {
    const parsed = JSON.parse(jsonString);
    if (!parsed || (!parsed.vehicles && !parsed.fuelEntries)) {
      throw new Error('Invalid FuelTracker backup format.');
    }

    const importedVehicles = parsed.vehicles || [];
    const importedFuelTypes = parsed.fuelTypes || DEFAULT_FUEL_TYPES;
    const importedEntries = parsed.fuelEntries || [];

    // Merge or replace local storage
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
