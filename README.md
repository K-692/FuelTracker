# <img src="App_icon/icon.png" width="48" height="48" align="center"> Fuel Tracker

A high-performance vehicle fuel telemetry, efficiency, and maintenance lifecycle web application engineered with authentic **Previous Fill-Up** combustion physics and an automotive **Dual-Threshold Engine Oil Telemetry Engine (Distance & Time Duration)**.

[![Live Web App](https://img.shields.io/badge/Live%20Web%20App-k--692.github.io%2FFuelTracker-52c41a?style=for-the-badge&logo=google-chrome&logoColor=white)](https://k-692.github.io/FuelTracker/)
[![GitHub Repository](https://img.shields.io/badge/GitHub-K--692%2FFuelTracker-1890ff?style=for-the-badge&logo=github&logoColor=white)](https://github.com/K-692/FuelTracker)
[![React 19](https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite 8](https://img.shields.io/badge/Vite-8-646cff?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg?style=for-the-badge)](LICENSE)

> [!NOTE]
> **Platform Support Notice:** Support for the legacy native Android and iOS mobile applications has concluded. FuelTracker is now exclusively maintained as a cloud-synchronized, responsive **Universal Web Application** accessible across all modern desktop, tablet, and mobile browsers.

---

## 🌐 Launch Web Application

You can use the live web app directly in any desktop, tablet, or mobile browser without installation:

👉 **[https://k-692.github.io/FuelTracker/](https://k-692.github.io/FuelTracker/)**

- **Google Authenticated:** Sign in with Google for real-time cloud synchronization backed by Google Cloud Firestore.
- **Mobile-First Responsive UI:** Designed for phones first, scaling up cleanly to tablets and desktops, with Obsidian Dark and Crisp Slate Light themes.
- **Installable:** Add it to your phone's home screen ("Add to Home Screen" / "Install app") for a full-screen, app-like experience.
- **Automated GitHub Deployment:** Continuously built and deployed via GitHub Actions ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)).

---

## 📱 Responsive, Cross-Browser UI

The interface is built mobile-first and tested from small 320 px phones up to wide desktop monitors.

| Screen | Navigation | Layout highlights |
| --- | --- | --- |
| **Phones** (≤ 768 px) | Fixed bottom tab bar with large touch targets | 2-column metric tiles, refill tables become stacked cards, forms open as swipe-style **bottom sheets**, full-width segmented controls |
| **Tablets** (769–900 px) | Bottom tab bar | Wider cards and multi-column grids |
| **Desktops** (≥ 901 px) | Top navigation tabs | Centered content, data tables, hover effects; compact header that never overlaps at any width |

**Mobile & browser robustness**
- Safe-area aware (iPhone notch / home indicator) using `viewport-fit=cover` and `env(safe-area-inset-*)`.
- 44 px touch targets on touch screens; hover effects only on devices that truly hover (no "sticky hover" on phones).
- Form fields use a 16 px font on touch devices so iOS Safari never auto-zooms when typing.
- Dynamic viewport units (`dvh`) with `vh` fallbacks, so mobile browser toolbars don't cut off content.
- Background scroll is locked while a dialog is open; `Esc` closes dialogs on desktop.
- Charts measure their container and redraw at the real pixel width, keeping labels readable on phones; tap a point/bar to see its value.
- Graceful fallbacks for older engines (`backdrop-filter`, `:has()`, `overflow: clip`), plus `prefers-reduced-motion`, visible keyboard focus rings, and ARIA roles on navigation, dialogs and notifications.
- Production build targets Chrome/Edge 87+, Safari 14+ (iOS & macOS) and Firefox 78+, with Firebase, React and icons split into separately cached chunks.

---

## 🚀 Key Modules & Capabilities

### 1. Dual-Threshold Engine Oil Telemetry (Distance & Time Duration)
Engine oil degrades through two independent physical vectors: mechanical shear/particulate contamination proportional to distance driven, and chemical oxidation/acidification/condensation over calendar time. Following automotive best practices, FuelTracker monitors both simultaneously:
- **Dual Configurable Thresholds:** 
  - **Distance Interval:** Default `5,000 km` (user-configurable in Settings).
  - **Time Duration Interval:** Default `6 Months` (user-configurable in Settings).
- **"Whichever Comes First" Automotive Rule:** Telemetry evaluates distance driven and elapsed time from your most recent recorded engine oil change. Service alert triggers when *either* limit is reached.
- **Top Navigation Bar Status Chip:** Real-time alert chip in the header displaying both remaining distance and time countdown:
  - 🛢️ **Good:** Green chip with remaining kilometers and months/days countdown.
  - ⚠️ **Warning:** Yellow badge when within 500 km or 30 days of service due.
  - 🚨 **Overdue:** Pulsing danger red alert indicating whether distance, time duration, or both have been exceeded.
- **Maintenance Hub Dual Progress Gauges:** In the **Services** hub, inspect two dedicated progress bars:
  1. *Distance Progress Track:* Shows kilometers driven since last change, remaining distance, and percentage completion against the target odometer.
  2. *Duration Progress Track:* Shows elapsed days and months, days remaining, and target due date (`DD/Apr/YYYY`).
- **Account Safety & Zero-Mutation Guard:** Adding or updating interval thresholds strictly preserves all existing user records, fuel refill entries, vehicle profiles, and service history without overwriting user account data.

### 2. 60-Component Vehicle Servicing & Maintenance Engine
A granular vehicle-specific maintenance ledger:
- **60 Vehicle Components:** Classified across Engine & Lubrication, Cooling, Ignition & Fuel, Transmission & Drivetrain, Brakes & Wheels, Suspension & Steering, Electrical & ECU, Body & Cabin, and Exhaust & Emissions.
- **Intelligent Vehicle Type Filtering:** Automatically filters components based on vehicle category (Cars vs Two-Wheelers / Motorcycles / Scooters) while retaining full manual toggle override.
- **Granular Checklist & Component Charges:** Defaults to `No`; toggle `Yes` for components serviced and input individual component charges.
- **Custom Final Invoice Total:** User directly enters the final overall bill amount with optional auto-sum assistance.
- **Universal Editability:** All past service records can be inspected, updated, or deleted with real-time recalculation.

### 3. Visual Analytics & Component Trends
- **Component Servicing Frequency & Count Plot:** High-contrast horizontal bar chart ranking parts and systems by how often they have been serviced.
- **Component Price Analysis Over Time:** Interactive SVG time-series chart tracking price evolution, inflation, minimum, maximum, and average charges for any selected component.
- **Fuel Mileage Trajectory:** Precision efficiency curves based on physical previous fill-up consumption.
- **Expenditure Trends:** Refill expenses and pump price trajectory charts.

### 4. Accurate Previous Fill-Up Mileage Formulation
Unlike ordinary trackers that divide trip distance by fuel poured in the current fill, FuelTracker uses the **Previous Fill-Up** method:
- **Formula:** 
  $$\text{Mileage (km/L)} = \frac{\text{Current Odometer} - \text{Previous Odometer}}{\text{Previous Fuel Quantity}}$$
- **Physical Rationale:** Fuel pumped in the *current* refill powers your *future* travel. The distance covered between refills was combusted strictly from fuel loaded in the *previous* refill.
- **Initial Fill Baseline:** The first entry establishes the vehicle's baseline odometer and tank volume.

### 5. Multi-Vehicle Fleet Garage
- Track motorcycles (🏍️), scooters (🛵), passenger cars (🚗), and commercial vehicles (🚙).
- Independent odometer timelines, fuel logs, service history, and lifetime statistics.

### 6. Universal JSON Portability
- Export and import complete fleet profiles, fuel refill logs, maintenance records, and customized dual oil intervals via `FuelTracker_AutoBackup.json`.
- Two-stage staged import workflow with validation preview before database population.

---

## 🏛️ System Architecture & Workflow

```text
       ┌────────────────────────────────────────────────────────┐
       │                   Universal Web App                    │
       │                 (React 19 + Vite 8)                    │
       └──────────────────────────┬─────────────────────────────┘
                                  │
       ┌──────────────────────────┴─────────────────────────────┐
       │               Domain Mathematical Engines               │
       ├─────────────────────────┬──────────────────────────────┤
       │   FuelCalculator.js     │     serviceCalculator.js     │
       │   - Prev Fill-Up Physics│     - Dual-Threshold Engine  │
       │   - Distance Deltas     │       (5000 km / 6 Months)   │
       │   - Operational Costs   │     - Whichever First Rule   │
       │                         │     - Price Trajectories     │
       └─────────────────────────┬──────────────────────────────┘
                                  │
       ┌──────────────────────────┴─────────────────────────────┐
       │             Unified Data Repository (storage.js)       │
       ├──────────────────────────┬─────────────────────────────┤
       │   Cloud Firestore Sync   │    IndexedDB / Local Cache  │
       │   users/{uid}/vehicles   │    Backup Export & Import   │
       │   users/{uid}/services   │    Zero Mutation Safety     │
       │   users/{uid}/entries    │                             │
       └────────────────────────────────────────────────────────┘
```

---

## 💻 Web App Local Development

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- `npm` (included with Node.js)

### Installation & Setup

```bash
# Clone the repository
git clone https://github.com/K-692/FuelTracker.git
cd FuelTracker/web_app

# Install dependencies
npm install

# Run local development server
npm run dev

# Run code linter
npm run lint

# Build production bundle
npm run build
```

Visit `http://localhost:5173/` in your browser.

---

## 🛠️ Project Structure

```text
FuelTracker/
├── .github/workflows/
│   └── deploy.yml              # GitHub Actions Pages deployment
├── App_icon/
│   └── icon.png                # Brand icon
├── web_app/                    # Universal React + Vite Web application
│   ├── public/
│   │   ├── icon.png            # App logo & favicon
│   │   ├── favicon.png
│   │   └── manifest.webmanifest # Home-screen install metadata
│   ├── src/
│   │   ├── components/         # Navbar, Services, ServiceModal, Dashboard, Analytics, Settings, etc.
│   │   ├── index.css           # Mobile-first design system (themes, breakpoints, responsive tables & sheets)
│   │   ├── domain/             # FuelCalculator, serviceComponents (60 items), serviceCalculator
│   │   ├── services/           # Firebase Auth, Cloud Firestore & unified storage repository
│   │   └── utils/              # DD/Apr/YYYY date formatter
│   └── vite.config.js          # Vite configuration
├── flow.md                     # Complete architecture and implementation flow log
└── README.md                   # Project overview & documentation
```

---

## 🤝 Contributing to FuelTracker

Contributions, issues, and feature requests are welcome!

1. **Fork the Repository** on GitHub.
2. **Create a Feature Branch** (`git checkout -b feature/AmazingFeature`).
3. **Commit your Changes** (`git commit -m 'Add AmazingFeature'`).
4. **Push to the Branch** (`git push origin feature/AmazingFeature`).
5. **Open a Pull Request**.

Please ensure that `npm run lint` and `npm run build` succeed without errors before submitting pull requests. For UI changes, check the layout at a phone width (e.g. 375 px) as well as on desktop.

---

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

*Built with ❤️ for Vehicle Owners & Enthusiasts.*
