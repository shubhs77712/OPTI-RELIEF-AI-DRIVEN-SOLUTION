/* ==========================================================================
   OptiRelief — Live Vehicle Tracking & Real-Time Telemetry Engine
   SIH 26002 Compliance: Continuous GPS, Breadcrumb Trail, Speed/Alt Telemetry
   ========================================================================== */

const TRACKED_ROUTES = {
  'v-chopper-01': [
    { lat: 28.1580, lng: 85.3330, alt: 1460, name: 'Syabrubesi Helipad' },
    { lat: 28.1760, lng: 85.4240, alt: 2470, name: 'Lama Hotel Station' },
    { lat: 28.2040, lng: 85.4850, alt: 3030, name: 'Ghodatabela Base' },
    { lat: 28.2140, lng: 85.5390, alt: 3430, name: 'Langtang Ground Zero' },
    { lat: 28.2125, lng: 85.5680, alt: 3870, name: 'Kyanjin Gompa Base' }
  ],
  'v-chopper-02': [
    { lat: 26.1445, lng: 91.7362, alt: 120, name: 'Guwahati Air Hub' },
    { lat: 25.5788, lng: 91.8933, alt: 1520, name: 'Shillong Heli-Staging' },
    { lat: 25.1837, lng: 93.0232, alt: 680, name: 'Haflong Relief Drop' }
  ],
  'v-truck-01': [
    { lat: 28.1130, lng: 85.3020, alt: 1960, name: 'Dhunche HQ' },
    { lat: 28.1390, lng: 85.3190, alt: 1720, name: 'Brabal Switchbacks' },
    { lat: 28.1580, lng: 85.3330, alt: 1460, name: 'Syabrubesi Roadhead' }
  ],
  'v-truck-02': [
    { lat: 25.1837, lng: 93.0232, alt: 680, name: 'Haflong Sub-Depot' },
    { lat: 25.1520, lng: 93.0310, alt: 720, name: 'NH-27 Km 38 Bypass' },
    { lat: 25.1320, lng: 93.0450, alt: 540, name: 'Jatinga Valley Shelter' }
  ],
  'v-mule-01': [
    { lat: 28.1580, lng: 85.3330, alt: 1460, name: 'Syabrubesi Trailhead' },
    { lat: 28.1635, lng: 85.3780, alt: 1970, name: 'Bamboo Outpost' },
    { lat: 28.1720, lng: 85.4080, alt: 2400, name: 'Rimche High Pass' },
    { lat: 28.1760, lng: 85.4240, alt: 2470, name: 'Lama Hotel Relief' }
  ]
};

class LiveVehicleTracker {
  constructor() {
    this.vehicles = {};
    this.listeners = new Set();
    this.intervalId = null;
    this.initFleet();
    this.startTrackingLoop();
  }

  initFleet() {
    const defaultFleet = [
      {
        id: 'v-chopper-01',
        code: 'HELO-B3-01',
        type: 'Helicopter',
        pilot: 'Capt. Aryan Thapa',
        status: 'In Transit',
        payload: '1,280 kg (Trauma Kits & Concentrators)',
        destination: 'Langtang Village Ground Zero',
        speedKmh: 215,
        batteryFuelPct: 82,
        progress: 0.42,
        heading: 68,
        routeKey: 'v-chopper-01'
      },
      {
        id: 'v-chopper-02',
        code: 'HELO-MI17-02',
        type: 'Helicopter',
        pilot: 'Wg. Cdr. R. Sharma',
        status: 'In Transit',
        payload: '3,800 kg (Sub-Zero Relief Tents)',
        destination: 'Haflong Relief Drop (Dima Hasao)',
        speedKmh: 228,
        batteryFuelPct: 74,
        progress: 0.65,
        heading: 112,
        routeKey: 'v-chopper-02'
      },
      {
        id: 'v-truck-01',
        code: 'TRK-UNIMOG-01',
        type: 'Truck',
        pilot: 'Driver D. Sangma',
        status: 'In Transit',
        payload: '5,400 kg (Survival Rations & Grain)',
        destination: 'Syabrubesi Roadhead Depot',
        speedKmh: 42,
        batteryFuelPct: 89,
        progress: 0.78,
        heading: 45,
        routeKey: 'v-truck-01'
      },
      {
        id: 'v-truck-02',
        code: 'TRK-TATA4X4-02',
        type: 'Truck',
        pilot: 'Driver L. Hmar',
        status: 'In Transit',
        payload: '3,850 kg (Water Jerrycans & Purifiers)',
        destination: 'Jatinga Valley Shelter (NH-27)',
        speedKmh: 36,
        batteryFuelPct: 68,
        progress: 0.35,
        heading: 154,
        routeKey: 'v-truck-02'
      },
      {
        id: 'v-mule-01',
        code: 'PACK-MULE-ALP1',
        type: 'Mule Pack',
        pilot: 'Mule Lead Pasang Sherpa',
        status: 'In Transit',
        payload: '950 kg (Emergency Medical Kits)',
        destination: 'Lama Hotel High Station',
        speedKmh: 7.5,
        batteryFuelPct: 95,
        progress: 0.52,
        heading: 75,
        routeKey: 'v-mule-01'
      }
    ];

    defaultFleet.forEach((v) => {
      this.vehicles[v.id] = v;
      this.computePosition(v);
    });
  }

