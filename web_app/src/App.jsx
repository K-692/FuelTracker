import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { Garage } from './components/Garage';
import { RefillManager } from './components/RefillManager';
import { Services } from './components/Services';
import { Analytics } from './components/Analytics';
import { Settings } from './components/Settings';
import { RefillModal } from './components/RefillModal';
import { ServiceModal } from './components/ServiceModal';
import { VehicleModal } from './components/VehicleModal';
import { FirebaseModal } from './components/FirebaseModal';
import { ConfirmModal } from './components/ConfirmModal';
import { Toast } from './components/Toast';

import { StorageService } from './services/storage';
import { ServiceCalculator } from './domain/serviceCalculator';
import { 
  loginWithGoogle, 
  logoutUser, 
  subscribeToAuth, 
  initializeFirebaseServices 
} from './services/firebase';
import { DEFAULT_FUEL_TYPES } from './services/defaultData';

export default function App() {
  // Theme state
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('fueltracker_theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Navigation tab: 'landing' | 'track' | 'garage' | 'refills' | 'services' | 'analytics' | 'settings'
  const [activeTab, setActiveTab] = useState('landing');

  // Application Data state
  const [user, setUser] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [activeVehicleId, setActiveVehicleId] = useState(null);
  const [fuelEntries, setFuelEntries] = useState([]);
  const [services, setServices] = useState([]);
  const [fuelTypes, setFuelTypes] = useState(DEFAULT_FUEL_TYPES);

  // When not signed in, strictly lock tab to 'landing'. When signed in, overview is never shown.
  const currentTab = user ? (activeTab === 'landing' ? 'track' : activeTab) : 'landing';

  // Localization preferences
  const [currency, setCurrency] = useState(() => localStorage.getItem('fueltracker_currency') || '₹');
  const [unit, setUnit] = useState(() => localStorage.getItem('fueltracker_unit') || 'km');
  const [engineOilInterval, setEngineOilIntervalState] = useState(() => {
    const saved = parseInt(localStorage.getItem('fueltracker_oil_interval') || '5000', 10);
    return isNaN(saved) || saved <= 0 ? 5000 : saved;
  });
  const [engineOilMonthsInterval, setEngineOilMonthsIntervalState] = useState(() => {
    const saved = parseInt(localStorage.getItem('fueltracker_oil_months_interval') || '6', 10);
    return isNaN(saved) || saved <= 0 ? 6 : saved;
  });

  const setEngineOilInterval = (val) => {
    const safeVal = Number(val) > 0 ? Number(val) : 5000;
    setEngineOilIntervalState(safeVal);
    localStorage.setItem('fueltracker_oil_interval', String(safeVal));
  };

  const setEngineOilMonthsInterval = (val) => {
    const safeVal = Number(val) > 0 ? Number(val) : 6;
    setEngineOilMonthsIntervalState(safeVal);
    localStorage.setItem('fueltracker_oil_months_interval', String(safeVal));
  };

  // Modal dialog states
  const [isRefillModalOpen, setIsRefillModalOpen] = useState(false);
  const [editingRefill, setEditingRefill] = useState(null);
  
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);

  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);

  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  // Toast feedback state
  const [notification, setNotification] = useState(null);

  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 4000);
  }, []);

  // Synchronize HTML theme attribute and localStorage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    const meta = document.querySelector('meta[name="color-scheme"]');
    if (meta) meta.content = theme;
    localStorage.setItem('fueltracker_theme', theme);
  }, [theme]);

  // Persist currency and unit preferences
  useEffect(() => {
    localStorage.setItem('fueltracker_currency', currency);
  }, [currency]);

  useEffect(() => {
    localStorage.setItem('fueltracker_unit', unit);
  }, [unit]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Load data helper
  const refreshData = useCallback(async (currentUser = user) => {
    try {
      const data = await StorageService.loadData(currentUser);
      setVehicles(data.vehicles);
      setFuelEntries(data.entries);
      setServices(data.services || []);
      setFuelTypes(data.fuelTypes || DEFAULT_FUEL_TYPES);
      if (data.engineOilInterval) {
        setEngineOilIntervalState(data.engineOilInterval);
      }
      if (data.engineOilMonthsInterval) {
        setEngineOilMonthsIntervalState(data.engineOilMonthsInterval);
      }
      setActiveVehicleId(data.activeVehicleId || (data.vehicles[0]?.id || null));
    } catch (e) {
      console.error('Failed to load application data:', e);
    }
  }, [user]);

  // Compute Engine Oil Status for the currently active vehicle
  const activeVehicleServices = useMemo(() => {
    return services.filter(s => s.vehicleId === activeVehicleId);
  }, [services, activeVehicleId]);

  const activeVehicleFuelEntries = useMemo(() => {
    return fuelEntries.filter(e => e.vehicleId === activeVehicleId);
  }, [fuelEntries, activeVehicleId]);

  const engineOilStatus = useMemo(() => {
    if (!activeVehicleId) return null;
    return ServiceCalculator.calculateEngineOilStatus(
      activeVehicleServices,
      activeVehicleFuelEntries,
      engineOilInterval,
      engineOilMonthsInterval
    );
  }, [activeVehicleServices, activeVehicleFuelEntries, engineOilInterval, engineOilMonthsInterval, activeVehicleId]);

  // Lock landing tab body to non-scrollable so all content fits inside window frame
  useEffect(() => {
    if (currentTab === 'landing') {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [currentTab]);

  // Auth Subscription
  useEffect(() => {
    const unsubscribe = subscribeToAuth((authUser) => {
      setUser(authUser);
      refreshData(authUser);
      if (authUser) {
        showNotification(`Signed in as ${authUser.displayName || authUser.email}`, 'success');
        // Once signed in, switch to track if on landing page
        setActiveTab('track');
      } else {
        setActiveTab('landing');
      }
    });

    return () => unsubscribe();
  }, [refreshData, showNotification]);

  // Google Authentication
  const handleGoogleSignIn = async () => {
    try {
      await loginWithGoogle();
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') return;
      if (err.code === 'auth/unauthorized-domain' || err.message?.includes('unauthorized-domain')) {
        const domain = window.location.hostname || 'k-692.github.io';
        showNotification(
          `Unauthorized Domain: Add "${domain}" in Firebase Console -> Authentication -> Settings -> Authorized domains`,
          'error'
        );
        return;
      }
      showNotification(`Sign In Error: ${err.message}`, 'error');
    }
  };

  const handleSignOut = async () => {
    try {
      await logoutUser();
      setUser(null);
      setActiveTab('landing');
      refreshData(null);
      showNotification('Signed out successfully.', 'info');
    } catch (err) {
      showNotification(`Sign Out failed: ${err.message}`, 'error');
    }
  };

  // Vehicle Management Handlers
  const handleSelectVehicle = (vehicleId) => {
    setActiveVehicleId(vehicleId);
    localStorage.setItem('fueltracker_active_vehicle_id', vehicleId);
  };

  const handleOpenAddVehicle = () => {
    setEditingVehicle(null);
    setIsVehicleModalOpen(true);
  };

  const handleOpenEditVehicle = (veh) => {
    setEditingVehicle(veh);
    setIsVehicleModalOpen(true);
  };

  const handleSaveVehicle = async (vehicleData) => {
    try {
      const saved = await StorageService.saveVehicle(user, vehicleData);
      await refreshData();
      if (!activeVehicleId) {
        setActiveVehicleId(saved.id);
      }
      showNotification(`Vehicle "${saved.name}" saved!`, 'success');
    } catch (err) {
      showNotification(`Failed to save vehicle: ${err.message}`, 'error');
    }
  };

  const handleDeleteVehicle = (vehicle) => {
    const associatedRefillsCount = fuelEntries.filter(e => e.vehicleId === vehicle.id).length;
    const associatedServicesCount = services.filter(s => s.vehicleId === vehicle.id).length;

    setConfirmDialog({
      isOpen: true,
      title: `Delete ${vehicle.name}?`,
      message: `Are you sure you want to delete this vehicle? This will permanently delete ${associatedRefillsCount} associated fuel refill logs and ${associatedServicesCount} servicing records. This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await StorageService.deleteVehicle(user, vehicle.id);
          await refreshData();
          showNotification(`Vehicle "${vehicle.name}" deleted.`, 'info');
        } catch (err) {
          showNotification(`Failed to delete vehicle: ${err.message}`, 'error');
        }
      }
    });
  };

  // Refill Entry Handlers
  const handleOpenAddRefill = () => {
    if (vehicles.length === 0) {
      showNotification('Please add a vehicle profile first before logging refills.', 'info');
      handleOpenAddVehicle();
      return;
    }
    setEditingRefill(null);
    setIsRefillModalOpen(true);
  };

  const handleOpenEditRefill = (entry) => {
    setEditingRefill(entry);
    setIsRefillModalOpen(true);
  };

  const handleSaveRefill = async (entryData) => {
    try {
      await StorageService.saveFuelEntry(user, entryData);
      await refreshData();
      showNotification('Fuel refill saved!', 'success');
    } catch (err) {
      showNotification(`Failed to save refill: ${err.message}`, 'error');
    }
  };

  const handleDeleteRefill = (entryId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Refill Log?',
      message: 'Are you sure you want to delete this fuel refill entry? Mileage metrics will automatically recalculate for subsequent trips.',
      onConfirm: async () => {
        try {
          await StorageService.deleteFuelEntry(user, entryId);
          await refreshData();
          showNotification('Fuel entry deleted.', 'info');
        } catch (err) {
          showNotification(`Failed to delete refill: ${err.message}`, 'error');
        }
      }
    });
  };

  // Servicing Entry Handlers
  const handleOpenAddService = () => {
    if (vehicles.length === 0) {
      showNotification('Please add a vehicle profile first before logging services.', 'info');
      handleOpenAddVehicle();
      return;
    }
    setEditingService(null);
    setIsServiceModalOpen(true);
  };

  const handleOpenEditService = (service) => {
    setEditingService(service);
    setIsServiceModalOpen(true);
  };

  const handleSaveService = async (serviceData) => {
    try {
      await StorageService.saveServiceEntry(user, serviceData);
      await refreshData();
      showNotification('Vehicle service record saved!', 'success');
    } catch (err) {
      showNotification(`Failed to save service: ${err.message}`, 'error');
    }
  };

  const handleDeleteService = (serviceId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Service Record?',
      message: 'Are you sure you want to delete this maintenance servicing record? This will adjust component price tracking and oil change telemetry.',
      onConfirm: async () => {
        try {
          await StorageService.deleteServiceEntry(user, serviceId);
          await refreshData();
          showNotification('Service record deleted.', 'info');
        } catch (err) {
          showNotification(`Failed to delete service: ${err.message}`, 'error');
        }
      }
    });
  };

  // Data Backup Export / Import Handlers
  const handleExportBackup = () => {
    try {
      const jsonString = StorageService.exportBackup(
        vehicles, 
        fuelTypes, 
        fuelEntries, 
        services, 
        engineOilInterval,
        engineOilMonthsInterval
      );
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FuelTracker_AutoBackup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showNotification('Exported FuelTracker_AutoBackup.json successfully', 'success');
    } catch (err) {
      showNotification(`Export failed: ${err.message}`, 'error');
    }
  };

  const handleImportBackup = async (jsonString) => {
    try {
      const restored = await StorageService.importBackup(user, jsonString);
      setVehicles(restored.vehicles);
      setFuelEntries(restored.entries);
      setServices(restored.services);
      setFuelTypes(restored.fuelTypes);
      setEngineOilIntervalState(restored.engineOilInterval || 5000);
      setEngineOilMonthsIntervalState(restored.engineOilMonthsInterval || 6);
      setActiveVehicleId(restored.activeVehicleId);
      showNotification(
        `Restored ${restored.vehicles.length} vehicle(s), ${restored.entries.length} refill(s), and ${restored.services.length} service(s)!`, 
        'success'
      );
    } catch (err) {
      showNotification(`Import failed: ${err.message}`, 'error');
      throw err;
    }
  };

  const currentActiveVehicle = vehicles.find(v => v.id === activeVehicleId) || vehicles[0];

  return (
    <div className="app-container">
      {/* Navigation Bar */}
      <Navbar 
        activeTab={currentTab}
        setActiveTab={setActiveTab}
        theme={theme}
        toggleTheme={toggleTheme}
        user={user}
        onGoogleSignIn={handleGoogleSignIn}
        onSignOut={handleSignOut}
        oilStatus={engineOilStatus}
        unit={unit}
      />

      {/* Main Content Area */}
      <main className={`main-content ${currentTab === 'landing' ? 'landing-main-content' : ''}`}>
        {currentTab === 'landing' && (
          <LandingPage 
            onOpenTrack={() => setActiveTab('track')}
            onGoogleSignIn={handleGoogleSignIn}
            user={user}
          />
        )}

        {user && currentTab === 'track' && (
          <Dashboard 
            user={user}
            vehicles={vehicles}
            activeVehicleId={activeVehicleId}
            onSelectVehicle={handleSelectVehicle}
            entries={fuelEntries}
            onOpenAddRefill={handleOpenAddRefill}
            onEditRefill={handleOpenEditRefill}
            onOpenAddVehicle={handleOpenAddVehicle}
            onNavigateTab={setActiveTab}
            currency={currency}
            unit={unit}
          />
        )}

        {user && currentTab === 'garage' && (
          <Garage 
            vehicles={vehicles}
            activeVehicleId={activeVehicleId}
            onSelectVehicle={handleSelectVehicle}
            entries={fuelEntries}
            onOpenAddVehicle={handleOpenAddVehicle}
            onEditVehicle={handleOpenEditVehicle}
            onDeleteVehicle={handleDeleteVehicle}
            currency={currency}
            unit={unit}
          />
        )}

        {user && currentTab === 'refills' && (
          <RefillManager 
            vehicles={vehicles}
            activeVehicleId={activeVehicleId}
            onSelectVehicle={handleSelectVehicle}
            entries={fuelEntries}
            onOpenAddRefill={handleOpenAddRefill}
            onEditRefill={handleOpenEditRefill}
            onDeleteRefill={handleDeleteRefill}
            currency={currency}
            unit={unit}
          />
        )}

        {user && currentTab === 'services' && (
          <Services 
            vehicles={vehicles}
            activeVehicleId={activeVehicleId}
            onSelectVehicle={handleSelectVehicle}
            services={services}
            fuelEntries={fuelEntries}
            onOpenAddService={handleOpenAddService}
            onEditService={handleOpenEditService}
            onDeleteService={handleDeleteService}
            onOpenAddVehicle={handleOpenAddVehicle}
            currency={currency}
            unit={unit}
            engineOilInterval={engineOilInterval}
            engineOilMonthsInterval={engineOilMonthsInterval}
          />
        )}

        {user && currentTab === 'analytics' && (
          <Analytics 
            vehicles={vehicles}
            activeVehicleId={activeVehicleId}
            onSelectVehicle={handleSelectVehicle}
            entries={fuelEntries}
            services={services}
            currency={currency}
            unit={unit}
          />
        )}

        {user && currentTab === 'settings' && (
          <Settings 
            theme={theme}
            toggleTheme={toggleTheme}
            currency={currency}
            setCurrency={setCurrency}
            unit={unit}
            setUnit={setUnit}
            engineOilInterval={engineOilInterval}
            setEngineOilInterval={setEngineOilInterval}
            engineOilMonthsInterval={engineOilMonthsInterval}
            setEngineOilMonthsInterval={setEngineOilMonthsInterval}
            user={user}
            onGoogleSignIn={handleGoogleSignIn}
            onSignOut={handleSignOut}
            onOpenFirebaseModal={() => setIsFirebaseModalOpen(true)}
            onExportBackup={handleExportBackup}
            onImportBackup={handleImportBackup}
            showNotification={showNotification}
          />
        )}
      </main>

      {/* Modal Dialogs */}
      <RefillModal 
        isOpen={isRefillModalOpen}
        onClose={() => setIsRefillModalOpen(false)}
        onSave={handleSaveRefill}
        initialData={editingRefill}
        activeVehicleId={activeVehicleId}
        vehicleEntries={fuelEntries.filter(e => e.vehicleId === activeVehicleId)}
        fuelTypes={fuelTypes}
        currency={currency}
        unit={unit}
      />

      <ServiceModal 
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        onSave={handleSaveService}
        initialData={editingService}
        activeVehicle={currentActiveVehicle}
        currency={currency}
        unit={unit}
        latestOdometer={engineOilStatus?.currentOdometer || 0}
      />

      <VehicleModal 
        isOpen={isVehicleModalOpen}
        onClose={() => setIsVehicleModalOpen(false)}
        onSave={handleSaveVehicle}
        initialData={editingVehicle}
      />

      <FirebaseModal 
        isOpen={isFirebaseModalOpen}
        onClose={() => setIsFirebaseModalOpen(false)}
        onConfigSaved={() => {
          initializeFirebaseServices();
          refreshData();
          showNotification('Firebase credentials applied!', 'success');
        }}
      />

      <ConfirmModal 
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
      />

      {/* Toast Feedback */}
      <Toast 
        notification={notification}
        onDismiss={() => setNotification(null)}
      />
    </div>
  );
}
