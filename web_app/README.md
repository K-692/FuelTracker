# ⚡ FuelTracker Web Application ("The Ultimate Fuel Tracker")

A high-performance, precision vehicle fuel telemetry web application engineered with the **Previous Fill-Up Method**. Built to run seamlessly on the web and automated through GitHub Actions for live public access via GitHub Pages.

---

## 🚀 Key Features

1. **True Mileage Formulation (Previous Fill-Up Physics):**
   $$\text{Mileage (km/L)} = \frac{\text{Current Odometer} - \text{Previous Odometer}}{\text{Previous Fuel Quantity}}$$
   Unlike conventional trackers that divide distance by fuel added today, FuelTracker models real combustion: distance traveled is fueled by the fuel poured in the *preceding* refill.

2. **Epic Landing Page & Interactive Physics Sandbox:**
   - Visual comparison explaining why ordinary apps display flawed mileage.
   - Interactive slider simulation for instant understanding.

3. **Multi-Vehicle Garage:**
   - Independent timelines and telemetry for Motorcycles (🏍️), Cars (🚗), Scooters (🛵), and Other/Commercial vehicles (🚙).
   - Instant active vehicle switching with persistent memory.

4. **Telemetry Dashboard & Visual Analytics:**
   - Lifetime Average Mileage, Total Distance, Total Fuel Cost, Operating Cost per kilometer.
   - Interactive SVG trend lines for Mileage Trajectory, Refill Expenses, and Fuel Price changes over time.

5. **Cloud Firestore & Google Authentication:**
   - Sign in with Google to sync fleet telemetry across all your devices in real-time.
   - Dual-engine architecture: Runs 100% offline in Local Mode if Firebase credentials are not yet configured, and seamlessly syncs to Cloud Firestore when signed in.

6. **Dual-Theme Design System:**
   - Obsidian Dark Mode and Crisp Slate Light Mode with smooth icon transitions.
   - Glassmorphism, micro-animations, and fluid typography with Google Fonts (`Outfit` and `Plus Jakarta Sans`).

7. **Universal Android App Interoperability:**
   - Export and import `FuelTracker_AutoBackup.json` with relational re-mapping, 100% compatible with the native Android FuelTracker application.

---

## 🛠️ Technology Stack

- **Framework:** React 19 + Vite 8
- **Styling:** Modern Vanilla CSS Design System with CSS Tokens, Glassmorphism, and responsive viewports
- **Icons:** Lucide React
- **Data Visualization:** Custom SVG/Canvas Telemetry Engine (zero bundle bloat)
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
```

Visit `http://localhost:5173/` in your browser.

---

## 🌐 Deploying to GitHub Pages

1. Push your repository to GitHub (`main` branch).
2. On GitHub, navigate to **Settings &rarr; Pages**.
3. Under **Build and deployment &rarr; Source**, select **GitHub Actions**.
4. The workflow in `.github/workflows/deploy.yml` will automatically build and publish the site to:
   `https://<your-username>.github.io/FuelTracker/`

---

## 🔑 Firebase Credentials Setup

To connect your Google Authentication and Cloud Firestore:

### Option A: In-App UI (Zero Build Required)
1. Open the web app in your browser.
2. Navigate to **Settings &rarr; Configure Firebase Keys**.
3. Paste your Firebase web app config JSON or fill in the form fields.
4. Click **Save Credentials**. It will be saved securely in your browser's storage and immediately connect.

### Option B: Build-time / GitHub Secrets
Add the following secrets in GitHub Repository **Settings &rarr; Secrets and variables &rarr; Actions**:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