  computePosition(v) {
    const route = TRACKED_ROUTES[v.routeKey] || TRACKED_ROUTES['v-chopper-01'];
    const n = route.length - 1;
    const scaledProg = v.progress * n;
    const idx = Math.min(Math.floor(scaledProg), n - 1);
    const segProg = scaledProg - idx;

    const p0 = route[idx];
    const p1 = route[idx + 1];

    v.lat = p0.lat + (p1.lat - p0.lat) * segProg;
    v.lng = p0.lng + (p1.lng - p0.lng) * segProg;
    v.alt = Math.round(p0.alt + (p1.alt - p0.alt) * segProg + (v.type === 'Helicopter' ? 650 : 0));
    
    // Bearing calculation
    const dLng = (p1.lng - p0.lng) * Math.PI / 180;
    const lat1 = p0.lat * Math.PI / 180;
    const lat2 = p1.lat * Math.PI / 180;
    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    v.heading = Math.round((Math.atan2(y, x) * 180 / Math.PI + 360) % 360);

    // Trail history
    if (!v.trail) v.trail = [];
    v.trail.push([v.lat, v.lng]);
    if (v.trail.length > 25) v.trail.shift();
  }

  startTrackingLoop() {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = setInterval(() => {
      Object.values(this.vehicles).forEach((v) => {
        if (v.status === 'In Transit') {
          // Advance progress slightly
          const delta = (v.speedKmh / 3600) * 0.05;
          v.progress += delta;
          if (v.progress >= 1.0) {
            v.progress = 0.0;
            v.trail = [];
          }
          // Slight realistic telemetry jitter
          v.speedKmh = Math.max(5, Math.round(v.speedKmh + (Math.random() * 4 - 2)));
          this.computePosition(v);
        }
      });
      this.notify();
    }, 1500);
  }

  getFleet() {
    return Object.values(this.vehicles);
  }

