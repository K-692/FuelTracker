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
  FUEL_TYPES: 'fueltracker_fuel_types',
  PREFERENCES: 'fueltracker_preferences',
  ACTIVE_VEHICLE: 'fueltracker_active_vehicle_id',
  OIL_INTERVAL: 'fueltracker_oil_interval',
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
    if (!localStorage.getItem(STORAGE_KEYS.FUEL_TYPES)) {
      localStorage.setItem(STORAGE_KEYS.FUEL_TYPES, JSON.stringify(DEFAULT_FUEL_TYPES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.OIL_INTERVAL)) {
      localStorage.setItem(STORAGE_KEYS.OIL_INTERVAL, '5000');
    }
  },

  /**
   * Loads all application data for the current session.
   * @param {Object|null} user - Firebase User object if signed in.
   * @returns {Promise<{ vehicles: Array, entries: Array, services: Array, fuelTypes: Array, activeVehicleId: string|null, engineOilInterval: number }>}
   */
  async loadData(user) {
    this.initLocalStorage();

    const storedInterval = parseInt(localStorage.getItem(STORAGE_KEYS.OIL_INTERVAL) || '5000', 10);
    const engineOilInterval = isNaN(storedInterval) || storedInterval <= 0 ? 5000 : storedInterval;

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

          const activeId = localStorage.getItem(STORAGE_KEYS.ACTIVE_VEHICLE) || (vehicles[0]?.id || null);

          // Update local cache without destroying existing keys
          localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(vehicles));
          localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
          localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
          if (fuelTypes.length > 0) {
            localStorage.setItem(STORAGE_KEYS.FUEL_TYPES, JSON.stringify(fuelTypes));
          }

          return {
            vehicles,
            entries,
            services,
            fuelTypes: fuelTypes.length > 0 ? fuelTypes : DEFAULT_FUEL_TYPES,
            activeVehicleId: activeId,
            engineOilInterval,
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
      fuelTypes: this.getLocalFuelTypes(),
      activeVehicleId: localStorage.getItem(STORAGE_KEYS.ACTIVE_VEHICLE) || (localVehicles[0]?.id || null),
      engineOilInterval,
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
  },

  /**
   * Uploads an entire payload into Firestore in batches.
   */
  async uploadToFirestore(user, { vehicles, entries, services = [], fuelTypes }) {
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

      services.forEach(s => {
        batch.set(doc(db, `users/${user.uid}/services`, String(s.id)), s, { merge: true });
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
   * Generates a comprehensive JSON backup string.
   */
  exportBackup(vehicles = [], fuelTypes = DEFAULT_FUEL_TYPES, fuelEntries = [], services = [], engineOilInterval = 5000) {
    const backupObj = {
      appName: 'FuelTracker',
      version: 2,
      exportedAt: new Date().toISOString(),
      engineOilInterval: Number(engineOilInterval) || 5000,
      vehicles: vehicles.map((v, idx) => ({
        id: String(v.id || `veh_${idx + 1}`),
        name: v.name || 'Vehicle',
        registrationNumber: v.registrationNumber || null,
        vehicleType: (v.vehicleType || 'CAR').toUpperCase(),
        manufacturer: v.manufacturer || null,
        model: v.model || null,
        year: v.year ? parseInt(v.year, 10) : null,
        createdAt: v.createdAt || Date.now(),
      })),
      fuelTypes: (fuelTypes.length > 0 ? fuelTypes : DEFAULT_FUEL_TYPES).map(ft => ({
        id: String(ft.id),
        name: ft.name,
        category: ft.category || 'Petrol',
        brand: ft.brand || null,
        isSystemFuel: Boolean(ft.isSystemFuel),
      })),
      fuelEntries: fuelEntries.map(e => ({
        id: String(e.id),
        vehicleId: String(e.vehicleId),
        fuelTypeId: String(e.fuelTypeId || 'ft_1'),
        fuelTypeName: e.fuelTypeName || 'Regular Petrol',
        odometer: Number(e.odometer) || 0,
        fuelAmount: Number(e.fuelAmount) || 0,
        totalCost: Number(e.totalCost) || 0,
        pricePerLiter: Number(e.pricePerLiter) || 0,
        refillDate: e.refillDate,
        notes: e.notes || null,
        createdAt: e.createdAt || Date.now(),
      })),
      services: services.map(s => ({
        id: String(s.id),
        vehicleId: String(s.vehicleId),
        serviceDate: s.serviceDate,
        odometer: Number(s.odometer) || 0,
        serviceCenter: s.serviceCenter || null,
        notes: s.notes || null,
        totalCost: Number(s.totalCost) || 0,
        components: s.components || {},
        createdAt: s.createdAt || Date.now(),
      })),
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
    const services = Array.isArray(parsed.services) ? parsed.services : [];
    const fuelTypes = Array.isArray(parsed.fuelTypes) ? parsed.fuelTypes : [];

    if (vehicles.length === 0 && entries.length === 0 && services.length === 0) {
      throw new Error('Backup file contains no vehicles, refills, or service records.');
    }

    return {
      vehiclesCount: vehicles.length,
      entriesCount: entries.length,
      servicesCount: services.length,
      fuelTypesCount: fuelTypes.length,
      engineOilInterval: parsed.engineOilInterval || 5000,
      appName: parsed.appName || 'FuelTracker',
      exportedAt: parsed.exportedAt || null,
      parsedData: parsed,
    };
  },

  /**
   * Imports a backup JSON file with normalization and validation.
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

    const importedServices = (parsedData.services || []).map((s, idx) => {
      let dateStr = new Date().toISOString().split('T')[0];
      if (typeof s.serviceDate === 'number') {
        const d = new Date(s.serviceDate);
        if (!isNaN(d.getTime())) dateStr = d.toISOString().split('T')[0];
      } else if (typeof s.serviceDate === 'string') {
        if (/^\d{4}-\d{2}-\d{2}$/.test(s.serviceDate)) {
          dateStr = s.serviceDate;
        } else {
          const d = new Date(s.serviceDate);
          if (!isNaN(d.getTime())) dateStr = d.toISOString().split('T')[0];
        }
      }

      return {
        id: String(s.id || `srv_${Date.now()}_${idx}`),
        vehicleId: String(s.vehicleId),
        serviceDate: dateStr,
        odometer: Number(s.odometer) || 0,
        serviceCenter: s.serviceCenter || '',
        notes: s.notes || '',
        totalCost: Number(s.totalCost) || 0,
        components: s.components || {},
        createdAt: typeof s.createdAt === 'number' ? s.createdAt : Date.now(),
      };
    });

    const engineOilInterval = Number(parsedData.engineOilInterval) || 5000;
    localStorage.setItem(STORAGE_KEYS.OIL_INTERVAL, String(engineOilInterval));

    // Save to local storage
    localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(importedVehicles));
    localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(importedEntries));
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(importedServices));
    localStorage.setItem(STORAGE_KEYS.FUEL_TYPES, JSON.stringify(importedFuelTypes));

    if (importedVehicles.length > 0) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_VEHICLE, importedVehicles[0].id);
    }

    // Sync to Firestore if signed in
    if (user && isFirebaseConfigured()) {
      await this.uploadToFirestore(user, {
        vehicles: importedVehicles,
        entries: importedEntries,
        services: importedServices,
        fuelTypes: importedFuelTypes,
      });
    }

    return {
      vehicles: importedVehicles,
      entries: importedEntries,
      services: importedServices,
      fuelTypes: importedFuelTypes,
      activeVehicleId: importedVehicles[0]?.id || null,
      engineOilInterval,
    };
  }
};
