/**
 * defaultData.js
 * Default system fuel types, realistic pre-seeded vehicles, and sample records.
 * Ensures zero-friction instant demo out of the box and matches the Android Room DB structure.
 */

export const DEFAULT_FUEL_TYPES = [
  { id: 'ft_1', name: 'Regular Petrol', category: 'Petrol', isSystemFuel: true },
  { id: 'ft_2', name: 'Regular Petrol (E20)', category: 'Petrol', isSystemFuel: true },
  { id: 'ft_3', name: 'Premium Petrol 95', category: 'Premium Petrol', isSystemFuel: true },
  { id: 'ft_4', name: 'Premium Petrol 97+', category: 'Premium Petrol', isSystemFuel: true },
  { id: 'ft_5', name: 'Regular Diesel', category: 'Diesel', isSystemFuel: true },
  { id: 'ft_6', name: 'Premium Diesel', category: 'Premium Diesel', isSystemFuel: true },
  { id: 'ft_7', name: 'CNG', category: 'CNG', isSystemFuel: true },
  { id: 'ft_8', name: 'Auto LPG', category: 'LPG', isSystemFuel: true },
  { id: 'ft_9', name: 'Other', category: 'Other', isSystemFuel: true },
];

export const INITIAL_VEHICLES = [];

export const INITIAL_FUEL_ENTRIES = [];

