/**
 * serviceComponents.js
 * Master catalogue of the 60 vehicle servicing components and systems.
 * 
 * Labels:
 * - Both: Applicable to both passenger cars and motorcycles/scooters.
 * - Car: Specific to passenger cars / 4-wheelers.
 * - Sub-qualifiers like (liquid-cooled), (if equipped), etc., are retained for detailed technical clarity.
 */

export const SERVICE_CATEGORIES = {
  ENGINE_LUBRICATION: 'Engine & Lubrication',
  COOLING_SYSTEM: 'Cooling System',
  IGNITION_FUEL: 'Ignition & Fuel System',
  TRANSMISSION_DRIVETRAIN: 'Transmission & Drivetrain',
  BRAKES_WHEELS: 'Braking System & Wheels',
  SUSPENSION_STEERING: 'Suspension & Steering',
  ELECTRICAL_SENSORS: 'Electrical, ECU & Sensors',
  BODY_CABIN: 'Body, Cabin & Climate',
  EXHAUST_EMISSIONS: 'Exhaust & Emissions',
};

export const SERVICE_COMPONENTS = [
  // 1 to 4: Engine Core & Air/Oil Filters
  {
    id: 'engine_oil',
    number: 1,
    name: 'Engine oil',
    vehicleLabel: 'Both',
    isCarOnly: false,
    category: SERVICE_CATEGORIES.ENGINE_LUBRICATION,
    isEngineOil: true,
  },
  {
    id: 'engine',
    number: 2,
    name: 'Engine',
    vehicleLabel: 'Both',
    isCarOnly: false,
    category: SERVICE_CATEGORIES.ENGINE_LUBRICATION,
  },
  {
    id: 'oil_filter',
    number: 3,
    name: 'Oil filter',
    vehicleLabel: 'Both',
    isCarOnly: false,
    category: SERVICE_CATEGORIES.ENGINE_LUBRICATION,
  },
  {
    id: 'air_filter',
    number: 4,
    name: 'Air filter',
    vehicleLabel: 'Both',
    isCarOnly: false,
    category: SERVICE_CATEGORIES.IGNITION_FUEL,
  },
  {
    id: 'cabin_ac_filter',
    number: 5,
    name: 'Cabin AC filter',
    vehicleLabel: 'Car',
    isCarOnly: true,
    category: SERVICE_CATEGORIES.BODY_CABIN,
  },
  {
    id: 'fuel_filter',
    number: 6,
    name: 'Fuel filter',
    vehicleLabel: 'Both',
    isCarOnly: false,
    category: SERVICE_CATEGORIES.IGNITION_FUEL,
  },
  {
    id: 'fuel_injectors',
    number: 7,
    name: 'Fuel injectors',
    vehicleLabel: 'Both',
    isCarOnly: false,
    category: SERVICE_CATEGORIES.IGNITION_FUEL,
  },
  {
    id: 'spark_plugs',
    number: 8,
    name: 'Spark plugs',
    vehicleLabel: 'Both',
    isCarOnly: false,
    category: SERVICE_CATEGORIES.IGNITION_FUEL,
  },
  {
    id: 'ignition_coils',
    number: 9,
    name: 'Ignition coils',
    vehicleLabel: 'Both',
    isCarOnly: false,
    category: SERVICE_CATEGORIES.IGNITION_FUEL,
  },
  {
    id: 'cooling_system',
    number: 10,
    name: 'Cooling system',
    vehicleLabel: 'Both',
    isCarOnly: false,
    category: SERVICE_CATEGORIES.COOLING_SYSTEM,
  },
  {
    id: 'coolant',
    number: 11,
    name: 'Coolant',
    vehicleLabel: 'Both',
    isCarOnly: false,
    category: SERVICE_CATEGORIES.COOLING_SYSTEM,
  },
  {
    id: 'radiator',
    number: 12,
    name: 'Radiator',
    vehicleLabel: 'Both (liquid-cooled)',
    isCarOnly: false,
    category: SERVICE_CATEGORIES.COOLING_SYSTEM,
  },
  {
    id: 'radiator_fan',
    number: 13,
    name: 'Radiator fan',
    vehicleLabel: 'Both (liquid-cooled)',
    isCarOnly: false,
    category: SERVICE_CATEGORIES.COOLING_SYSTEM,
  },
  {
    id: 'water_pump',
    number: 14,
    name: 'Water pump',
    vehicleLabel: 'Both (liquid-cooled)',
    isCarOnly: false,
    category: SERVICE_CATEGORIES.COOLING_SYSTEM,
  },
  {
    id: 'thermostat',
    number: 15,
    name: 'Thermostat',
    vehicleLabel: 'Both (liquid-cooled)',
    isCarOnly: false,
    category: SERVICE_CATEGORIES.COOLING_SYSTEM,
  },
  {
    id: 'battery',
    number: 16,
    name: 'Battery',
    vehicleLabel: 'Both',
    isCarOnly: false,
    category: SERVICE_CATEGORIES.ELECTRICAL_SENSORS,
  },
  {
    id: 'alternator_charging_system',
    number: 17,
    name: 'Alternator / charging system',
    vehicleLabel: 'Both',
    isCarOnly: false,
    category: SERVICE_CATEGORIES.ELECTRICAL_SENSORS,
  },
  {
    id: 'starter_motor',
    number: 18,
    name: 'Starter motor',
    vehicleLabel: 'Both (if equipped)',
    isCarOnly: false,
    category: SERVICE_CATEGORIES.ELECTRICAL_SENSORS,
  },
  {
    id: 'braking_system',
    number: 19,
    name: 'Braking system',
    vehicleLabel: 'Both',
    isCarOnly: false,
    category: SERVICE_CATEGORIES.BRAKES_WHEELS,
  },
  {
    id: 'brake_pads',
    number: 20,
    name: 'Brake pads',
    vehicleLabel: 'Both (disc brakes)',
    isCarOnly: false,
    category: SERVICE_CATEGORIES.BRAKES_WHEELS,
  },
  {
    id: 'brake_discs_drums',
    number: 21,
    name: 'Brake discs and drums',
    vehicleLabel: 'Both',
    isCarOnly: false,
    category: SERVICE_CATEGORIES.BRAKES_WHEELS,
  },
  {
    id: 'brake_fluid',
    number: 22,
    name: 'Brake fluid',
    vehicleLabel: 'Both (hydraulic brakes)',
    isCarOnly: false,
    category: SERVICE_CATEGORIES.BRAKES_WHEELS,
  },
  {
    id: 'abs_system',
    number: 23,
    name: 'ABS system',
    vehicleLabel: 'Both (if equipped)',
    isCarOnly: false,
    category: SERVICE_CATEGORIES.BRAKES_WHEELS,
  },
  {
    id: 'tyres',
    number: 24,
    name: 'Tyres',
    vehicleLabel: 'Both',
    isCarOnly: false,
    category: SERVICE_CATEGORIES.BRAKES_WHEELS,
  },
  {
    id: 'wheel_alignment',
    number: 25,
    name: 'Wheel alignment',
    vehicleLabel: 'Both',
    isCarOnly: false,
    category: SERVICE_CATEGORIES.BRAKES_WHEELS,
  },
  {
    id: 'wheel_balancing',
    number: 26,
    name: 'Wheel balancing',
    vehicleLabel: 'Both',
    isCarOnly: false,
    category: SERVICE_CATEGORIES.BRAKES_WHEELS,
  },
  {
    id: 'suspension_system',
    number: 27,
    name: 'Suspension system',
    vehicleLabel: 'Both',
    isCarOnly: false,
    category: SERVICE_CATEGORIES.SUSPENSION_STEERING,
  },
  {
    id: 'shock_absorbers_struts',
    number: 28,
    name: 'Shock absorbers and struts',
    vehicleLabel: 'Both',
    isCarOnly: false,
    category: SERVICE_CATEGORIES.SUSPENSION_STEERING,
  },
  {
    id: 'steering_system',
    number: 29,
    name: 'Steering system',
    vehicleLabel: 'Both',
    isCarOnly: false,
    category: SERVICE_CATEGORIES.SUSPENSION_STEERING,
  },
  {
    id: 'steering_fluid',
    number: 30,
    name: 'Steering fluid',
    vehicleLabel: 'Car (hydraulic steering)',
    isCarOnly: true,
    category: SERVICE_CATEGORIES.SUSPENSION_STEERING,
  },
  {
    id: 'clutch_system',
    number: 31,
    name: 'Clutch system',
    vehicleLabel: 'Both (manual / applicable transmissions)',
    isCarOnly: false,
    category: SERVICE_CATEGORIES.TRANSMISSION_DRIVETRAIN,
  },
  {
    id: 'transmission_gearbox',
    number: 32,
    name: 'Transmission / gearbox',
    vehicleLabel: 'Both',
    isCarOnly: false,
    category: SERVICE_CATEGORIES.TRANSMISSION_DRIVETRAIN,
  },
  {
    id: 'transmission_fluid',
    number: 33,
    name: 'Transmission fluid',
    vehicleLabel: 'Both (as specified)',
    isCarOnly: false,
    category: SERVICE_CATEGORIES.TRANSMISSION_DRIVETRAIN,
  },
  {
    id: 'driveshafts_cv_joints',
    number: 34,
    name: 'Driveshafts and CV joints',
    vehicleLabel: 'Car',
    isCarOnly: true,
    category: SERVICE_CATEGORIES.TRANSMISSION_DRIVETRAIN,
  },
  {
    id: 'differential',
    number: 35,
    name: 'Differential',
    vehicleLabel: 'Car (and some specialised bikes)',
    isCarOnly: true,
    category: SERVICE_CATEGORIES.TRANSMISSION_DRIVETRAIN,
  },
  {
    id: 'drive_belts',
    number: 36,
    name: 'Drive belts',
    vehicleLabel: 'Both (where fitted)',
    isCarOnly: false,
    category: SERVICE_CATEGORIES.TRANSMISSION_DRIVETRAIN,
  },
  {
    id: 'timing_belt_chain',
    number: 37,
    name: 'Timing belt or timing chain',
    vehicleLabel: 'Both (depending on engine)',
    isCarOnly: false,
    category: SERVICE_CATEGORIES.ENGINE_LUBRICATION,
  },
  {
    id: 'hoses_pipes',
    number: 38,
    name: 'Hoses and pipes',
    vehicleLabel: 'Both',
    isCarOnly: false,
    category: SERVICE_CATEGORIES.COOLING_SYSTEM,
  },
  {
    id: 'exhaust_system',
    number: 39,
    name: 'Exhaust system',
    vehicleLabel: 'Both',
    isCarOnly: false,
    category: SERVICE_CATEGORIES.EXHAUST_EMISSIONS,
  },
  {
    id: 'catalytic_converter',
    number: 40,
    name: 'Catalytic converter',
    vehicleLabel: 'Both (where fitted)',
    isCarOnly: false,
    category: SERVICE_CATEGORIES.EXHAUST_EMISSIONS,
  },
  {
    id: 'oxygen_sensor',
    number: 41,
    name: 'Oxygen sensor',
    vehicleLabel: 'Both (where fitted)',
    isCarOnly: false,
    category: SERVICE_CATEGORIES.EXHAUST_EMISSIONS,
  },
  {
    id: 'engine_sensors',
    number: 42,
    name: 'Engine sensors',
    vehicleLabel: 'Both',
    isCarOnly: false,
    category: SERVICE_CATEGORIES.ELECTRICAL_SENSORS,
  },
  {
    id: 'ecu',
    number: 43,
    name: 'ECU (Engine Control Unit)',
    vehicleLabel: 'Both (where fitted)',
    isCarOnly: false,
    category: SERVICE_CATEGORIES.ELECTRICAL_SENSORS,
  },
  {
    id: 'obd_system',
    number: 44,
    name: 'OBD diagnostic system',
    vehicleLabel: 'Both (diagnostic support varies)',
    isCarOnly: false,
    category: SERVICE_CATEGORIES.ELECTRICAL_SENSORS,
  },
  {
    id: 'ac_system',
    number: 45,
    name: 'Air conditioning system',
    vehicleLabel: 'Car',
    isCarOnly: true,
    category: SERVICE_CATEGORIES.BODY_CABIN,
  },
  {
    id: 'wipers_washer',
    number: 46,
    name: 'Wipers and washer system',
    vehicleLabel: 'Car',
    isCarOnly: true,
    category: SERVICE_CATEGORIES.BODY_CABIN,
  },
  {
    id: 'headlights_tail_lights',
    number: 47,
    name: 'Headlights and tail lights',
    vehicleLabel: 'Both',
    isCarOnly: false,
    category: SERVICE_CATEGORIES.ELECTRICAL_SENSORS,
  },
  {
    id: 'horn',
    number: 48,
    name: 'Horn',
    vehicleLabel: 'Both',
    isCarOnly: false,
    category: SERVICE_CATEGORIES.ELECTRICAL_SENSORS,
  },
  {
    id: 'fuel_tank_lines',
    number: 49,
    name: 'Fuel tank and fuel lines',
    vehicleLabel: 'Both (combustion vehicles)',
    isCarOnly: false,
    category: SERVICE_CATEGORIES.IGNITION_FUEL,
  },
  {
    id: 'door_locks_hinges',
    number: 50,
    name: 'Door locks and hinges',
    vehicleLabel: 'Car',
    isCarOnly: true,
    category: SERVICE_CATEGORIES.BODY_CABIN,
  },
  {
    id: 'seat_belts',
    number: 51,
    name: 'Seat belts',
    vehicleLabel: 'Car',
    isCarOnly: true,
    category: SERVICE_CATEGORIES.BODY_CABIN,
  },
  {
    id: 'windshield_mirrors',
    number: 52,
    name: 'Windshield and mirrors',
    vehicleLabel: 'Both',
    isCarOnly: false,
    category: SERVICE_CATEGORIES.BODY_CABIN,
  },
  {
    id: 'parking_brake',
    number: 53,
    name: 'Parking brake',
    vehicleLabel: 'Both (design varies)',
    isCarOnly: false,
    category: SERVICE_CATEGORIES.BRAKES_WHEELS,
  },
  {
    id: 'engine_trans_mounts',
    number: 54,
    name: 'Engine and transmission mounts',
    vehicleLabel: 'Both',
    isCarOnly: false,
    category: SERVICE_CATEGORIES.ENGINE_LUBRICATION,
  },
  {
    id: 'wheel_bearings',
    number: 55,
    name: 'Wheel bearings',
    vehicleLabel: 'Both',
    isCarOnly: false,
    category: SERVICE_CATEGORIES.BRAKES_WHEELS,
  },
  {
    id: 'chassis_underbody',
    number: 56,
    name: 'Chassis and underbody',
    vehicleLabel: 'Both',
    isCarOnly: false,
    category: SERVICE_CATEGORIES.BODY_CABIN,
  },
  {
    id: 'suspension_bushings_ball_joints',
    number: 57,
    name: 'Suspension bushings and ball joints',
    vehicleLabel: 'Both (design varies)',
    isCarOnly: false,
    category: SERVICE_CATEGORIES.SUSPENSION_STEERING,
  },
  {
    id: 'power_steering_system',
    number: 58,
    name: 'Power steering system',
    vehicleLabel: 'Car',
    isCarOnly: true,
    category: SERVICE_CATEGORIES.SUSPENSION_STEERING,
  },
  {
    id: 'emission_control_system',
    number: 59,
    name: 'Emission control system',
    vehicleLabel: 'Both (combustion vehicles)',
    isCarOnly: false,
    category: SERVICE_CATEGORIES.EXHAUST_EMISSIONS,
  },
  {
    id: 'vehicle_fluids_lubricants',
    number: 60,
    name: 'Vehicle fluids and lubricants',
    vehicleLabel: 'Both',
    isCarOnly: false,
    category: SERVICE_CATEGORIES.ENGINE_LUBRICATION,
  },
];

/**
 * Filters the component catalogue based on the vehicle category.
 * If vehicle is 2-wheeler (BIKE, SCOOTER), filters out Car-only items.
 * If vehicle is 4-wheeler (CAR, OTHER), includes all items.
 *
 * @param {string} vehicleType - 'BIKE' | 'SCOOTER' | 'CAR' | 'OTHER'
 * @param {boolean} forceAll - If true, returns all 60 components regardless of type
 * @returns {Array} List of applicable components
 */
export function getComponentsForVehicle(vehicleType = 'CAR', forceAll = false) {
  if (forceAll) return SERVICE_COMPONENTS;
  const isTwoWheeler = vehicleType === 'BIKE' || vehicleType === 'SCOOTER';
  if (isTwoWheeler) {
    return SERVICE_COMPONENTS.filter(c => !c.isCarOnly);
  }
  return SERVICE_COMPONENTS;
}

/**
 * Initializes default empty checklist state for all components.
 * Default values are No (done: false) with price: 0.
 */
export function getDefaultComponentsState() {
  const state = {};
  SERVICE_COMPONENTS.forEach(c => {
    state[c.id] = {
      done: false,
      price: 0,
    };
  });
  return state;
}
