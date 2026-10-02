# <img src="App_icon/icon.png" width="48" height="48" align="center"> Fuel Tracker

A multi-platform vehicle fuel telemetry and efficiency tracking application with **Previous Fill-Up** physics, available as a **Universal Web Application** and a **Native Android Application**.

[![Live Web App](https://img.shields.io/badge/Live%20Web%20App-k--692.github.io%2FFuelTracker-52c41a?style=for-the-badge&logo=google-chrome&logoColor=white)](https://k-692.github.io/FuelTracker/)
[![Download APK](https://img.shields.io/badge/Download-Android%20APK-fa8c16?style=for-the-badge&logo=android&logoColor=white)](https://github.com/K-692/FuelTracker/raw/main/FuelTracker.apk)
[![GitHub Repository](https://img.shields.io/badge/GitHub-K--692%2FFuelTracker-1890ff?style=for-the-badge&logo=github&logoColor=white)](https://github.com/K-692/FuelTracker)

---

## 🌐 Launch Web Application

You can use the live web app directly in any desktop, tablet, or mobile browser without installation:

👉 **[https://k-692.github.io/FuelTracker/](https://k-692.github.io/FuelTracker/)**

- **Google Authenticated:** Sign in with Google for real-time cloud synchronization backed by Google Cloud Firestore.
- **Universal Browser Layout:** Responsive minimalist UI with Obsidian Dark and Crisp Slate Light theme modes.
- **Automated GitHub Deployment:** Continuously built and deployed via GitHub Actions ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)).

---

## 📱 Android Application

Download the standalone APK directly from this repository:

- **Direct Download:** [Download FuelTracker.apk](https://github.com/K-692/FuelTracker/raw/main/FuelTracker.apk) (or download local [FuelTracker.apk](FuelTracker.apk)).
- Built with **Kotlin**, **Jetpack Compose**, and **Material 3**.

---

## 🚀 Working Principles & Mathematical Engine

The Fuel Tracker ecosystem is designed around physical combustion reality and multi-vehicle management:

### 1. Accurate Previous Fill-Up Mileage Formulation
Unlike ordinary trackers that divide trip distance by fuel poured in the current fill, FuelTracker uses the **Previous Fill-Up** method:
- **Formula:** 
  $$\text{Mileage (km/L)} = \frac{\text{Current Odometer} - \text{Previous Odometer}}{\text{Previous Fuel Quantity}}$$
- **Physical Rationale:** Fuel pumped in the *current* refill powers your *future* travel. The distance covered between refills was combusted strictly from fuel loaded in the *previous* refill.
- **Initial Fill Baseline:** The first entry establishes the vehicle's baseline odometer and tank volume.

### 2. Multi-Vehicle Fleet Management
- **Garage Profiles:** Track motorcycles (🏍️), scooters (🛵), passenger cars (🚗), and commercial vehicles (🚙).
- **Contextual Isolation:** Each machine maintains an independent odometer timeline, refill history, and lifetime average mileage.
- **Destructive Action Guards:** Cascading deletion safeguards prevent orphaned records.

### 3. Telemetry & Visual Analytics
- **Live Track View:** Instant average mileage, odometer delta, total fuel spending, and operating cost per kilometer.
- **Interactive SVG Charts:** High-contrast trajectories for mileage efficiency curves, refill expenditure, and pump price evolution.
- **Universal JSON Portability:** Export and import `FuelTracker_AutoBackup.json` interchangeably between the Android app and the Web app.

---

## 💻 Web App Local Development

```bash
# Navigate to the web_app directory
cd web_app

# Install dependencies
npm install

# Run local development server
npm run dev
```

Visit `http://localhost:5173/` in your browser.

---

## 🛠️ Project Structure

```text
FuelTracker/
├── .github/workflows/
│   └── deploy.yml              # GitHub Actions Pages deployment
├── App_icon/
│   └── icon.png                # Official vector-derived brand icon
├── app/                        # Native Android Jetpack Compose source
├── web_app/                    # Universal React + Vite Web application
│   ├── public/
│   │   ├── icon.png            # App logo & favicon
│   │   └── favicon.png
│   ├── src/
│   │   ├── components/         # Navbar, LandingPage, Dashboard (Track), Garage, etc.
│   │   ├── domain/             # FuelCalculator mathematical engine
│   │   ├── services/           # Firebase Auth & Cloud Firestore layer
│   │   └── utils/              # DD/Apr/YYYY date formatter
│   ├── .env                    # Active Firebase configuration
│   └── vite.config.js          # Vite config with relative base paths
├── FuelTracker.apk             # Standalone Android package
├── flow.md                     # Architecture and implementation flow log
└── README.md                   # Project overview & documentation
```

---
*Built with ❤️ for Vehicle Owners & Enthusiasts.*
