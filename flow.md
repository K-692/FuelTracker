# FuelTracker - Project Implementation Flow & Current State

## 1. Project Overview
**FuelTracker** is a high-precision vehicle telemetry, efficiency, and maintenance lifecycle ecosystem. Engineered around the physical combustion reality of **The Previous Fill-Up Calculation Method**, the platform has completed its architectural transition into an exclusively maintained, cloud-synchronized **Universal Web Application (`web_app/`)** deployed continuously via GitHub Actions to GitHub Pages.

> [!NOTE]
> **Platform Support & Architecture Transition:** Support for native Android and iOS mobile clients has officially concluded. Development is purely focused on the high-performance Universal Web Application.

---

## 2. Current State of the Project

### 2.1 Technology Stack & System Architecture

#### Universal Web Application (`web_app/`)
- **Framework & Tooling:** React 19, Vite 8, JSX, ES Modules
- **UI & Design System:** Minimalist dual-theme (Obsidian Dark Mode `#0c1322` & Crisp Slate Light Mode `#f8fafc`) directly harmonized with [`App_icon/icon.png`](file:///Users/krish/Desktop/K-692/FuelTracker/App_icon/icon.png):
  - Primary Green: `#52c41a`
  - Warning/Amber: `#fadb14`
  - Sunset Orange: `#fa8c16`
  - Danger/Overdue Alert: `#f5222d`
  - Typography: Google Fonts `Outfit` (headings) and `Plus Jakarta Sans` (data metrics)
- **Standardized Date Formatting:** Standardized strictly across all views to `DD/Apr/YYYY` (e.g. `20/Oct/2026`) via [dateFormatter.js](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/src/utils/dateFormatter.js).
- **Navigation & Operational Hubs:**
  - **Unauthenticated State:** Minimalist single-frame hero with Google Sign In button and GitHub repository link.
  - **Authenticated State:** Dynamic top navigation bar rendering 6 primary operational hubs:
    1. `Track`: Fleet quick-selector ribbon, key telemetry metric cards (Average Mileage, Cumulative Distance, Total Fuel Cost, Operating Cost), latest refill snapshot card, and recent logs.
    2. `Garage`: Multi-vehicle profile management with categorization icons (🏍️, 🚗, 🛵, 🚙).
    3. `Refills`: Chronological refill logs with fuel type filters, search, and live preview editing.
    4. `Services` (New): Complete vehicle-wise maintenance tracking across 60 mechanical, fluid, and electrical components, individual component charges, user-inserted final bills, and full historical editability.
    5. `Analytics`: High-contrast SVG line and bar charts for fuel efficiency, refill expenses, component servicing count plots, and component price trajectory over time.
    6. `Settings`: Theme switcher, localization preferences, customizable Engine Oil Service Interval, Firebase keys setup, and JSON backup/restore.
- **Engine Oil Alert System in Navbar:**
  - Real-time status chip placed in the navigation bar displaying exact remaining distance before the next scheduled engine oil change.
  - Status color coding:
    - 🛢️ `Normal`: Green chip when remaining distance is safe (> 500 km).
    - ⚠️ `Warning`: Amber chip when within 500 km of target.
    - 🚨 `Overdue`: Pulsing danger red alert when distance driven exceeds the threshold.
  - Interactive click navigation directly routing to the Services hub.
- **Backend & Cloud Database:** Firebase v10/v11 SDK connected to `ultimatefueltracker`:
  - **Google Authentication:** OAuth popup flow with session persistence (`firebase/auth`).
  - **Cloud Firestore:** Remote database collections `users/{userId}/vehicles`, `users/{userId}/fuel_entries`, `users/{userId}/services`, and `users/{userId}/fuel_types`.
  - **Resilience:** IndexedDB offline persistence and fallback Local Storage.
- **CI/CD & Cloud Distribution:** GitHub Actions workflow ([deploy.yml](file:///Users/krish/Desktop/K-692/FuelTracker/.github/workflows/deploy.yml)) deploying directly to GitHub Pages at [https://k-692.github.io/FuelTracker/](https://k-692.github.io/FuelTracker/).

---

### 2.2 Core Working Principles & Mathematical Formulations

#### 1. Previous Fill-Up Mileage Formulation
$$\text{Mileage (km/L)} = \frac{\text{Current Odometer} - \text{Previous Odometer}}{\text{Previous Fuel Quantity}}$$

- *Physical Rationale:* Fuel pumped into a fuel tank during a refill powers subsequent trips. The distance traveled between the previous refill and the current refill consumed the fuel volume poured in the *previous* refill. Conventional applications that divide delta distance by today's fuel volume yield inaccurate and fluctuating efficiency numbers.
- *Initial Fill Guard:* The initial fill-up on an odometer timeline serves as the baseline reading ($O_0$), establishing the starting fuel volume without generating a false mileage entry.

#### 2. Unit Operational Costs
$$\text{Price per Liter} = \frac{\text{Total Cost}}{\text{Fuel Volume}}$$
$$\text{Operating Cost per Distance Unit} = \frac{\text{Total Cost}}{\text{Current Odometer} - \text{Previous Odometer}}$$

#### 3. Engine Oil Replacement Telemetry Formulation
Let:
- $O_{\text{latest}} = \max(\{O_{\text{fuel}}\} \cup \{O_{\text{service}}\})$ be the vehicle's current maximum odometer reading.
- $O_{\text{oil\_last}}$ be the odometer recorded at the most recent service where Engine Oil was replaced.
- $I_{\text{oil}}$ be the configured service interval (default: $5,000\text{ km}$, configurable in Settings).

The distance driven since the last oil change is:
$$\Delta O_{\text{oil}} = O_{\text{latest}} - O_{\text{oil\_last}}$$

The remaining distance until the next scheduled replacement is:
$$O_{\text{remaining}} = I_{\text{oil}} - \Delta O_{\text{oil}}$$

The status indicator evaluates according to the piecewise condition:
$$\text{Status} = \begin{cases} 
\text{OVERDUE (🚨)} & \text{if } O_{\text{remaining}} \le 0 \\
\text{WARNING (⚠️)} & \text{if } 0 < O_{\text{remaining}} \le 500 \\
\text{OK (🛢️)} & \text{if } O_{\text{remaining}} > 500 
\end{cases}$$

#### 4. Component-Level Price Trajectory & Servicing Frequency
- **Component Frequency:** Sum of servicing occurrences $\sum \mathbb{I}(\text{component}_i = \text{Yes})$ for vehicle $V$.
- **Component Price Trend:** For any component $c$ serviced at historical dates $t_1, t_2, \dots, t_k$:
  $$\text{Price Trend (\%)} = \frac{P_k - P_1}{P_1} \times 100$$
  where $P_1$ is baseline replacement charge and $P_k$ is latest replacement charge.

---

### 2.3 The 60 Vehicle Maintenance Components Taxonomy

| No. | Component | Vehicle Label | System Classification |
|---|---|---|---|
| 1 | Engine oil | Both | Engine & Lubrication |
| 2 | Engine | Both | Engine & Lubrication |
| 3 | Oil filter | Both | Engine & Lubrication |
| 4 | Air filter | Both | Ignition & Fuel System |
| 5 | Cabin AC filter | Car | Body, Cabin & Climate |
| 6 | Fuel filter | Both | Ignition & Fuel System |
| 7 | Fuel injectors | Both | Ignition & Fuel System |
| 8 | Spark plugs | Both | Ignition & Fuel System |
| 9 | Ignition coils | Both | Ignition & Fuel System |
| 10 | Cooling system | Both | Cooling System |
| 11 | Coolant | Both | Cooling System |
| 12 | Radiator | Both (liquid-cooled) | Cooling System |
| 13 | Radiator fan | Both (liquid-cooled) | Cooling System |
| 14 | Water pump | Both (liquid-cooled) | Cooling System |
| 15 | Thermostat | Both (liquid-cooled) | Cooling System |
| 16 | Battery | Both | Electrical, ECU & Sensors |
| 17 | Alternator / charging system | Both | Electrical, ECU & Sensors |
| 18 | Starter motor | Both (if equipped) | Electrical, ECU & Sensors |
| 19 | Braking system | Both | Braking System & Wheels |
| 20 | Brake pads | Both (disc brakes) | Braking System & Wheels |
| 21 | Brake discs and drums | Both | Braking System & Wheels |
| 22 | Brake fluid | Both (hydraulic brakes) | Braking System & Wheels |
| 23 | ABS system | Both (if equipped) | Braking System & Wheels |
| 24 | Tyres | Both | Braking System & Wheels |
| 25 | Wheel alignment | Both | Braking System & Wheels |
| 26 | Wheel balancing | Both | Braking System & Wheels |
| 27 | Suspension system | Both | Suspension & Steering |
| 28 | Shock absorbers and struts | Both | Suspension & Steering |
| 29 | Steering system | Both | Suspension & Steering |
| 30 | Steering fluid | Car (hydraulic steering) | Suspension & Steering |
| 31 | Clutch system | Both (manual / applicable transmissions) | Transmission & Drivetrain |
| 32 | Transmission / gearbox | Both | Transmission & Drivetrain |
| 33 | Transmission fluid | Both (as specified) | Transmission & Drivetrain |
| 34 | Driveshafts and CV joints | Car | Transmission & Drivetrain |
| 35 | Differential | Car (and some specialised bikes) | Transmission & Drivetrain |
| 36 | Drive belts | Both (where fitted) | Transmission & Drivetrain |
| 37 | Timing belt or timing chain | Both (depending on engine) | Engine & Lubrication |
| 38 | Hoses and pipes | Both | Cooling System |
| 39 | Exhaust system | Both | Exhaust & Emissions |
| 40 | Catalytic converter | Both (where fitted) | Exhaust & Emissions |
| 41 | Oxygen sensor | Both (where fitted) | Exhaust & Emissions |
| 42 | Engine sensors | Both | Electrical, ECU & Sensors |
| 43 | ECU (Engine Control Unit) | Both (where fitted) | Electrical, ECU & Sensors |
| 44 | OBD diagnostic system | Both (diagnostic support varies) | Electrical, ECU & Sensors |
| 45 | Air conditioning system | Car | Body, Cabin & Climate |
| 46 | Wipers and washer system | Car | Body, Cabin & Climate |
| 47 | Headlights and tail lights | Both | Electrical, ECU & Sensors |
| 48 | Horn | Both | Electrical, ECU & Sensors |
| 49 | Fuel tank and fuel lines | Both (combustion vehicles) | Ignition & Fuel System |
| 50 | Door locks and hinges | Car | Body, Cabin & Climate |
| 51 | Seat belts | Car | Body, Cabin & Climate |
| 52 | Windshield and mirrors | Both | Body, Cabin & Climate |
| 53 | Parking brake | Both (design varies) | Braking System & Wheels |
| 54 | Engine and transmission mounts | Both | Engine & Lubrication |
| 55 | Wheel bearings | Both | Braking System & Wheels |
| 56 | Chassis and underbody | Both | Body, Cabin & Climate |
| 57 | Suspension bushings and ball joints | Both (design varies) | Suspension & Steering |
| 58 | Power steering system | Car | Suspension & Steering |
| 59 | Emission control system | Both (combustion vehicles) | Exhaust & Emissions |
| 60 | Vehicle fluids and lubricants | Both | Engine & Lubrication |

---

## 3. Implementation Journey

### Phase 1: Domain Logic & Mathematics
- Implemented [FuelCalculator.js](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/src/domain/FuelCalculator.js) for Previous Fill-Up physics, delta distance, unit pricing, and chronological sorting.

### Phase 2: Relational Data Layer & Entities
- Standardized schemas across Cloud Firestore and LocalStorage: `vehicles`, `fuel_types`, `fuel_entries`, and `services`.

### Phase 3: Android Jetpack Compose Prototype (Legacy)
- Built prototype Android client; platform support has now concluded in favor of the Universal Web Application.

### Phase 4: Universal Web Application Extension
- Created responsive React 19 + Vite 8 SPA with dual-theme design system.
- Standardized `DD/Apr/YYYY` date formatting across all views.
- Built interactive SVG charting engine (`Charts.jsx`) with custom tooltips.

### Phase 5: CI/CD & Automated GitHub Deployment
- Set up GitHub Actions workflow [deploy.yml](file:///Users/krish/Desktop/K-692/FuelTracker/.github/workflows/deploy.yml) deploying directly to GitHub Pages on push to `main`.

### Phase 6: Blank Screen Resolution & ErrorBoundary Hardening
- Resolved Temporal Dead Zone hook ordering issue in `App.jsx`.
- Added [ErrorBoundary.jsx](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/src/components/ErrorBoundary.jsx) wrapping root application.

### Phase 7: Mobile Platform Support Sunset
- Ended native Android and iOS mobile app development; updated documentation and UI to focus purely on the Universal Web Application.
- Replaced Android-specific backup nomenclature with universal JSON data backup and recovery schema.

### Phase 8: 60-Component Vehicle Servicing & Maintenance Engine
- Created [serviceComponents.js](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/src/domain/serviceComponents.js) containing the complete 60-component catalogue with intelligent vehicle category filtering (Two-wheelers vs Cars).
- Implemented [ServiceModal.jsx](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/src/components/ServiceModal.jsx):
  - Segmented Yes/No toggles for each component (defaults to `No`).
  - Active component charge/price input fields.
  - Final total bill field directly entered by the user with auto-sum assistance.
  - Category filters, search bar, and vehicle type toggle.
- Built [Services.jsx](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/src/components/Services.jsx) for vehicle-specific servicing history, summary metrics, and collapsible 60-component checklist inspection.
- Ensured full editability: past service records can be modified or deleted with real-time recalculation.
- Updated [storage.js](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/src/services/storage.js) with `users/{uid}/services` collection, cascading vehicle deletion, and JSON backup/restore.

### Phase 9: Real-Time Engine Oil Alert System & Navigation Bar Telemetry
- Created [serviceCalculator.js](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/src/domain/serviceCalculator.js) to compute distance driven since the last recorded engine oil change and evaluate remaining distance against the target interval.
- Added customizable "Engine Oil Replacement Interval" setting in [Settings.jsx](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/src/components/Settings.jsx) (default: 5,000 km).
- Integrated high-visibility Engine Oil Alert Chip in [Navbar.jsx](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/src/components/Navbar.jsx) with dynamic status (`Normal`, `Warning`, `Overdue` with pulsing red animation) and one-click navigation to the Services hub.

### Phase 10: Component-Level Servicing Analytics & Price Trend Visualizations
- Created `HorizontalBarChart` in [Charts.jsx](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/src/components/Charts.jsx) to render ranked component service frequency counts.
- Updated [Analytics.jsx](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/src/components/Analytics.jsx) with a dual-view selector (`Fuel & Efficiency` vs `Servicing & Maintenance`):
  - **Component Servicing Frequency & Count Plot:** Ranks how many times each component has been serviced for the active vehicle along with total expenditure.
  - **Component Price Analysis Over Time:** Interactive SVG line chart with component selector, current price, min/max historical charges, average cost, and percentage inflation/deflation trend.

---

## 4. Current File Inventory

### Universal Web Application (`web_app/`)
- **Domain Logic:**
  - [FuelCalculator.js](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/src/domain/FuelCalculator.js): Previous fill-up calculations.
  - [serviceComponents.js](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/src/domain/serviceComponents.js): 60 vehicle maintenance components catalogue and vehicle type filtering.
  - [serviceCalculator.js](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/src/domain/serviceCalculator.js): Engine oil interval telemetry, component frequency calculation, and price trajectory analysis.
- **Utilities:**
  - [dateFormatter.js](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/src/utils/dateFormatter.js): Standardized `DD/Apr/YYYY` date formatting.
- **Services:**
  - [firebase.js](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/src/services/firebase.js): Google Auth & Cloud Firestore credentials.
  - [storage.js](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/src/services/storage.js): Unified data repository managing vehicles, fuel entries, services, preferences, and JSON backup/restore.
  - [defaultData.js](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/src/services/defaultData.js): Standard fuel grades catalogue.
- **Components:**
  - [Navbar.jsx](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/src/components/Navbar.jsx): Navigation header with Services tab and dynamic Engine Oil Alert chip.
  - [Services.jsx](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/src/components/Services.jsx): Vehicle-wise servicing hub, engine oil telemetry card, and 60-component service history.
  - [ServiceModal.jsx](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/src/components/ServiceModal.jsx): Add/Edit service record modal with 60-component checklist, price inputs, and final total bill.
  - [Dashboard.jsx](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/src/components/Dashboard.jsx): Track telemetry view.
  - [Garage.jsx](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/src/components/Garage.jsx): Vehicle fleet manager.
  - [RefillManager.jsx](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/src/components/RefillManager.jsx): Fuel fill-up history.
  - [RefillModal.jsx](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/src/components/RefillModal.jsx): Add/Edit fuel fill-up dialog.
  - [VehicleModal.jsx](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/src/components/VehicleModal.jsx): Add/Edit vehicle profile dialog.
  - [Analytics.jsx](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/src/components/Analytics.jsx): Fuel analytics and vehicle servicing analytics.
  - [Charts.jsx](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/src/components/Charts.jsx): SVG LineChart, BarChart, and HorizontalBarChart.
  - [Settings.jsx](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/src/components/Settings.jsx): Preferences, engine oil interval configuration, cloud sync, and JSON backup/recovery.
  - [LandingPage.jsx](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/src/components/LandingPage.jsx): Welcome hero page.
  - [ErrorBoundary.jsx](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/src/components/ErrorBoundary.jsx): Root crash protection wrapper.
  - [FirebaseModal.jsx](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/src/components/FirebaseModal.jsx): In-browser Firebase credentials dialog.
  - [ConfirmModal.jsx](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/src/components/ConfirmModal.jsx): Deletion safety modal.
  - [Toast.jsx](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/src/components/Toast.jsx): Notification feedback.
- **Design System:** [index.css](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/src/index.css)
- **Application Root:** [App.jsx](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/src/App.jsx), [main.jsx](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/src/main.jsx), [index.html](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/index.html)
- **Configuration & CI/CD:** [vite.config.js](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/vite.config.js), [deploy.yml](file:///Users/krish/Desktop/K-692/FuelTracker/.github/workflows/deploy.yml)
