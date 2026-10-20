# ⚡ FuelTracker Web Application ("The Ultimate Fuel Tracker")

A high-performance, precision vehicle fuel telemetry and maintenance tracking web application engineered with the **Previous Fill-Up Method**. Built to run seamlessly on the modern web and automated through GitHub Actions for live public access via GitHub Pages.

---

## 🚀 Key Modules & Features

1. **True Mileage Formulation (Previous Fill-Up Physics):**
   $$\text{Mileage (km/L)} = \frac{\text{Current Odometer} - \text{Previous Odometer}}{\text{Previous Fuel Quantity}}$$
   Unlike conventional trackers that divide distance by fuel added today, FuelTracker models real combustion: distance traveled is fueled by the fuel poured in the *preceding* refill.

2. **Services & Maintenance Tracking (New):**
   - 60 comprehensive components across Engine, Fluids, Cooling, Transmission, Brakes, Suspension, Electrical, Body, and Exhaust.
   - Dynamic vehicle label filtering (Cars vs Two-Wheelers/Bikes/Scooters).
   - Component-level checklist (Default `No`, toggle `Yes`) with individual component replacement pricing.
   - User-inserted final invoice total with optional auto-sum assistance.
   - 100% editable historical service entries.

3. **Engine Oil Telemetry & Navigation Bar Alert:**
   - User-configurable engine oil change interval in Settings (default: 5,000 km).
   - Dynamic, high-visibility status chip in the top navigation bar alerting how many kilometers remain before the next oil change.
   - Real-time warning badge (< 500 km) and pulsing red alert when overdue.

4. **Interactive Visual Analytics:**
   - **Fuel & Efficiency:** True Mileage Trajectory line chart, refill expenditure bar chart, and pump price evolution.
   - **Servicing & Maintenance:** Component-level servicing frequency & count plot (horizontal ranking chart) and component price analysis over time (interactive line chart with min/max/avg/trend statistics).

5. **Multi-Vehicle Garage:**
   - Independent timelines and telemetry for Motorcycles (🏍️), Cars (🚗), Scooters (🛵), and Other/Commercial vehicles (🚙).
   - Instant active vehicle switching with persistent memory.

6. **Cloud Firestore & Google Authentication:**
   - Sign in with Google to sync fleet telemetry across all your devices in real-time.
   - Dual-engine architecture: Runs 100% offline in Local Mode if Firebase credentials are not yet configured, and seamlessly syncs to Cloud Firestore when signed in.

7. **Dual-Theme Design System:**
   - Obsidian Dark Mode and Crisp Slate Light Mode with smooth icon transitions.
   - Glassmorphism, micro-animations, and fluid typography with Google Fonts (`Outfit` and `Plus Jakarta Sans`).

8. **Universal JSON Data Backup & Restore:**
   - Export and import `FuelTracker_AutoBackup.json` with relational re-mapping, capturing vehicle garage profiles, fuel refill logs, and maintenance service records.

---

## 🛠️ Technology Stack

- **Framework:** React 19 + Vite 8
- **Styling:** Modern Vanilla CSS Design System with CSS Tokens, Glassmorphism, and responsive viewports
- **Icons:** Lucide React
- **Data Visualization:** Custom SVG Telemetry Engine (zero bundle bloat)
- **Backend & Auth:** Firebase v10/v11 SDK (Google Auth + Cloud Firestore)
- **CI/CD:** GitHub Actions (`.github/workflows/deploy.yml`) deploying directly to GitHub Pages

---

## 💻 Local Development

```bash
# 1. Enter web_app directory
cd web_app

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev

# 4. Production build
npm run build
```

Visit `http://localhost:5173/` in your browser.
