# FuelTracker - Project Implementation Flow & Current State

## 1. Project Overview
**FuelTracker** is a modern, native Android application engineered using Jetpack Compose, Material 3, and Clean Architecture principles. It enables multi-vehicle fuel tracking, expense monitoring, and statistical visualization, specifically built with accurate previous-fill mileage computation.

---

## 2. Current State of the Project

### 2.1 Technology Stack & System Architecture
- **Language & Runtime:** Kotlin (Target JVM 11), Android SDK (compileSdk 34, minSdk 27)
- **UI Toolkit:** Jetpack Compose with Material 3 design system, Material Icons Extended
- **Architecture Pattern:** MVVM (Model-View-ViewModel) with unidirectional data flow (UDF) via Kotlin Coroutines & `StateFlow`
- **Dependency Injection:** Dagger Hilt (`@HiltAndroidApp`, `@HiltViewModel`, `@Singleton`)
- **Persistence / Database:** Room ORM with SQLite, Foreign Key Cascades & Indices
- **User Preferences:** Jetpack DataStore (Preferences DataStore)
- **Data Serialization & Backup:** Google Gson for JSON data export/import and automated recovery
- **Data Visualization:** Vico Charting library for Compose (`com.patrykandpatrick.vico:compose-m3`)
- **Build System:** Gradle Kotlin DSL with version catalogs (`libs.versions.toml`)

### 2.2 Core Working Principles & Algorithms
1. **Previous Fill-Up Mileage Formulation:**
   $$\text{Mileage (km/L)} = \frac{\text{Current Odometer} - \text{Previous Odometer}}{\text{Previous Fuel Quantity}}$$
   *Rationale:* Fuel added in the current refill powers future travel. Distance covered between fill-ups was consumed from fuel loaded in the prior refill.
2. **Multi-Vehicle Contextual Isolation:**
   - Independent odometer timelines and fuel logs per vehicle (`vehicleId` foreign key).
   - Instant active vehicle switching via DataStore preference.

---

## 3. Implementation Journey

