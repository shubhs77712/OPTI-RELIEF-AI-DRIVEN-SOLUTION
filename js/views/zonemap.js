/* ==========================================================================
   OptiRelief — Langtang & NER Emergency Route & Live Vehicle Tracking Map
   SIH 26002: Real-time GPS Telemetry, Radar Pulse Pins & Cockpit HUD
   ========================================================================== */

window.Views = window.Views || {};

/* ------------------------------------------------------------ Geographic Data */

const REGIONAL_SECTORS = {
  'Langtang Valley': {
    name: 'Langtang Valley',
    center: [28.2250, 85.5500],
    defaultZoom: 11,
    region: 'Rasuwa District & Himalayan High Corridors',
    bounds: [[28.08, 85.24], [28.28, 85.72]]
  },
  'Dima Hasao': {
    name: 'Dima Hasao (Assam)',
    center: [25.1837, 93.0232],
    defaultZoom: 11,
    region: 'Haflong - Jatinga Valley & NH-27 Corridor',
    bounds: [[25.00, 92.80], [25.35, 93.25]]
  },
  'Champhai': {
    name: 'Champhai (Mizoram)',
    center: [23.4735, 93.3282],
    defaultZoom: 11,
    region: 'Champhai - Zokhawthar Border Transit',
    bounds: [[23.25, 93.15], [23.65, 93.50]]
  },
  'Papum Pare': {
    name: 'Papum Pare (Arunachal)',
    center: [27.1020, 93.6920],
    defaultZoom: 11,
    region: 'Itanagar - Sagalee Foothill Valley',
    bounds: [[26.90, 93.45], [27.30, 93.90]]
  },
  'East Khasi Hills': {
    name: 'East Khasi Hills (Meghalaya)',
    center: [25.5788, 91.8933],
    defaultZoom: 11,
    region: 'Shillong - Cherrapunji / Sohra Gorges',
    bounds: [[25.20, 91.60], [25.80, 92.10]]
  },
  'Kamrup Metropolitan': {
    name: 'Kamrup Metro (Assam)',
    center: [26.1445, 91.7362],
    defaultZoom: 11,
    region: 'Guwahati Regional Air & Freight Staging Base',
    bounds: [[26.00, 91.50], [26.30, 91.95]]
  },
  'North Sikkim': {
    name: 'North Sikkim (Sikkim)',
    center: [27.5050, 88.5350],
    defaultZoom: 11,
    region: 'Mangan - Chungthang - Lachen Alpine Corridors',
    bounds: [[27.30, 88.35], [27.75, 88.75]]
  }
};

