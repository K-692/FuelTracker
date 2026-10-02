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

export const INITIAL_VEHICLES = [
  {
    id: 'veh_bike_1',
    name: 'Meteor 350 Cruiser',
    registrationNumber: 'DL 03 CB 4412',
    vehicleType: 'BIKE',
    manufacturer: 'Royal Enfield',
    model: 'Meteor 350',
    year: 2023,
    createdAt: Date.now() - 90 * 86400000,
  },
  {
    id: 'veh_car_1',
    name: 'City Commuter i20',
    registrationNumber: 'MH 12 AB 9821',
    vehicleType: 'CAR',
    manufacturer: 'Hyundai',
    model: 'i20 Asta Turbo',
    year: 2022,
    createdAt: Date.now() - 120 * 86400000,
  }
];

export const INITIAL_FUEL_ENTRIES = [
  // Refills for Meteor 350 (Bike)
  // Fill 1: Base fill (establishes baseline odometer and initial fuel volume in tank)
  {
    id: 'entry_b1',
    vehicleId: 'veh_bike_1',
    fuelTypeId: 'ft_1',
    fuelTypeName: 'Regular Petrol',
    odometer: 4200,
    fuelAmount: 12.0,
    totalCost: 1248.0,
    pricePerLiter: 104.0,
    refillDate: new Date(Date.now() - 38 * 86400000).toISOString().split('T')[0],
    notes: 'Initial tank fill at Shell station',
    createdAt: Date.now() - 38 * 86400000,
  },
  // Fill 2: 4620 km (+420 km). Consumed fuel was from Fill 1 (12.0 L).
  // Mileage = 420 / 12.0 = 35.0 km/L.
  {
    id: 'entry_b2',
    vehicleId: 'veh_bike_1',
    fuelTypeId: 'ft_1',
    fuelTypeName: 'Regular Petrol',
    odometer: 4620,
    fuelAmount: 11.5,
    totalCost: 1196.0,
    pricePerLiter: 104.0,
    refillDate: new Date(Date.now() - 25 * 86400000).toISOString().split('T')[0],
    notes: 'Highway cruise trip, smooth performance',
    createdAt: Date.now() - 25 * 86400000,
  },
  // Fill 3: 5045 km (+425 km). Consumed fuel was Fill 2 (11.5 L).
  // Mileage = 425 / 11.5 = 36.96 km/L.
  {
    id: 'entry_b3',
    vehicleId: 'veh_bike_1',
    fuelTypeId: 'ft_3',
    fuelTypeName: 'Premium Petrol 95',
    odometer: 5045,
    fuelAmount: 12.2,
    totalCost: 1342.0,
    pricePerLiter: 110.0,
    refillDate: new Date(Date.now() - 12 * 86400000).toISOString().split('T')[0],
    notes: 'Tried XP95 premium fuel',
    createdAt: Date.now() - 12 * 86400000,
  },
  // Fill 4: 5490 km (+445 km). Consumed fuel was Fill 3 (12.2 L).
  // Mileage = 445 / 12.2 = 36.48 km/L.
  {
    id: 'entry_b4',
    vehicleId: 'veh_bike_1',
    fuelTypeId: 'ft_1',
    fuelTypeName: 'Regular Petrol',
    odometer: 5490,
    fuelAmount: 12.0,
    totalCost: 1260.0,
    pricePerLiter: 105.0,
    refillDate: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
    notes: 'Regular city commute refill',
    createdAt: Date.now() - 2 * 86400000,
  },

  // Refills for Hyundai i20 (Car)
  // Fill 1: Base fill
  {
    id: 'entry_c1',
    vehicleId: 'veh_car_1',
    fuelTypeId: 'ft_1',
    fuelTypeName: 'Regular Petrol',
    odometer: 18500,
    fuelAmount: 32.0,
    totalCost: 3328.0,
    pricePerLiter: 104.0,
    refillDate: new Date(Date.now() - 45 * 86400000).toISOString().split('T')[0],
    notes: 'Full tank at IndianOil',
    createdAt: Date.now() - 45 * 86400000,
  },
  // Fill 2: 18980 km (+480 km). Consumed was Fill 1 (32.0 L).
  // Mileage = 480 / 32 = 15.0 km/L.
  {
    id: 'entry_c2',
    vehicleId: 'veh_car_1',
    fuelTypeId: 'ft_1',
    fuelTypeName: 'Regular Petrol',
    odometer: 18980,
    fuelAmount: 30.5,
    totalCost: 3172.0,
    pricePerLiter: 104.0,
    refillDate: new Date(Date.now() - 28 * 86400000).toISOString().split('T')[0],
    notes: 'Heavy traffic in city commute',
    createdAt: Date.now() - 28 * 86400000,
  },
  // Fill 3: 19520 km (+540 km). Consumed was Fill 2 (30.5 L).
  // Mileage = 540 / 30.5 = 17.70 km/L.
  {
    id: 'entry_c3',
    vehicleId: 'veh_car_1',
    fuelTypeId: 'ft_3',
    fuelTypeName: 'Premium Petrol 95',
    odometer: 19520,
    fuelAmount: 33.0,
    totalCost: 3630.0,
    pricePerLiter: 110.0,
    refillDate: new Date(Date.now() - 8 * 86400000).toISOString().split('T')[0],
    notes: 'Expressway weekend getaway',
    createdAt: Date.now() - 8 * 86400000,
  }
];