  getVehicle(id) {
    return this.vehicles[id];
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  notify() {
    const fleet = this.getFleet();
    this.listeners.forEach((fn) => {
      try { fn(fleet); } catch (e) { console.warn(e); }
    });
  }

  /**
   * Open full-screen Cockpit Telemetry HUD for a vehicle
   */
  openCockpitHUD(vehicleId) {
    const v = this.getVehicle(vehicleId);
    if (!v) return;

    const isHelo = v.type === 'Helicopter';
    const isMule = v.type.includes('Mule');
    const icon = isHelo ? 'fa-helicopter' : (isMule ? 'fa-horse' : 'fa-truck-fast');

    const html = `
      <div class="space-y-4 font-sans text-[#1d1d1f]">
        <!-- HUD Status Banner -->
        <div class="p-4 rounded-2xl border hairline bg-[#f5f5f7] flex flex-wrap items-center justify-between gap-3 shadow-sm">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl bg-white border hairline grid place-items-center text-[#0066cc] text-xl shadow-sm">
              <i class="fa-solid ${icon}"></i>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-base font-extrabold text-[#1d1d1f] tracking-wide font-mono-num">${UI.esc(v.code)}</h3>
                <span class="badge badge-stable text-[0.65rem] animate-pulse">LIVE SATELLITE LINK</span>
              </div>
              <p class="text-xs text-[#7a7a7a] mt-0.5">Pilot/Crew: <span class="text-[#1d1d1f] font-semibold">${UI.esc(v.pilot)}</span></p>
            </div>
          </div>
          <div class="text-right">
            <span class="text-[0.68rem] text-[#7a7a7a] uppercase tracking-widest block font-medium">Destination ETA</span>
            <span class="text-sm font-extrabold text-emerald-600 font-mono-num">~${Math.round((1 - v.progress) * 45)} min remaining</span>
          </div>
        </div>

        <!-- Cockpit Gauges Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <!-- Speedometer -->
          <div class="panel-flat p-3.5 text-center border hairline bg-white rounded-xl shadow-sm">
            <p class="text-[0.65rem] uppercase text-[#7a7a7a] font-semibold tracking-wider">Ground Speed</p>
            <p class="text-2xl font-black font-mono-num text-[#0066cc] mt-1">${v.speedKmh} <span class="text-xs font-normal text-[#7a7a7a]">km/h</span></p>
            <p class="text-[0.62rem] text-[#86868b] mt-1">Radar Doppler Verified</p>
          </div>

          <!-- Altitude -->
          <div class="panel-flat p-3.5 text-center border hairline bg-white rounded-xl shadow-sm">
            <p class="text-[0.65rem] uppercase text-[#7a7a7a] font-semibold tracking-wider">Barometric Altitude</p>
            <p class="text-2xl font-black font-mono-num text-[#7c3aed] mt-1">${v.alt} <span class="text-xs font-normal text-[#7a7a7a]">m</span></p>
            <p class="text-[0.62rem] text-[#86868b] mt-1">+${Math.round(v.alt * 3.28084)} ft ASL</p>
          </div>

          <!-- Heading Compass -->
          <div class="panel-flat p-3.5 text-center border hairline bg-white rounded-xl shadow-sm">
            <p class="text-[0.65rem] uppercase text-[#7a7a7a] font-semibold tracking-wider">Compass Heading</p>
            <div class="flex items-center justify-center gap-1.5 mt-1">
              <i class="fa-solid fa-location-arrow text-amber-600 text-base transform" style="transform: rotate(${v.heading - 45}deg)"></i>
              <span class="text-2xl font-black font-mono-num text-[#1d1d1f]">${v.heading}°</span>
            </div>
            <p class="text-[0.62rem] text-[#86868b] mt-1">Magnetic Track</p>
          </div>

          <!-- Battery/Fuel -->
          <div class="panel-flat p-3.5 text-center border hairline bg-white rounded-xl shadow-sm">
            <p class="text-[0.65rem] uppercase text-[#7a7a7a] font-semibold tracking-wider">Reserve Fuel / Battery</p>
            <p class="text-2xl font-black font-mono-num text-emerald-600 mt-1">${v.batteryFuelPct}%</p>
            <div class="w-full bg-[#e5e5ea] rounded-full h-1.5 mt-2 overflow-hidden">
              <div class="bg-emerald-500 h-full rounded-full" style="width: ${v.batteryFuelPct}%"></div>
            </div>
          </div>
        </div>

        <!-- Telemetry Details & Payload -->
        <div class="panel-flat p-4 space-y-2.5 bg-[#f5f5f7] border hairline rounded-xl">
          <div class="flex items-center justify-between text-xs pb-2 border-b hairline">
            <span class="text-[#7a7a7a]">Target Waypoint:</span>
            <span class="font-bold text-[#1d1d1f]">${UI.esc(v.destination)}</span>
          </div>
          <div class="flex items-center justify-between text-xs pb-2 border-b hairline">
            <span class="text-[#7a7a7a]">Current GPS Coordinates:</span>
            <span class="font-mono-num text-[#0066cc] font-medium">${v.lat.toFixed(5)}° N, ${v.lng.toFixed(5)}° E</span>
          </div>
          <div class="flex items-center justify-between text-xs pb-2 border-b hairline">
            <span class="text-[#7a7a7a]">Manifest Cargo Payload:</span>
            <span class="font-semibold text-amber-700">${UI.esc(v.payload)}</span>
          </div>
          <div class="flex items-center justify-between text-xs">
            <span class="text-[#7a7a7a]">Navigational Flight Corridor:</span>
            <span class="text-[#1d1d1f] font-mono-num text-[0.7rem] font-semibold">${UI.esc(v.routeKey.toUpperCase())}</span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-end gap-2 pt-2">
          <button class="btn btn-ghost text-xs" data-modal-close>Close Telemetry</button>
          <button class="btn btn-primary text-xs" id="btn-hud-track-map">
            <i class="fa-solid fa-map-location-dot"></i>Track on Zone Map
          </button>
        </div>
      </div>
    `;

    const modal = UI.openModal(`Vehicle Telemetry HUD — ${v.code}`, html, { wide: true });
    
    const trackBtn = modal.querySelector('#btn-hud-track-map');
    if (trackBtn) {
      trackBtn.addEventListener('click', () => {
        UI.closeModal();
        location.hash = '#/map';
      });
    }
  }
}

window.LiveVehicleTracker = new LiveVehicleTracker();
