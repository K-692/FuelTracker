# FuelTracker - Project Implementation Flow & Current State

## 1. Project Overview
**FuelTracker** is a multi-platform vehicle fuel telemetry and efficiency tracking ecosystem comprising:
1. **Native Android Application:** Engineered using Kotlin, Jetpack Compose, Material 3, Hilt DI, and Room SQLite.
2. **Universal Web Application (`web_app/`):** A modern, responsive single-page application built with React, Vite, a dual-theme design system derived from the official app icon palette, Google Authentication, Cloud Firestore synchronization, and automated GitHub Pages CI/CD.

Both applications share the identical scientific core principle: **The Previous Fill-Up Calculation Method**.

---

## 2. Current State of the Project

### 2.1 Technology Stack & System Architecture

#### A. Native Android Client (`app/`)
- **Language & Runtime:** Kotlin (Target JVM 11), Android SDK (compileSdk 34, minSdk 27)
- **UI Toolkit:** Jetpack Compose with Material 3 design system, Material Icons Extended
- **Architecture Pattern:** MVVM (Model-View-ViewModel) with unidirectional data flow (UDF) via Kotlin Coroutines & `StateFlow`
- **Dependency Injection:** Dagger Hilt (`@HiltAndroidApp`, `@HiltViewModel`, `@Singleton`)
- **Persistence / Database:** Room ORM with SQLite, Foreign Key Cascades & Indices
- **User Preferences:** Jetpack DataStore (Preferences DataStore)
- **Data Serialization & Backup:** Google Gson for JSON data export/import and automated recovery
- **Data Visualization:** Vico Charting library for Compose (`com.patrykandpatrick.vico:compose-m3`)
- **Build System:** Gradle Kotlin DSL with version catalogs (`libs.versions.toml`)