const LANGTANG_GEOGRAPHY = {
  center: [28.2250, 85.5500],
  defaultZoom: 11,
  region: 'Rasuwa District & Himalayan High Corridors',

  // Primary Trekking Corridor: Syabrubesi -> Lama Hotel -> Langtang Village -> Kyanjin Gompa
  primaryTrekRoute: [
    [28.1580, 85.3330], // Syabrubesi (1,460m)
    [28.1565, 85.3440],
    [28.1572, 85.3560],
    [28.1595, 85.3660],
    [28.1635, 85.3780], // Bamboo (1,970m)
    [28.1660, 85.3890],
    [28.1690, 85.3990],
    [28.1720, 85.4080], // Rimche (2,400m)
    [28.1760, 85.4240], // Lama Hotel (2,470m)
    [28.1820, 85.4380],
    [28.1885, 85.4490],
    [28.1940, 85.4670],
    [28.2040, 85.4850], // Ghodatabela (3,030m)
    [28.2085, 85.4990],
    [28.2130, 85.5140], // Thangshyap (3,140m)
    [28.2125, 85.5260],
    [28.2140, 85.5390], // Langtang Village Ground Zero (3,430m)
    [28.2170, 85.5510], // Mundu (3,550m)
    [28.2155, 85.5600],
    [28.2125, 85.5680]  // Kyanjin Gompa (3,870m)
  ],

  // High-Altitude Ridge Spurs
  ridgeSpurs: [
    {
      name: 'Kyanjin Gompa → Kyanjin Ri Summit',
      elev: '3,870m → 4,773m (+903m)',
      coords: [[28.2125, 85.5680], [28.2180, 85.5695], [28.2250, 85.5720]]
    },
    {
      name: 'Kyanjin Gompa → Tsergo Ri',
      elev: '3,870m → 4,984m (+1,114m)',
      coords: [[28.2125, 85.5680], [28.2200, 85.5850], [28.2320, 85.6020], [28.2430, 85.6180]]
    }
  ],

  roadheadAccess: [
    [28.1130, 85.3020], // Dhunche HQ
    [28.1250, 85.3120],
    [28.1390, 85.3190],
    [28.1480, 85.3260],
    [28.1580, 85.3330]  // Syabrubesi Depot
  ],

  airEvacCorridor: [
    [28.1580, 85.3330], // Syabrubesi
    [28.2040, 85.4850], // Ghodatabela
    [28.2125, 85.5680]  // Kyanjin Gompa
  ],

  milestones: [
    { name: 'Syabrubesi', km: 0.0, elev: 1460, desc: 'Roadhead logistics terminal & Pasang Lhamu Hwy depot', lat: 28.1580, lng: 85.3330, kind: 'depot' },
    { name: 'Bamboo', km: 5.6, elev: 1970, desc: 'River canyon checkpost & mule staging point', lat: 28.1635, lng: 85.3780, kind: 'site' },
    { name: 'Rimche', km: 9.4, elev: 2400, desc: 'High junction to Sherpa Gaon & valley gateway', lat: 28.1720, lng: 85.4080, kind: 'site' },
    { name: 'Lama Hotel', km: 11.2, elev: 2470, desc: 'Primary mid-valley aid hub & forward staging station', lat: 28.1760, lng: 85.4240, kind: 'site' },
    { name: 'Ghodatabela', km: 18.5, elev: 3030, desc: 'Army checkpost, high-altitude helipad & field hospital', lat: 28.2040, lng: 85.4850, kind: 'site' },
    { name: 'Thangshyap', km: 22.0, elev: 3140, desc: 'Pasture encampment & sub-zero emergency relief camp', lat: 28.2130, lng: 85.5140, kind: 'site' },
    { name: 'Langtang Village', km: 25.1, elev: 3430, desc: 'Ground Zero — avalanche hazard zone & critical triage', lat: 28.2140, lng: 85.5390, kind: 'site' },
    { name: 'Kyanjin Gompa', km: 31.8, elev: 3870, desc: 'Valley head monastery, high-altitude evac outpost', lat: 28.2125, lng: 85.5680, kind: 'site' }
  ]
};

