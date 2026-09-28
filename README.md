# OptiRelief — AI-Driven Disaster Response Logistics Engine

OptiRelief is a multi-constraint resource allocation and 3D bin-packing optimization engine designed for disaster response logistics and relief operations. It runs completely in modern web browsers with full offline capability (PWA) and responsive design for every device.

---

## 🚀 Quick Start — Run on Every Device

### Option 1: Run Locally (Same Wi-Fi / Local Network)

1. Open PowerShell or Terminal in this folder:
   ```bash
   python -m http.server 8080 --bind 0.0.0.0
   ```
2. **On This Computer / Laptop:**
   Open browser at: `http://localhost:8080` or `http://127.0.0.1:8080`
3. **On Any Other Device (Mobile Phone, Tablet, iPad, Android, Mac, etc.):**
   - Connect the device to the **same Wi-Fi network**.
   - Find your computer's local IP address (e.g. `10.52.121.220`).
   - Open browser on your mobile/tablet and navigate to:
     ```
     http://YOUR_LOCAL_IP:8080
     (Example: http://10.52.121.220:8080)
     ```

---

### Option 2: Install as a Native App o n Mobile / Tablet (PWA)

OptiRelief is configured as a **Progressive Web App (PWA)** with a service worker and manifest:
- **On Android (Chrome / Brave / Edge):** Tap the `⋮` menu (top right) ➔ tap **"Install App"** or **"Add to Home screen"**.
- **On iOS / iPhone / iPad (Safari):** Tap the Share button (square with arrow) ➔ tap **"Add to Home Screen"**.
- **On Desktop (Chrome / Edge):** Click the install icon in the URL address bar ➔ **"Install OptiRelief"**.

Once installed, OptiRelief opens full-screen like a native app and works even when completely offline!

---

### Option 3: Deploy Free to the Web (Access from Anywhere in the World)

To access OptiRelief from any device anywhere without being on the same Wi-Fi:

#### Via GitHub Pages (100% Free):
1. Push this folder to a GitHub repository.
2. In GitHub, go to **Settings** ➔ **Pages**.
3. Under **Branch**, select `main` (or `master`) and `/root`, then click **Save**.
4. Your live link will be `https://<username>.github.io/<repo-name>/`.

#### Via Netlify / Vercel (Drag-and-Drop):
1. Go to [Netlify Drop](https://app.netlify.com/drop) or [Vercel](https://vercel.com).
2. Drag and drop this project folder or zip file.
3. You will immediately get a live `https://...` link working worldwide on all devices.

---

## 🛠 Features

- **Multi-Knapsack Resource Optimizer:** Greedy multi-constraint heuristic solver for vehicle weight, volume, priority tiers, and perishability.
- **3D Bin-Packing Visualizer:** Real-time Three.js 3D cargo load simulation with rotation, wireframes, and dimensional boundaries.
- **Interactive Disaster Zone Map:** Leaflet.js GIS map showing staging hubs, disaster sites, road statuses, and delivery routes.
- **Fleet & Inventory Management:** Track trucks, helicopters, 4x4s, drones, and relief supplies.
- **Offline Dispatch & Manifest Generator:** Generates field-printable cargo manifests and syncs via IndexedDB (Dexie.js) when reconnected.

---

## 📂 File Structure

```
├── index.html              # Main application entrypoint
├── manifest.webmanifest    # PWA configuration for mobile & desktop installation
├── sw.js                   # Service worker for offline caching & background sync
├── css/
│   └── style.css           # Custom styles, dark theme, responsive utilities
├── js/
│   ├── app.js              # Application router & bootstrap
│   ├── ui.js               # UI components, modals, toasts, navigation
│   ├── store.js            # Dexie.js IndexedDB local database & sync manager
│   ├── solver.js           # Multi-constraint allocation & bin-packing algorithm
│   ├── viz3d.js            # Three.js 3D container visualization engine
│   └── views/
│       ├── dashboard.js    # Real-time metrics and mission overview
│       ├── optimizer.js    # Allocation solver & 3D cargo packing view
│       ├── zonemap.js      # GIS interactive disaster zone mapping
│       ├── resources.js    # Fleet and inventory CRUD manager
│       ├── dispatch.js     # Dispatch log & printable cargo manifest
│       └── system.js       # Offline status, diagnostic logs, and storage
└── images/                 # App icons (192x192, 512x512)
```
