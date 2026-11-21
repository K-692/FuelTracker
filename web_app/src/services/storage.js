/**
 * storage.js
 * Unified data repository layer.
 * 
 * Supports two operational backends:
 * 1. Cloud Firestore (when user is Google-authenticated and Firebase is configured)
 * 2. Local Storage (when running offline, in demo mode, or prior to configuring Firebase)
 * 
 * Manages vehicles, fuel entries, maintenance services, and user preferences.
 */

import { 
  collection, 
  doc, 
  getDoc,
  getDocs, 
  setDoc, 
  deleteDoc, 
  writeBatch,
  query,
  where
} from 'firebase/firestore';
import { getDb, isFirebaseConfigured } from './firebase';
import { DEFAULT_FUEL_TYPES } from './defaultData';

const STORAGE_KEYS = {
  VEHICLES: 'fueltracker_vehicles',
  ENTRIES: 'fueltracker_entries',
  SERVICES: 'fueltracker_services',
  SERVICE_ITEMS: 'fueltracker_service_items',
  FUEL_TYPES: 'fueltracker_fuel_types',
  PREFERENCES: 'fueltracker_preferences',
  ACTIVE_VEHICLE: 'fueltracker_active_vehicle_id',
  OIL_INTERVAL: 'fueltracker_oil_interval',
  OIL_MONTHS_INTERVAL: 'fueltracker_oil_months_interval',
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
    if (!localStorage.getItem(STORAGE_KEYS.SERVICES)) {
      localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SERVICE_ITEMS)) {
      localStorage.setItem(STORAGE_KEYS.SERVICE_ITEMS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.FUEL_TYPES)) {
      localStorage.setItem(STORAGE_KEYS.FUEL_TYPES, JSON.stringify(DEFAULT_FUEL_TYPES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.OIL_INTERVAL)) {
      localStorage.setItem(STORAGE_KEYS.OIL_INTERVAL, '5000');
    }
    if (!localStorage.getItem(STORAGE_KEYS.OIL_MONTHS_INTERVAL)) {
      localStorage.setItem(STORAGE_KEYS.OIL_MONTHS_INTERVAL, '6');
    }
  },

  /**
   * Loads all application data for the current session.
   * @param {Object|null} user - Firebase User object if signed in.
   * @returns {Promise<{ vehicles: Array, entries: Array, services: Array, fuelTypes: Array, activeVehicleId: string|null, engineOilInterval: number, engineOilMonthsInterval: number }>}
   */
  async loadData(user) {
    this.initLocalStorage();

    const storedInterval = parseInt(localStorage.getItem(STORAGE_KEYS.OIL_INTERVAL) || '5000', 10);
    const engineOilInterval = isNaN(storedInterval) || storedInterval <= 0 ? 5000 : storedInterval;

    const storedMonths = parseInt(localStorage.getItem(STORAGE_KEYS.OIL_MONTHS_INTERVAL) || '6', 10);
    const engineOilMonthsInterval = isNaN(storedMonths) || storedMonths <= 0 ? 6 : storedMonths;

    if (user && isFirebaseConfigured()) {
      try {
        const db = getDb();
        if (db) {
          // Fetch from Firestore
          const vehiclesRef = collection(db, `users/${user.uid}/vehicles`);
          const entriesRef = collection(db, `users/${user.uid}/fuel_entries`);
          const servicesRef = collection(db, `users/${user.uid}/services`);
          const fuelTypesRef = collection(db, `users/${user.uid}/fuel_types`);

          const [vehiclesSnap, entriesSnap, servicesSnap, fuelTypesSnap] = await Promise.all([
            getDocs(vehiclesRef),
            getDocs(entriesRef),
            getDocs(servicesRef),
            getDocs(fuelTypesRef),
          ]);

          const vehicles = vehiclesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          const entries = entriesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          const services = servicesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          const fuelTypes = fuelTypesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

          // User-defined service items are read separately so a rules problem on this
          // newer collection never blocks vehicles / refills / services from loading.
          let serviceItems;
          try {
            const itemsSnap = await getDocs(collection(db, `users/${user.uid}/service_items`));
            serviceItems = itemsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          } catch (itemsErr) {
            console.warn('Could not read service items from Firestore, using local copy:', itemsErr);
            serviceItems = this.getLocalServiceItems();
          }

          // Shared preferences (engine-oil intervals) so web & Android agree
          let cloudOilKm = null;
          let cloudOilMonths = null;
          try {
            const prefSnap = await getDoc(doc(db, `users/${user.uid}/settings`, 'preferences'));
            if (prefSnap.exists()) {
              const p = prefSnap.data();
              if (Number(p.engineOilInterval) > 0) cloudOilKm = Number(p.engineOilInterval);
              if (Number(p.engineOilMonthsInterval) > 0) cloudOilMonths = Number(p.engineOilMonthsInterval);
            }
          } catch (prefErr) {
            console.warn('Could not read preferences:', prefErr);
          }
          if (cloudOilKm) localStorage.setItem(STORAGE_KEYS.OIL_INTERVAL, String(cloudOilKm));
          if (cloudOilMonths) localStorage.setItem(STORAGE_KEYS.OIL_MONTHS_INTERVAL, String(cloudOilMonths));

          const activeId = localStorage.getItem(STORAGE_KEYS.ACTIVE_VEHICLE) || (vehicles[0]?.id || null);

          // Update local cache without destroying existing keys
          localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(vehicles));
          localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
          localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
          localStorage.setItem(STORAGE_KEYS.SERVICE_ITEMS, JSON.stringify(serviceItems));
          if (fuelTypes.length > 0) {
            localStorage.setItem(STORAGE_KEYS.FUEL_TYPES, JSON.stringify(fuelTypes));
          }

          return {
            vehicles,
            entries,
            services,
            serviceItems,
            fuelTypes: fuelTypes.length > 0 ? fuelTypes : DEFAULT_FUEL_TYPES,
            activeVehicleId: activeId,
            engineOilInterval: cloudOilKm || engineOilInterval,
            engineOilMonthsInterval: cloudOilMonths || engineOilMonthsInterval,
          };
        }
      } catch (err) {
        console.warn('Error fetching from Firestore, falling back to local cache:', err);
      }
    }

    // Fallback to local storage (strictly retains existing user entries)
    const localVehicles = this.getLocalVehicles();
    return {
      vehicles: localVehicles,
      entries: this.getLocalEntries(),
      services: this.getLocalServices(),
      serviceItems: this.getLocalServiceItems(),
      fuelTypes: this.getLocalFuelTypes(),
      activeVehicleId: localStorage.getItem(STORAGE_KEYS.ACTIVE_VEHICLE) || (localVehicles[0]?.id || null),
      engineOilInterval,
      engineOilMonthsInterval,
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

  getLocalServices() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SERVICES);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  /**
   * Persists shared preferences (engine-oil intervals) to `users/{uid}/settings/preferences`.
   */
  async savePreferences(user, prefs = {}) {
    if (prefs.engineOilInterval) localStorage.setItem(STORAGE_KEYS.OIL_INTERVAL, String(prefs.engineOilInterval));
    if (prefs.engineOilMonthsInterval) localStorage.setItem(STORAGE_KEYS.OIL_MONTHS_INTERVAL, String(prefs.engineOilMonthsInterval));
    if (user && isFirebaseConfigured()) {
      try {
        const db = getDb();
        if (db) {
          await setDoc(doc(db, `users/${user.uid}/settings`, 'preferences'), { ...prefs, updatedAt: Date.now() }, { merge: true });
        }
      } catch (e) {
        console.error('Firestore savePreferences error:', e);
      }
    }
  },

  getLocalServiceItems() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SERVICE_ITEMS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  /**
   * Saves (creates or updates) one or more user-defined servicing items.
   * Never deletes anything.
   */
  async saveServiceItems(user, itemsToSave = []) {
    if (!itemsToSave.length) return [];
    const now = Date.now();
    const normalized = itemsToSave.map(item => ({
      ...item,
      id: String(item.id),
      name: String(item.name || '').trim(),
      category: item.category || '',
      isEngineOil: Boolean(item.isEngineOil),
      createdAt: item.createdAt || now,
      updatedAt: now,
    }));

    const items = this.getLocalServiceItems();
    normalized.forEach(item => {
      const idx = items.findIndex(i => i.id === item.id);
      if (idx >= 0) items[idx] = item; else items.push(item);
    });
    localStorage.setItem(STORAGE_KEYS.SERVICE_ITEMS, JSON.stringify(items));

    if (user && isFirebaseConfigured()) {
      try {
        const db = getDb();
        if (db) {
          const batch = writeBatch(db);
          normalized.forEach(item => {
            batch.set(doc(db, `users/${user.uid}/service_items`, item.id), item, { merge: true });
          });
          await batch.commit();
        }
      } catch (e) {
        console.error('Firestore saveServiceItems error:', e);
      }
    }
    return normalized;
  },

  /**
   * Removes an item from the user's list. Past service records are NOT modified —
   * they keep the item's name and price inside the record.
   */
  async deleteServiceItem(user, itemId) {
    const items = this.getLocalServiceItems().filter(i => i.id !== itemId);
    localStorage.setItem(STORAGE_KEYS.SERVICE_ITEMS, JSON.stringify(items));

    if (user && isFirebaseConfigured()) {
      try {
        const db = getDb();
        if (db) await deleteDoc(doc(db, `users/${user.uid}/service_items`, itemId));
      } catch (e) {
        console.error('Firestore deleteServiceItem error:', e);
      }
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
   * Saves or updates a vehicle profile.
   */
  async saveVehicle(user, vehicle) {
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
   * Deletes a vehicle and cascades deletion to all associated fuel and service entries.
   */
  async deleteVehicle(user, vehicleId) {
    // Cascade delete in Local Storage
    const vehicles = this.getLocalVehicles().filter(v => v.id !== vehicleId);
    localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(vehicles));

    const entries = this.getLocalEntries().filter(e => e.vehicleId !== vehicleId);
    localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));

    const services = this.getLocalServices().filter(s => s.vehicleId !== vehicleId);
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));

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

          // Batch delete associated fuel entries
          const entriesRef = collection(db, `users/${user.uid}/fuel_entries`);
          const qEntries = query(entriesRef, where('vehicleId', '==', vehicleId));
          const entriesSnap = await getDocs(qEntries);

          // Batch delete associated service entries
          const servicesRef = collection(db, `users/${user.uid}/services`);
          const qServices = query(servicesRef, where('vehicleId', '==', vehicleId));
          const servicesSnap = await getDocs(qServices);

          const batch = writeBatch(db);
          entriesSnap.docs.forEach(d => batch.delete(d.ref));
          servicesSnap.docs.forEach(d => batch.delete(d.ref));
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
   * Saves or updates a vehicle maintenance / servicing record.
   */
  async saveServiceEntry(user, service) {
    const serviceId = service.id || `srv_${Date.now()}`;
    const serviceToSave = {
      ...service,
      id: serviceId,
      updatedAt: Date.now(),
      createdAt: service.createdAt || Date.now(),
    };

    // Update Local Storage
    const services = this.getLocalServices();
    const index = services.findIndex(s => s.id === serviceId);
    if (index >= 0) {
      services[index] = serviceToSave;
    } else {
      services.push(serviceToSave);
    }
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));

    // Update Firestore
    if (user && isFirebaseConfigured()) {
      try {
        const db = getDb();
        if (db) {
          const docRef = doc(db, `users/${user.uid}/services`, serviceId);
          await setDoc(docRef, serviceToSave, { merge: true });
        }
      } catch (e) {
        console.error('Firestore saveServiceEntry error:', e);
      }
    }

    return serviceToSave;
  },

  /**
   * Deletes a vehicle servicing record.
   */
  async deleteServiceEntry(user, serviceId) {
    // Update Local Storage
    const services = this.getLocalServices().filter(s => s.id !== serviceId);
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));

    // Delete in Firestore
    if (user && isFirebaseConfigured()) {
      try {
        const db = getDb();
        if (db) {
          await deleteDoc(doc(db, `users/${user.uid}/services`, serviceId));
        }
      } catch (e) {
        console.error('Firestore deleteServiceEntry error:', e);
      }
    }
  }
};