#### B. Universal Web Client (`web_app/`)
- **Framework & Tooling:** React 19, Vite 8, JSX, ES Modules
- **UI & Design System:** Minimalist dual-theme (Obsidian Dark Mode `#0c1322` & Crisp Slate Light Mode `#f8fafc`) directly harmonized with [`App_icon/icon.png`](file:///Users/krish/Desktop/K-692/FuelTracker/App_icon/icon.png):
  - Primary Green: `#52c41a`
  - Warning/Amber: `#fadb14`
  - Sunset Orange: `#fa8c16`
  - Typography: Google Fonts `Outfit` (headings) and `Plus Jakarta Sans` (data metrics)
- **Date Formatting:** Standardized strictly across all views to `DD/Apr/YYYY` (e.g. `02/Oct/2026`) via [dateFormatter.js](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/src/utils/dateFormatter.js).
- **Navigation & Authentication Gating:**
  - **Unauthenticated State:** Navbar strictly presents *only* the FuelTracker brand/logo on the left and the theme toggle + "Google Sign In" button on the right (no "Overview" or other navigation tabs). The landing/overview body is non-scrollable and sized to fit comfortably within the window frame without vertical scrollbars. The heading "The Ultimate Fuel Tracker" is styled to fit on a single line (`white-space: nowrap`).
  - **Authenticated State:** The Overview tab is completely hidden. The user is automatically routed to the "Track" tab, and the navbar renders the 5 operational tabs: `Track`, `Garage`, `Refills`, `Analytics`, and `Settings`.
  - `Track` (Telemetry View): Displays personalized greeting `"Hi, <google username>!"`, fleet quick-selector ribbon, key telemetry metric cards (Average Mileage, Cumulative Distance, Total Fuel Cost, Operating Cost), latest refill snapshot card, and recent logs.
  - `Garage`: Multi-vehicle profile management with categorization icons (🏍️, 🚗, 🛵, 🚙) and empty-state guidance.
  - `Refills`: Chronological refill logs with search, fuel grade filtering, and detailed breakdown.
  - `Analytics`: High-contrast SVG line and bar charts with hover tooltips for mileage trajectories, refill expenses, and pump price evolution.
  - `Settings`: Dual-theme switcher, unit/currency preferences, Firebase keys setup, and JSON backup/restore.
- **Zero-Demo Initialization:** No demo vehicles or pre-seeded entries are loaded into Firestore or LocalStorage. First-time sign-ins start with completely empty fields, clean empty-state cards, and prompts to configure their genuine vehicle profiles.
- **Backend & Cloud Database:** Firebase v10/v11 SDK connected to `ultimatefueltracker`:
  - **Google Authentication:** OAuth popup flow with session persistence (`firebase/auth`).
  - **Cloud Firestore:** Remote database collections `users/{userId}/vehicles`, `users/{userId}/fuel_entries`, and `users/{userId}/fuel_types`.
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

#### 3. Multi-Vehicle Contextual Isolation
- Independent odometer timelines, fuel logs, and statistical aggregations per vehicle profile.
- Cascading deletion guarantees: deleting a vehicle profile cleanly wipes associated fuel entries without leaving orphaned data records.

---

## 3. Implementation Journey

### Phase 1: Domain Logic & Mathematics (Android & Web)
- Implemented and verified [FuelCalculator](file:///Users/krish/Desktop/K-692/FuelTracker/app/src/main/java/com/fueltracker/domain/calculator/FuelCalculator.kt) singleton in Kotlin and [FuelCalculator.js](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/src/domain/FuelCalculator.js) in JavaScript:
  - Mileage calculation with zero-division and negative-distance guards.
  - Price per liter calculation.
  - Net trip distance delta.
  - Operating cost per kilometer.
  - Chronological sorting and cumulative metrics aggregation.

### Phase 2: Relational Data Layer & Entities
- Standardized entities across SQLite (Room) and Cloud Firestore / LocalStorage:
  - **Vehicle:** `id`, `name`, `registrationNumber`, `vehicleType` (BIKE, SCOOTER, CAR, OTHER), `manufacturer`, `model`, `year`, `createdAt`.
  - **FuelType:** `id`, `name`, `category`, `brand`, `isSystemFuel` (Regular Petrol, Regular Petrol E20, Premium Petrol 95, Premium Petrol 97+, Regular Diesel, Premium Diesel, CNG, Auto LPG, Other).
  - **FuelEntry:** `id`, `vehicleId`, `fuelTypeId`, `odometer`, `fuelAmount`, `totalCost`, `pricePerLiter`, `refillDate`, `notes`, `createdAt`.

### Phase 3: Android Jetpack Compose Presentation Layer
- Designed Material 3 UI with multi-screen navigation:
  - `VehicleSelectionScreen`: Fleet selection and profile management.
  - `HomeScreen`: Vehicle telemetry dashboard, quick metrics, and latest refill highlight.
  - `AddFuelScreen`: Real-time mathematical preview of trip distance, unit price, and mileage.
  - `FuelHistoryScreen` & `FuelDetailsScreen`: Detailed inspection and deletion safeguards.
  - `StatisticsScreen`: Cumulative graphs and efficiency averages.
  - `SettingsScreen`: JSON backup/restore.

### Phase 4: Universal Web Application Extension (`web_app/`)
- **Scaffolding:** Bootstrapped Vite + React client in `web_app/`.
- **Design System (`index.css`):** Engineered a simplified, responsive design system utilizing the exact palette from `App_icon/icon.png` (Midnight slate `#0c1322`, speedometer arc `#52c41a` & `#fa8c16`).
- **Brand Assets:** Linked official `icon.png` as web app logo and browser tab favicon.
- **Landing Page (`LandingPage.jsx`):** Refined to a clean, non-scrollable hero that fits strictly within the viewport window frame. The title `"The Ultimate Fuel Tracker"` is preserved on a single line.
- **Telemetry Hub (`Dashboard.jsx` / "Track"):** Greets the authenticated user with `"Hi, <google username>!"`, displaying formatted `DD/Apr/YYYY` dates across all cards and activity tables, with an inviting empty state if no vehicle profiles have been configured.
- **Fleet Garage (`Garage.jsx` & `VehicleModal.jsx`):** Multi-vehicle cards with categorization icons (🏍️, 🚗, 🛵, 🚙), active vehicle switcher, and cascading delete warnings.
- **Refill Management (`RefillManager.jsx` & `RefillModal.jsx`):** Full history log with fuel type filters, `DD/Apr/YYYY` dates, and live mathematical feedback preview.
- **Interactive Visual Analytics (`Analytics.jsx` & `Charts.jsx`):** High-contrast SVG charts with formatted date tooltips for Mileage Trajectory, Expenses, and Fuel Price evolution.
- **Google Auth & Cloud Firestore (`firebase.js` & `storage.js`):** Configured with project credentials for `ultimatefueltracker` supporting Google Sign-In and Firestore document collections.
- **JSON Portability & Android Interoperability (`Settings.jsx` & `storage.js`):**
  - **Android-Conforming Export:** Automatically maps vehicle and fuel type identifiers to clean numeric IDs and converts `refillDate` into millisecond numeric timestamps matching Android Room entity types and Gson deserialization expectations.
  - **Staged Import Workflow:** File selection initiates structural validation via `validateBackup`, displaying an inspectable summary (vehicle count and refill count). Data is strictly populated only when the user clicks the explicit **"Submit & Populate Data"** confirmation button, protecting against accidental overwrites.
  - Removed "About FuelTracker Web" and legacy "Load Sample Fleet Data" elements.
- **Universal Refill Editability:** All fuel refill records are editable across the system. Edit buttons are integrated directly into the "Most Recent Refill" snapshot card and "Recent Activity" table on the Track tab, in addition to the Refills manager tab.
- **GitHub Link Integration (`LandingPage.jsx`):** A sleek, nicely presented GitHub repository button (`https://github.com/K-692/FuelTracker`) with official vector mark is integrated into the Overview hero action group.
- **Zero-Demo Policy:** Removed all demo entries, sample vehicles, and mock data so new users encounter empty fields ready for their personal vehicle data.
- **Navbar & Routing Auth Gating:** Unauthenticated state reveals only the logo, theme switch, and sign-in button. Post-authentication state unlocks `Track`, `Garage`, `Refills`, `Analytics`, and `Settings`, hiding the Overview tab.

### Phase 5: CI/CD & Automated GitHub Deployment
- Created GitHub Actions workflow [deploy.yml](file:///Users/krish/Desktop/K-692/FuelTracker/.github/workflows/deploy.yml) configuring GitHub Pages deployment on push to `main`.
- Configured relative base paths in `vite.config.js` (`base: './'`).
- Documented live links and repository badges in [README.md](file:///Users/krish/Desktop/K-692/FuelTracker/README.md).

### Phase 6: Blank Screen Resolution, Temporal Dead Zone Fix & ErrorBoundary Hardening
- **Diagnostic Root Cause Analysis:** Headless browser CDP inspection of the deployed bundle on GitHub Pages (`https://k-692.github.io/FuelTracker/`) identified an uncaught `ReferenceError: Cannot access 'currentTab' before initialization` occurring during component setup. In [App.jsx](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/src/App.jsx), a `useEffect` hook referencing `currentTab` in its dependency array was invoked before `const currentTab` was declared, triggering a JavaScript Temporal Dead Zone (TDZ) crash that halted React mounting.
- **TDZ Rectification:** Reordered variable declaration in [App.jsx](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/src/App.jsx), placing `const currentTab` immediately following `user` and `activeTab` states, ensuring it is fully initialized prior to any hook or effect execution.
- **Fail-Safe UI Architecture:** Added [ErrorBoundary.jsx](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/src/components/ErrorBoundary.jsx) wrapping the root application in [main.jsx](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/src/main.jsx) to prevent white-screen crashes and provide structured recovery actions (Reload, Reset Cache) if any unexpected runtime exception occurs.
- **Production Bundle & Chrome Verification:** Rebuilt the production application bundle, validated with `oxlint` (0 errors), and confirmed complete DOM rendering and zero console exceptions via Chrome headless browser testing.

---

## 4. Current File Inventory

### Android Application (`app/`)
- **Domain Layer:** `com.fueltracker.domain.calculator.FuelCalculator`
- **Data Layer:** `data.entity.*`, `data.local.*`, `data.repository.*`
- **Dependency Injection:** `di.AppModule`
- **Navigation:** `navigation.AppNavigation`, `navigation.Screen`
- **UI Features:** `ui.home`, `ui.fuel`, `ui.history`, `ui.statistics`, `ui.settings`, `ui.vehicles`, `ui.theme`
- **Application Entry:** `MainActivity`, `FuelTrackerApp`

### Web Application (`web_app/`)
- **Domain Logic:** [FuelCalculator.js](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/src/domain/FuelCalculator.js)
- **Utilities:** [dateFormatter.js](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/src/utils/dateFormatter.js)
- **Services:** [firebase.js](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/src/services/firebase.js), [storage.js](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/src/services/storage.js), [defaultData.js](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/src/services/defaultData.js)
- **Components:**
  - [ErrorBoundary.jsx](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/src/components/ErrorBoundary.jsx): Top-level component error boundary with graceful crash protection.
  - [Navbar.jsx](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/src/components/Navbar.jsx): App icon branding, responsive navigation with strict auth-gated tabs (no Overview tab).
  - [LandingPage.jsx](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/src/components/LandingPage.jsx): Epic single-line title hero with GitHub repository link button and non-scrollable window container.
  - [Dashboard.jsx](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/src/components/Dashboard.jsx): Track telemetry view with `"Hi, <google username>!"` header, inline refill edit controls, and empty garage prompt.
  - [Garage.jsx](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/src/components/Garage.jsx): Fleet management and categorization.
  - [RefillManager.jsx](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/src/components/RefillManager.jsx): Refill logs with search, fuel type filters, date formatting, and edit/delete actions.
  - [RefillModal.jsx](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/src/components/RefillModal.jsx): Add/edit fuel entry with live mathematical calculations.
  - [VehicleModal.jsx](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/src/components/VehicleModal.jsx): Vehicle profile modal.
  - [Analytics.jsx](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/src/components/Analytics.jsx) & [Charts.jsx](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/src/components/Charts.jsx): SVG charts with theme palette colors.
  - [Settings.jsx](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/src/components/Settings.jsx): Preferences, Cloud sync, two-stage JSON backup/restore with explicit submit confirmation.
  - [FirebaseModal.jsx](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/src/components/FirebaseModal.jsx): Credentials management dialog.
  - [ConfirmModal.jsx](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/src/components/ConfirmModal.jsx): Deletion safety modal.
  - [Toast.jsx](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/src/components/Toast.jsx): Toast feedback notifications.
- **Design System:** [index.css](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/src/index.css)
- **Application Root:** [App.jsx](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/src/App.jsx), [main.jsx](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/src/main.jsx), [index.html](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/index.html)
- **Configuration & CI/CD:** [vite.config.js](file:///Users/krish/Desktop/K-692/FuelTracker/web_app/vite.config.js), [deploy.yml](file:///Users/krish/Desktop/K-692/FuelTracker/.github/workflows/deploy.yml)