Views.zonemap = function (outlet) {
  const sites = App.state.sites;
  const warehouses = App.warehouses();
  const zones = App.disasterSites();

  const filters = {
    Critical: true,
    High: true,
    Moderate: true,
    Stable: true,
    trekRoute: true,
    ridgeSpurs: true,
    roadhead: true,
    airEvac: true,
    vehicles: true
  };

  const sectorOptions = Object.keys(REGIONAL_SECTORS).map((k) => `
    <option value="${k}">${REGIONAL_SECTORS[k].name}</option>
  `).join('');

  outlet.innerHTML = `
    <div class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section class="panel p-5 min-w-0 bg-white border hairline rounded-2xl shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
              <h3 id="map-sector-title" class="font-bold text-[#1d1d1f] text-base">Operational GIS Theater</h3>
              <select id="map-sector-select" class="field text-xs py-1 px-3 w-auto bg-white border hairline text-[#1d1d1f] font-semibold cursor-pointer rounded-full shadow-sm">
                ${sectorOptions}
              </select>
            </div>
            <p id="map-sector-sub" class="text-xs text-[#7a7a7a] mt-0.5">${LANGTANG_GEOGRAPHY.region}</p>
          </div>

          <div class="flex flex-wrap items-center gap-2" id="map-controls-row">
            <!-- Basemap Switcher (Apple Segmented Control Pill) -->
            <div class="flex items-center gap-1 bg-[#f5f5f7] p-1 rounded-full border hairline shadow-sm" id="basemap-switchers">
              <button class="btn btn-xs basemap-btn active" data-bm="topo" style="background:#0066cc;color:#ffffff;border-radius:9999px;font-weight:600"><i class="fa-solid fa-mountain mr-1"></i>Topo</button>
              <button class="btn btn-xs basemap-btn btn-ghost" data-bm="osm" style="color:#1d1d1f;border-radius:9999px;font-weight:500"><i class="fa-solid fa-map mr-1"></i>OSM</button>
              <button class="btn btn-xs basemap-btn btn-ghost" data-bm="satellite" style="color:#1d1d1f;border-radius:9999px;font-weight:500"><i class="fa-solid fa-satellite mr-1"></i>Sat</button>
            </div>

            <!-- Route and Zone Filters -->
            <div class="flex flex-wrap gap-1" id="map-filters">
              <button class="btn btn-xs map-filter active" data-f="vehicles" style="border-color:#0066cc;background:#e1f0ff;color:#0066cc;font-weight:600"><i class="fa-solid fa-satellite-dish mr-1 animate-pulse"></i>Live GPS</button>
              <button class="btn btn-xs map-filter active" data-f="Critical" style="border-color:#ef4444;background:#fee2e2;color:#b91c1c;font-weight:600"><span class="w-2 h-2 rounded-full bg-red-500 inline-block mr-1"></span>Critical</button>
              <button class="btn btn-xs map-filter active" data-f="High" style="border-color:#f59e0b;background:#fef3c7;color:#b45309;font-weight:600"><span class="w-2 h-2 rounded-full bg-amber-500 inline-block mr-1"></span>High</button>
              <button class="btn btn-xs map-filter active" data-f="trekRoute" style="border-color:#0066cc;background:#f5f5f7;color:#0066cc;font-weight:600"><i class="fa-solid fa-person-walking mr-1 text-[#0066cc]"></i>Trek</button>
              <button class="btn btn-xs map-filter active" data-f="airEvac" style="border-color:#ea580c;background:#ffedd5;color:#c2410c;font-weight:600"><i class="fa-solid fa-helicopter mr-1 text-orange-600"></i>Helo</button>
            </div>
          </div>
        </div>

        <div id="zone-map" class="relative"></div>

        <div class="flex flex-wrap items-center justify-between gap-3 mt-3.5 pt-3 border-t hairline text-[0.72rem] text-[#6e6e73]">
          <div class="flex flex-wrap items-center gap-3">
            <span class="flex items-center gap-1.5"><i class="fa-solid fa-satellite text-[#0066cc] animate-pulse"></i>Live GPS Radar (1.5s refresh)</span>
            <span class="flex items-center gap-1.5"><span class="inline-block w-2.5 h-2.5 rounded-full bg-red-500"></span>Ground Zero (U9–10)</span>
            <span class="flex items-center gap-1.5"><span class="inline-block w-2.5 h-2.5 rounded-full bg-amber-500"></span>Relief Camp (U7–8)</span>
            <span class="flex items-center gap-1.5"><span class="inline-block w-3 h-1 bg-[#0066cc] rounded"></span>Primary Trail</span>
          </div>
          <div class="flex items-center gap-2 font-mono-num text-[0.68rem] text-emerald-600 font-semibold">
            <span class="status-dot dot-live"></span>Continuous Multi-Modal Satellite Lock
          </div>
        </div>
      </section>

      <section class="space-y-4 min-w-0">
        <!-- Live Vehicle Fleet Telemetry Roster -->
        <div class="panel p-5 bg-white border hairline rounded-2xl shadow-sm">
          ${UI.sectionHead('Live Fleet Telemetry', 'Satellite GPS tracking stream',
            `<span class="badge badge-stable text-[0.65rem]"><i class="fa-solid fa-tower-broadcast animate-pulse mr-1"></i>5 Active</span>`)}
          <div class="space-y-2 max-h-[280px] overflow-y-auto pr-1" id="live-fleet-roster"></div>
        </div>

        <!-- Trail Milestone Timeline -->
        <div class="panel p-5 bg-white border hairline rounded-2xl shadow-sm">
          ${UI.sectionHead('Primary Trek Corridor', 'Syabrubesi → Kyanjin Gompa (31.8 km)',
            `<span class="badge badge-moderate">+2,410m Net</span>`)}
          <div class="space-y-1.5 max-h-[220px] overflow-y-auto pr-1" id="milestone-list">
            ${LANGTANG_GEOGRAPHY.milestones.map((m, idx) => `
              <button class="w-full text-left panel-flat p-2.5 hover:bg-white hover:border-[#0066cc] bg-[#f5f5f7] border hairline rounded-xl transition milestone-jump"
                data-lat="${m.lat}" data-lng="${m.lng}">
                <div class="flex items-center gap-2">
                  <span class="w-5 h-5 rounded-full grid place-items-center text-[0.62rem] font-bold ${m.kind === 'depot' ? 'bg-[#e1f0ff] text-[#0066cc] border border-[#0066cc]/40' : (m.name.includes('Langtang') || m.name.includes('Kyanjin Gompa') ? 'bg-red-50 text-red-600 border border-red-300' : 'bg-white text-[#1d1d1f] border border-[#d2d2d7]')}">
                    ${idx + 1}
                  </span>
                  <span class="text-xs font-semibold text-[#1d1d1f] truncate">${UI.esc(m.name)}</span>
                  <span class="ml-auto elev-pill bg-white text-[#1d1d1f] border hairline text-[10px] font-mono-num font-semibold px-2 py-0.5 rounded-full">${m.elev}m</span>
                </div>
                <div class="flex justify-between items-center mt-1 text-[0.68rem] text-[#6e6e73] font-mono-num pl-7">
                  <span class="font-medium">${m.km.toFixed(1)} km</span>
                  <span class="text-[#86868b] truncate max-w-[170px] text-right">${UI.esc(m.desc)}</span>
                </div>
              </button>`).join('')}
          </div>
        </div>

        <!-- Zone Roster -->
        <div class="panel p-5 bg-white border hairline rounded-2xl shadow-sm">
          ${UI.sectionHead('Relief Sites &amp; Camps', `${zones.length} active node(s)`)}
          <div id="zone-list" class="space-y-2 max-h-[220px] overflow-y-auto pr-1"></div>
        </div>
      </section>
    </div>`;

  /* ------------------------------------------------------------ Map Setup */

  const BASEMAPS = {
    topo: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
      attribution: '&copy; Esri, USGS, FAO',
      maxZoom: 18,
      crossOrigin: true
    }),
    osm: L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
      crossOrigin: true
    }),
    satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '&copy; Esri, Maxar, Earthstar',
      maxZoom: 18,
      crossOrigin: true
    })
  };

  const mapCenter = LANGTANG_GEOGRAPHY.center;
  const map = L.map('zone-map', {
    zoomControl: true,
    attributionControl: true,
    preferCanvas: true,
    layers: [BASEMAPS.topo]
  }).setView(mapCenter, LANGTANG_GEOGRAPHY.defaultZoom);

  let currentBasemap = 'topo';
  function setBasemap(key) {
    if (BASEMAPS[currentBasemap]) map.removeLayer(BASEMAPS[currentBasemap]);
    if (BASEMAPS[key]) {
      BASEMAPS[key].addTo(map);
      currentBasemap = key;
    }
  }

  // Layer groups
  const layerTrekRoute = L.layerGroup().addTo(map);
  const layerRidgeSpurs = L.layerGroup().addTo(map);
  const layerRoadhead = L.layerGroup().addTo(map);
  const layerAirEvac = L.layerGroup().addTo(map);
  const layerZones = L.layerGroup().addTo(map);
  const layerDepots = L.layerGroup().addTo(map);
  const layerLiveVehicles = L.layerGroup().addTo(map);

  const markerIndex = {};
  const vehicleMarkers = {};
  const vehicleTrails = {};

  function haversine(a, b) {
    const R = 6371;
    const dLat = (b[0] - a[0]) * Math.PI / 180;
    const dLng = (b[1] - a[1]) * Math.PI / 180;
    const la1 = a[0] * Math.PI / 180, la2 = b[0] * Math.PI / 180;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  function nearestDepot(zone) {
    let best = null;
    warehouses.forEach((w) => {
      const d = haversine([Number(zone.lat), Number(zone.lng)], [Number(w.lat), Number(w.lng)]);
      if (!best || d < best.km) best = { depot: w, km: d };
    });
    return best;
  }

  /* ------------------------------------------------------------ Trek & Corridor Polylines */

  L.polyline(LANGTANG_GEOGRAPHY.primaryTrekRoute, {
    color: '#0284c7', weight: 8, opacity: 0.35, lineCap: 'round', lineJoin: 'round'
  }).addTo(layerTrekRoute);

  L.polyline(LANGTANG_GEOGRAPHY.primaryTrekRoute, {
    color: '#38bdf8', weight: 3.5, opacity: 0.95
  }).bindTooltip('<b>Primary Langtang Trek Corridor</b> (31.8 km)', { sticky: true }).addTo(layerTrekRoute);

  LANGTANG_GEOGRAPHY.ridgeSpurs.forEach((spur) => {
    L.polyline(spur.coords, { color: '#c084fc', weight: 3, dashArray: '6 6', opacity: 0.85 })
      .bindTooltip(`<b>${UI.esc(spur.name)}</b>`, { sticky: true }).addTo(layerRidgeSpurs);
  });

  L.polyline(LANGTANG_GEOGRAPHY.roadheadAccess, { color: '#10b981', weight: 4.5, opacity: 0.9 })
    .bindTooltip('<b>Pasang Lhamu Highway Access</b>', { sticky: true }).addTo(layerRoadhead);

  L.polyline(LANGTANG_GEOGRAPHY.airEvacCorridor, { color: '#f59e0b', weight: 3, dashArray: '10 10', opacity: 0.85 })
    .bindTooltip('<b>Helicopter Evac Corridor</b>', { sticky: true }).addTo(layerAirEvac);

  /* ------------------------------------------------------------ Disaster Sites & Depots */

  warehouses.forEach((w) => {
    const icon = L.divIcon({
      className: '',
      html: `<div class="w-8 h-8 rounded-xl bg-white border-2 border-[#0066cc] text-[#0066cc] grid place-items-center text-sm shadow-md">
        <i class="fa-solid fa-warehouse"></i>
      </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
    L.marker([w.lat, w.lng], { icon })
      .bindPopup(`<div style="min-width:180px" class="font-sans">
        <p style="font-weight:700;margin:0 0 4px;color:#1d1d1f;font-size:13px">${UI.esc(w.site_name)}</p>
        <span class="badge badge-stable" style="font-size:10px">Regional Depot</span>
      </div>`).addTo(layerDepots);
  });

  zones.forEach((z) => {
    const isCrit = z.status === 'Critical' || (z.urgency || 0) >= 9;
    const color = isCrit ? '#ef4444' : '#f59e0b';
    const icon = L.divIcon({
      className: '',
      html: `<div class="w-7 h-7 rounded-full bg-white border-2 grid place-items-center text-xs font-bold shadow-md" style="border-color:${color};color:${color};box-shadow:0 2px 8px ${color}44">
        ${z.urgency}
      </div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });
    const m = L.marker([z.lat, z.lng], { icon }).bindPopup(`<div style="min-width:210px" class="font-sans text-[#1d1d1f]">
      <p style="font-weight:700;margin:0 0 4px;color:${color};font-size:13px">${UI.esc(z.site_name)}</p>
      <div style="display:flex;gap:4px;margin:4px 0">
        <span class="badge ${UI.statusBadgeClass(z.status)}">${UI.esc(z.status)}</span>
        <span class="badge badge-muted">${UI.num(z.population)} affected</span>
      </div>
      <p style="font-size:11.5px;color:#6e6e73;margin:4px 0">Transit ETA: <b class="text-[#1d1d1f]">${z.transport_time}h</b> · Priority Index: <b class="text-[#0066cc]">${OptiSolver.priorityIndex(z.urgency, z.need_severity, z.transport_time)}</b></p>
      <button class="btn btn-solve btn-xs w-full mt-2 plan-zone-btn" data-site-id="${UI.esc(z.id)}">
        <i class="fa-solid fa-bolt"></i>Generate Load Manifest
      </button>
    </div>`);
    markerIndex[z.id] = m;
    m.addTo(layerZones);
  });

  /* ------------------------------------------------------------ LIVE VEHICLE TRACKING */

  function renderLiveVehicles(fleet) {
    if (!filters.vehicles) {
      layerLiveVehicles.clearLayers();
      return;
    }

    fleet.forEach((v) => {
      const isHelo = v.type === 'Helicopter';
      const isMule = v.type.includes('Mule');
      const iconClass = isHelo ? 'fa-helicopter' : (isMule ? 'fa-horse' : 'fa-truck-fast');
      const glowColor = isHelo ? '#0066cc' : (isMule ? '#d97706' : '#16a34a');

      // 1. Update/Create Vehicle Marker
      if (!vehicleMarkers[v.id]) {
        const customIcon = L.divIcon({
          className: '',
          html: `<div class="radar-pin cursor-pointer" id="vpin-${v.id}">
            <div class="radar-pulse" style="border-color:${glowColor}"></div>
            <div class="w-8 h-8 rounded-full bg-white border-2 grid place-items-center text-xs shadow-md" style="border-color:${glowColor};color:${glowColor}">
              <i class="fa-solid ${iconClass}"></i>
            </div>
            <div class="absolute -top-7 left-1/2 transform -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-full bg-white/95 border border-[#d2d2d7] text-[0.68rem] font-mono-num font-bold text-[#1d1d1f] shadow-md">
              ${v.code}
            </div>
          </div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        });

        const m = L.marker([v.lat, v.lng], { icon: customIcon, zIndexOffset: 1000 })
          .bindPopup(`<div style="min-width:210px" class="font-sans text-[#1d1d1f]">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
              <span style="font-weight:800;color:${glowColor};font-family:monospace">${UI.esc(v.code)}</span>
              <span class="badge badge-stable" style="font-size:9px">LIVE GPS</span>
            </div>
            <p style="font-size:11.5px;color:#1d1d1f;margin:0">Pilot: <b>${UI.esc(v.pilot)}</b></p>
            <p style="font-size:11.5px;color:#6e6e73;margin:2px 0">Speed: <b class="font-mono-num text-[#0066cc]">${v.speedKmh} km/h</b> · Alt: <b class="font-mono-num text-purple-700">${v.alt}m</b></p>
            <p style="font-size:11px;color:#b45309;margin:3px 0 6px">Payload: ${UI.esc(v.payload)}</p>
            <button class="btn btn-primary btn-xs w-full btn-open-hud" data-vid="${v.id}">
              <i class="fa-solid fa-gauge-high"></i>Open Cockpit HUD
            </button>
          </div>`);

        m.addTo(layerLiveVehicles);
        vehicleMarkers[v.id] = m;
      } else {
        vehicleMarkers[v.id].setLatLng([v.lat, v.lng]);
      }

      // 2. Update/Create Trail Breadcrumbs
      if (v.trail && v.trail.length > 1) {
        if (!vehicleTrails[v.id]) {
          vehicleTrails[v.id] = L.polyline(v.trail, {
            color: glowColor,
            weight: 2.5,
            opacity: 0.65,
            dashArray: '4 4'
          }).addTo(layerLiveVehicles);
        } else {
          vehicleTrails[v.id].setLatLngs(v.trail);
        }
      }
    });

    // 3. Update Side Telemetry Roster
    const rosterEl = document.getElementById('live-fleet-roster');
    if (rosterEl) {
      rosterEl.innerHTML = fleet.map((v) => {
        const isHelo = v.type === 'Helicopter';
        const isMule = v.type.includes('Mule');
        const iconClass = isHelo ? 'fa-helicopter text-[#0066cc]' : (isMule ? 'fa-horse text-amber-600' : 'fa-truck-fast text-emerald-600');
        return `
          <div class="panel-flat p-2.5 hover:bg-[#f0f0f2] transition cursor-pointer flex flex-col gap-1 border hairline bg-[#f5f5f7] rounded-xl tracking-card" data-vid="${v.id}">
            <div class="flex items-center gap-2">
              <i class="fa-solid ${iconClass} text-xs"></i>
              <span class="text-xs font-extrabold text-[#1d1d1f] font-mono-num">${UI.esc(v.code)}</span>
              <span class="ml-auto font-mono-num text-[0.68rem] text-[#0066cc] font-bold">${v.speedKmh} km/h</span>
            </div>
            <div class="flex justify-between items-center text-[0.68rem] text-[#6e6e73]">
              <span class="truncate max-w-[150px] font-medium text-[#1d1d1f]">→ ${UI.esc(v.destination)}</span>
              <span class="font-mono-num text-[#7c3aed] font-semibold">${v.alt}m ASL</span>
            </div>
          </div>
        `;
      }).join('');

      rosterEl.querySelectorAll('.tracking-card').forEach((card) => {
        card.addEventListener('click', () => {
          const v = window.LiveVehicleTracker.getVehicle(card.dataset.vid);
          if (v) {
            map.flyTo([v.lat, v.lng], 13.5, { duration: 0.8 });
            if (vehicleMarkers[v.id]) vehicleMarkers[v.id].openPopup();
          }
        });
      });
    }
  }

  // Subscribe to live tracking telemetry
  const unsubscribeTracker = window.LiveVehicleTracker.subscribe(renderLiveVehicles);
  renderLiveVehicles(window.LiveVehicleTracker.getFleet());

  // Listen for Cockpit HUD open clicks
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-open-hud');
    if (btn) {
      window.LiveVehicleTracker.openCockpitHUD(btn.dataset.vid);
    }
  });

  /* ------------------------------------------------------------ Sector Switcher */

  const sectorSelect = outlet.querySelector('#map-sector-select');
  if (sectorSelect) {
    sectorSelect.addEventListener('change', (e) => {
      const sec = REGIONAL_SECTORS[e.target.value];
      if (sec) {
        outlet.querySelector('#map-sector-sub').textContent = sec.region;
        map.flyTo(sec.center, sec.defaultZoom, { duration: 1.2 });
      }
    });
  }

  /* ------------------------------------------------------------ Basemap & Filter controls */

  outlet.querySelectorAll('.basemap-btn').forEach((b) => {
    b.addEventListener('click', () => {
      const bm = b.dataset.bm;
      setBasemap(bm);
      outlet.querySelectorAll('.basemap-btn').forEach((x) => {
        const isActive = x.dataset.bm === bm;
        x.classList.toggle('active', isActive);
        x.classList.toggle('btn-ghost', !isActive);
        x.style.background = isActive ? '#0066cc' : 'transparent';
        x.style.color = isActive ? '#ffffff' : '#1d1d1f';
        x.style.fontWeight = isActive ? '600' : '500';
      });
    });
  });

  outlet.querySelectorAll('.map-filter').forEach((b) => {
    b.addEventListener('click', () => {
      const f = b.dataset.f;
      filters[f] = !filters[f];
      b.classList.toggle('active', filters[f]);
      b.style.opacity = filters[f] ? '1' : '0.35';

      if (f === 'vehicles') {
        if (!filters.vehicles) layerLiveVehicles.clearLayers();
        else renderLiveVehicles(window.LiveVehicleTracker.getFleet());
      } else if (f === 'trekRoute') {
        if (filters.trekRoute) layerTrekRoute.addTo(map); else map.removeLayer(layerTrekRoute);
      } else if (f === 'airEvac') {
        if (filters.airEvac) layerAirEvac.addTo(map); else map.removeLayer(layerAirEvac);
      }
    });
  });

  outlet.querySelectorAll('.milestone-jump').forEach((b) => {
    b.addEventListener('click', () => {
      const lat = Number(b.dataset.lat);
      const lng = Number(b.dataset.lng);
      map.flyTo([lat, lng], 13.5, { duration: 0.8 });
    });
  });

  // Handle "Generate Load Manifest" popup button
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.plan-zone-btn');
    if (btn) {
      Views.optimizerPreset = { siteId: btn.dataset.siteId };
      location.hash = '#/optimizer';
    }
  });

  // Cleanup Leaflet map and tracker subscription on view teardown
  return () => {
    try { unsubscribeTracker(); } catch (e) {}
    try { map.remove(); } catch (e) {}
  };
};