### Phase 1: Domain Logic & Mathematics
- Designed and verified [FuelCalculator](file:///Users/krish/Desktop/K-692/FuelTracker/app/src/main/java/com/fueltracker/domain/calculator/FuelCalculator.kt) singleton for edge-case resilient math:
  - Mileage calculation with division-by-zero checks.
  - Price per liter calculation (`cost / quantity`).
  - Net trip distance calculation (`current - previous`).
  - Cost per kilometer metric (`totalCost / distance`).

### Phase 2: Relational Data Layer & Entities
- Implemented Room Entities:
  - [Vehicle](file:///Users/krish/Desktop/K-692/FuelTracker/app/src/main/java/com/fueltracker/data/entity/Vehicle.kt): Supports `VehicleType` (BIKE, CAR, SCOOTER, OTHER), registration, make/model/year.
  - [FuelType](file:///Users/krish/Desktop/K-692/FuelTracker/app/src/main/java/com/fueltracker/data/entity/FuelType.kt): Seeded with Indian fuel standard categories (Normal Petrol, E20, XP95, XP100, Power95, Power100, Speed, Speed 97, Diesel, XtraGreen, CNG, Auto LPG).
  - [FuelEntry](file:///Users/krish/Desktop/K-692/FuelTracker/app/src/main/java/com/fueltracker/data/entity/FuelEntry.kt): Records timestamp, odometer, volume, total cost, price/L, notes with cascade deletion linked to vehicle.
- Built DAOs with reactive Kotlin Coroutines `Flow` queries and indexed queries.
- Built [FuelRepository](file:///Users/krish/Desktop/K-692/FuelTracker/app/src/main/java/com/fueltracker/data/repository/FuelRepository.kt) as the single source of truth.

### Phase 3: State Management & Persistence
- Integrated [PreferenceManager](file:///Users/krish/Desktop/K-692/FuelTracker/app/src/main/java/com/fueltracker/data/local/PreferenceManager.kt) utilizing AndroidX DataStore for persistent selection of active vehicle.
- Implemented [BackupRepository](file:///Users/krish/Desktop/K-692/FuelTracker/app/src/main/java/com/fueltracker/data/repository/BackupRepository.kt) offering full JSON schema export/import with relational foreign-key remapping and auto-recovery fallback.

### Phase 4: Jetpack Compose Presentation Layer
- Standardized Material 3 theme palette, typography, and card/surface shapes.
- Created multi-screen declarative navigation graph via [AppNavigation](file:///Users/krish/Desktop/K-692/FuelTracker/app/src/main/java/com/fueltracker/navigation/AppNavigation.kt):
  - **VehicleSelectionScreen:** Grid-based landing interface to pick or switch vehicle profiles.
  - **HomeScreen:** Dashboard displaying current vehicle stats, quick summary, latest refill card, and instant action FAB.
  - **AddFuelScreen:** Real-time calculated mileage, distance, and unit price as user inputs odometer and fuel metrics.
  - **FuelHistoryScreen & FuelDetailsScreen:** Chronological inspection, detailed log breakdowns, update, and deletion workflows with confirmation guards.
  - **StatisticsScreen:** Cumulative metrics (total distance, expenditure, overall average mileage) and interactive trend charts.
  - **SettingsScreen & VehiclesScreen:** Vehicle fleet management and JSON backup export/restore controls.

---

## 4. Current File Inventory
- **Domain Layer:** `com.fueltracker.domain.calculator.FuelCalculator`
- **Data Layer:** `data.entity.*`, `data.local.*`, `data.repository.*`
- **Dependency Injection:** `di.AppModule`
- **Navigation:** `navigation.AppNavigation`, `navigation.Screen`
- **UI Features:** `ui.home`, `ui.fuel`, `ui.history`, `ui.statistics`, `ui.settings`, `ui.vehicles`, `ui.theme`
- **Application Entry:** `MainActivity`, `FuelTrackerApp`

---

## 5. Project Specifications & Golden Output Rationale

### 5.1 Project Charter & Problem Statement (Self-Directed Personal Project)
- **Origin:** Self-directed engineering initiative to build a private, offline-first Android fuel tracker tailored for Indian motorists.
- **Problem Statement:** Mainstream fuel apps compute fuel efficiency erroneously by associating trip distance with current refill volume. This project mandates the **Previous Fill-Up Calculation Method**, computing mileage based on the fuel pumped in the immediate prior refill.
- **Privacy First:** 100% offline architecture with no user authentication, cloud sync, telemetry, or advertisements.


### 5.2 Location & Geographical Customizations (India)
- **Market Fuel Catalog:** Direct support for Indian oil marketing companies (IndianOil XP95/XP100/XtraGreen, HPCL Power95/100, BPCL Speed/Speed97, and regulatory E20 petrol).
- **Vehicle Typology:** Dedicated two-wheeler classification (`BIKE`, `SCOOTER`) reflecting Indian vehicle demographics.
- **Metric Standards:** Metric measurement base (kilometers and liters) and INR (₹) currency modeling.

### 5.3 Acceptance Criteria & Quality Gates
- Odometer entries must compute delta distance against chronological predecessor.
- Mileage evaluates strictly against previous fuel volume with zero-division guards.
- Deletion of parent vehicle cascades cleanly to dependent records without leaving orphaned entries.
- JSON backup export/import operates deterministically across app reinstalls.

### 5.4 Deliverable Excellence & Value Propositions
1. **Mathematical Accuracy:** Authentic Previous Fill-Up method solves physical reality of fuel combustion versus odometer recording.
2. **Modern Engineering Stack:** Pure Kotlin, Jetpack Compose, Material 3, Clean Architecture, Hilt DI, Coroutines/StateFlow.
3. **Domain Localization:** Full pre-seeded support for Indian fuels (XP95, E20, Speed, Power95, CNG) and high-density two-wheeler ownership (`BIKE`, `SCOOTER`).
4. **Privacy & Offline Integrity:** 100% offline local Room SQLite persistence, zero cloud dependencies, zero telemetry, zero ads.
5. **Relational Resilience:** JSON backup/restore with dynamic primary/foreign key remapping prevents data corruption across devices.
### 5.5 Distribution & Repository Release
- Packaged standalone APK ([FuelTracker.apk](file:///Users/krish/Desktop/K-692/FuelTracker/FuelTracker.apk)) tracked in the root repository.
- Configured direct raw asset download badges in [README.md](file:///Users/krish/Desktop/K-692/FuelTracker/README.md) enabling instant mobile installation directly from GitHub.



