# 🚑 OptiRelief — AI-Driven Disaster Response Logistics Engine



## ❓ The Problem & Our Solution

| ⚠️ The Challenge in Disasters | 💡 How OptiRelief Solves It |
| :--- | :--- |
| **No Internet in Crisis Zones:** Cell towers fail during floods/earthquakes. | **100% Offline Ready (PWA):** Works completely without internet; saves data locally in your browser. |
| **Wasted Cargo Space:** Rescue trucks & helicopters get overloaded or pack inefficiently. | **3D Smart Packing Solver:** Calculates optimal 3D bin-packing to fit maximum aid without exceeding weight or volume limits. |
| **Supply Routing Delays:** Blocked roads delay life-saving medical supplies. | **Live Disaster Zone Map:** Interactive map showing danger zones, relief hubs, and accessible transport routes. |
| **Perishable Goods Spoiling:** Medicines and food go to waste if not prioritized. | **Priority & Expiry Sorting:** Automatically prioritizes critical and perishable supplies first. |

---

## ✨ Key Features

- 📦 **3D Cargo Packing Visualizer:** See inside the truck or helicopter in interactive 3D to see exactly where each box should be placed.
- 🗺️ **Interactive Disaster Map:** Live map powered by Leaflet.js showing active staging hubs, affected districts, and rescue routes.
- 🚚 **Fleet & Supply Management:** Manage trucks, boats, helicopters, drones, food rations, drinking water, and trauma kits.
- 📱 **Installable App (PWA):** Install onto your phone or laptop with one click — launch it like a native mobile app anytime.
- 📋 **Printable Cargo Manifests:** Generate and print official handover forms for field dispatch drivers.
- 🌐 **Multi-Language Support:** Easily switch languages for local responders in diverse regions.

---

## 🚀 How to Run Locally

You don't need any complex setup or node modules. Everything runs in the browser:

1. **Clone or Download this repository:**
   ```bash
   git clone https://github.com/shubhs77712/OPTI-RELIEF-AI-DRIVEN-SOLUTION.git
   ```
2. **Open with any local server:**
   - Using Python:
     ```bash
     python -m http.server 8080
     ```
   - Or simply open `index.html` in Chrome, Edge, Safari, or Firefox.
3. Open `http://localhost:8080` in your web browser.

---

## 🛠️ Built With

* **HTML5 & Vanilla CSS3** — Clean modern interface with dark mode and glassmorphism.
* **JavaScript (ES6+)** — Fast, lightweight, zero bulky framework overhead.
* **Three.js** — Interactive 3D container rendering and cargo packing simulation.
* **Leaflet.js** — Lightweight GIS mapping and disaster route visualization.
* **Dexie.js (IndexedDB)** — Fast, reliable on-device offline database storage.
* **Service Workers & Web App Manifest** — Instant offline loading and PWA support.

---

## 📱 How to Install on Mobile

1. Open the **[Live Demo](https://shubhs77712.github.io/OPTI-RELIEF-AI-DRIVEN-SOLUTION/)** on your phone's browser (Chrome or Safari).
2. **On Android (Chrome):** Tap the `⋮` menu (top-right) ➔ Tap **"Install App"** or **"Add to Home screen"**.
3. **On iPhone (Safari):** Tap the **Share** icon (square with arrow up) ➔ Tap **"Add to Home Screen"**.
4. OptiRelief will appear as an app icon on your home screen and work offline anytime!

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
