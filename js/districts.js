/* ==========================================================================
   OptiRelief — District-Wise Connectivity & Logistics Bottleneck Engine
   SIH 26002 Compliance: North Eastern Region (NER) Accessibility & Supply Gap
   ========================================================================== */

const DISTRICT_DATA = {
  'Dima Hasao': {
    name: 'Dima Hasao',
    state: 'Assam',
    hq: 'Haflong',
    lat: 25.1837,
    lng: 93.0232,
    terrain: 'Rugged Borail Mountain Range (High Landslide Vulnerability)',
    totalRoutes: 14,
    openRoutes: 8,
    partialRoutes: 4,
    closedRoutes: 2,
    highRiskRoutes: 3,
    connectivityPct: 71.4,
    activeIncidentsCount: 3,
    operatingVehicles: ['TRK-UNIMOG-01', 'TRK-TATA4X4-02', 'HELO-B3-01', 'PACK-MULE-ALP1'],
    avgDelayHours: 3.2,
    keyCorridors: [
      { name: 'NH-27 Haflong-Silchar Mountain Highway', status: 'Partially Blocked', type: 'Single-lane debris clearance', delay: '+2.5h' },
      { name: 'Haflong - Jatinga Valley Transit Spur', status: 'Open', type: 'All-weather 4x4 road', delay: 'None' },
      { name: 'Maibang - Mahur River Crossing', status: 'Closed', type: 'Culvert structural washout', delay: 'Detour +4.0h' },
      { name: 'Umrangso Hydro-Relief Access Link', status: 'High Risk', type: 'Active rockfall advisory', delay: '+1.5h' }
    ],
    incidents: [
      {
        id: 'inc-dh-1',
        title: 'Haflong Pass Landslide Km 42',
        severity: 'Critical',
        status: 'Closed',
        desc: '1,400 tonnes of mud and boulder slurry breached safety berm. Excavators deployed.',
        lat: 25.168,
        lng: 93.011,
        time: '24m ago',
        photo: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=400&q=80'
      },
      {
        id: 'inc-dh-2',
        title: 'Jatinga River Flash Scour',
        severity: 'High',
        status: 'Partially Blocked',
        desc: 'Single-lane 4x4 bypass opened under Army Engineer oversight. Weight capped at 5.0t.',
        lat: 25.132,
        lng: 93.045,
        time: '1h 10m ago'
      }
    ],
    bottlenecks: [
      {
        location: 'Haflong Sub-Divisional Hospital Camp',
        site_id: 'site-haflong-camp',
        commodity: 'High-Altitude Trauma Medical Kit',
        sku: 'MED-HIMAL-01',
        category: 'Medical',
        required: 500,
        available: 180,
        gap: 320,
        priority: 'CRITICAL',
        corridorImpact: 'NH-27 Debris slowdown delaying resupply from Guwahati Hub',
        recommendedVehicle: 'Helicopter (HELO-B3-01)'
      },
      {
        location: 'Jatinga Valley Displacement Shelter',
        site_id: 'site-jatinga-shelter',
        commodity: 'Sub-Zero Mountain Relief Tent',
        sku: 'SHE-SUBZERO-TENT',
        category: 'Shelter',
        required: 250,
        available: 85,
        gap: 165,
        priority: 'HIGH',
        corridorImpact: 'Haflong Pass transit delay',
        recommendedVehicle: 'Truck (TRK-UNIMOG-01)'
      },
      {
        location: 'Maibang Riverbank Cluster',
        site_id: 'site-maibang-cluster',
        commodity: 'Aquatabs & Water Filtration Units',
        sku: 'WAT-PUR-TABS',
        category: 'Water',
        required: 600,
        available: 220,
        gap: 380,
        priority: 'CRITICAL',
        corridorImpact: 'Culvert washout cut off ground tankers',
        recommendedVehicle: 'Helicopter (HELO-MI17-02)'
      }
    ]
  },

  'Champhai': {
    name: 'Champhai',
    state: 'Mizoram',
    hq: 'Champhai Town',
    lat: 23.4735,
    lng: 93.3282,
    terrain: 'Steep Border Ridgelines (Tiau River Basin)',
    totalRoutes: 10,
    openRoutes: 6,
    partialRoutes: 3,
    closedRoutes: 1,
    highRiskRoutes: 2,
    connectivityPct: 75.0,
    activeIncidentsCount: 2,
    operatingVehicles: ['TRK-TATA4X4-02', 'HELO-B3-01'],
    avgDelayHours: 2.8,
    keyCorridors: [
      { name: 'NH-102B Seling - Champhai Highway', status: 'Partially Blocked', type: 'Slope stability retaining works', delay: '+1.8h' },
      { name: 'Champhai - Zokhawthar Border Transit', status: 'Open', type: 'Paved customs corridor', delay: 'None' },
      { name: 'Khawbung Ridge Link', status: 'High Risk', type: 'Mudslide hazard under continuous rainfall', delay: '+2.0h' }
    ],
    incidents: [
      {
        id: 'inc-ch-1',
        title: 'Zokhawthar Border Road Subsidence',
        severity: 'High',
        status: 'Partially Blocked',
        desc: 'Road edge collapsed into drainage ravine. Pack mules and light 4x4 only.',
        lat: 23.362,
        lng: 93.385,
        time: '45m ago'
      }
    ],
    bottlenecks: [
      {
        location: 'Zokhawthar Community Medical Centre',
        site_id: 'site-zokhawthar-hub',
        commodity: 'Portable High-Altitude O2 Concentrator',
        sku: 'MED-OXY-PORT',
        category: 'Medical',
        required: 60,
        available: 15,
        gap: 45,
        priority: 'CRITICAL',
        corridorImpact: 'Ridge transit blockage',
        recommendedVehicle: 'Helicopter (HELO-B3-01)'
      },
      {
        location: 'Khawbung Hill Encampment',
        site_id: 'site-khawbung-camp',
        commodity: 'High-Calorie Himalayan Survival Rations',
        sku: 'FOO-ALP-RATION',
        category: 'Food',
        required: 400,
        available: 150,
        gap: 250,
        priority: 'HIGH',
        corridorImpact: 'NH-102B transit slowdown',
        recommendedVehicle: 'Truck (TRK-TATA4X4-02)'
      }
    ]
  },

  'Papum Pare': {
    name: 'Papum Pare',
    state: 'Arunachal Pradesh',
    hq: 'Yupia / Itanagar',
    lat: 27.1020,
    lng: 93.6920,
    terrain: 'Sub-Himalayan Foothills & Dikrong River Floodplain',
    totalRoutes: 16,
    openRoutes: 12,
    partialRoutes: 3,
    closedRoutes: 1,
    highRiskRoutes: 4,
    connectivityPct: 84.4,
    activeIncidentsCount: 2,
    operatingVehicles: ['TRK-UNIMOG-01', 'HELO-MI17-02', 'TRK-TATA4X4-02'],
    avgDelayHours: 1.9,
    keyCorridors: [
      { name: 'NH-415 Itanagar - Naharlagun Expressway', status: 'Open', type: '4-lane divided highway', delay: 'None' },
      { name: 'Sagalee Mountain Pass', status: 'Partially Blocked', type: 'Monsoon debris clearance in progress', delay: '+1.5h' },
      { name: 'Banderdewa Gateway Depot Route', status: 'Open', type: 'Heavy freight corridor', delay: 'None' }
    ],
    incidents: [
      {
        id: 'inc-pp-1',
        title: 'Sagalee Ridge Mudflow',
        severity: 'Moderate',
        status: 'Partially Blocked',
        desc: 'Single lane open with flag-marshals directing relief convoys.',
        lat: 27.240,
        lng: 93.420,
        time: '2h ago'
      }
    ],
    bottlenecks: [
      {
        location: 'Sagalee Sub-Division Aid Station',
        site_id: 'site-sagalee-aid',
        commodity: 'Extreme-Altitude Power Generator',
        sku: 'EQP-ALP-GEN',
        category: 'Equipment',
        required: 20,
        available: 4,
        gap: 16,
        priority: 'HIGH',
        corridorImpact: 'Power grid collapsed in upland valleys',
        recommendedVehicle: 'Truck (TRK-UNIMOG-01)'
      }
    ]
  },

  'East Khasi Hills': {
    name: 'East Khasi Hills',
    state: 'Meghalaya',
    hq: 'Shillong',
    lat: 25.5788,
    lng: 91.8933,
    terrain: 'High Rainfall Meghalaya Plateau & Deep Gorges (Cherrapunji/Sohra Belt)',
    totalRoutes: 18,
    openRoutes: 14,
    partialRoutes: 3,
    closedRoutes: 1,
    highRiskRoutes: 2,
    connectivityPct: 86.1,
    activeIncidentsCount: 1,
    operatingVehicles: ['TRK-TATA4X4-02', 'HELO-B3-01'],
    avgDelayHours: 1.4,
    keyCorridors: [
      { name: 'NH-6 Shillong - Guwahati Expressway', status: 'Open', type: 'Heavy transport lifeline', delay: 'None' },
      { name: 'Shillong - Sohra (Cherrapunji) Descent', status: 'High Risk', type: 'Dense cloud fog (visibility < 50m)', delay: '+1.2h' },
      { name: 'Pynursla - Dawki Border Route', status: 'Partially Blocked', type: 'Road shoulder reinforcement underway', delay: '+1.0h' }
    ],
    incidents: [
      {
        id: 'inc-ek-1',
        title: 'Sohra Gorge Dense Cloud Inversion',
        severity: 'Moderate',
        status: 'High Risk',
        desc: 'Zero-visibility fog bank halting unguided truck convoys.',
        lat: 25.275,
        lng: 91.730,
        time: '35m ago'
      }
    ],
    bottlenecks: [
      {
        location: 'Sohra Southern Valley Shelter',
        site_id: 'site-sohra-shelter',
        commodity: 'Insulated Water Jerrycan (10L)',
        sku: 'WAT-CAN-10L',
        category: 'Water',
        required: 500,
        available: 190,
        gap: 310,
        priority: 'HIGH',
        corridorImpact: 'Spring contamination after cloudburst',
        recommendedVehicle: 'Truck (TRK-TATA4X4-02)'
      }
    ]
  },

  'Kamrup Metropolitan': {
    name: 'Kamrup Metropolitan',
    state: 'Assam',
    hq: 'Guwahati (Regional Logistics HQ)',
    lat: 26.1445,
    lng: 91.7362,
    terrain: 'Brahmaputra River Valley & Primary Inter-State Logistics Hub',
    totalRoutes: 24,
    openRoutes: 22,
    partialRoutes: 2,
    closedRoutes: 0,
    highRiskRoutes: 1,
    connectivityPct: 95.8,
    activeIncidentsCount: 1,
    operatingVehicles: ['TRK-UNIMOG-01', 'HELO-MI17-02', 'TRK-TATA4X4-02', 'HELO-B3-01'],
    avgDelayHours: 0.4,
    keyCorridors: [
      { name: 'Guwahati Central Depot Hub Link', status: 'Open', type: 'All-weather multi-lane arterial', delay: 'None' },
      { name: 'Brahmaputra Barge Freight Terminal', status: 'Open', type: 'Riverine logistics ferry dock', delay: 'None' },
      { name: 'Lokpriya Gopinath Bordoloi Air Base Corridor', status: 'Open', type: 'Heavy rotary & fixed wing tarmac', delay: 'None' }
    ],
    incidents: [
      {
        id: 'inc-km-1',
        title: 'Depot Gate 3 Rail Freight Congestion',
        severity: 'Moderate',
        status: 'Partially Blocked',
        desc: 'Rerouting incoming container trains to Yard 2.',
        lat: 26.182,
        lng: 91.751,
        time: '1h 45m ago'
      }
    ],
    bottlenecks: []
  },

  'North Sikkim': {
    name: 'North Sikkim',
    state: 'Sikkim',
    hq: 'Mangan',
    lat: 27.5050,
    lng: 88.5350,
    terrain: 'Extreme High-Altitude Alpine Glacial Corridors (Teesta Basin)',
    totalRoutes: 12,
    openRoutes: 5,
    partialRoutes: 4,
    closedRoutes: 3,
    highRiskRoutes: 5,
    connectivityPct: 58.3,
    activeIncidentsCount: 4,
    operatingVehicles: ['HELO-MI17-02', 'PACK-MULE-ALP1', 'HELO-B3-01'],
    avgDelayHours: 5.1,
    keyCorridors: [
      { name: 'Mangan - Chungthang Highway', status: 'Closed', type: 'Major rockfall & Teesta flood embankment breach', delay: 'Cut off - Air Only' },
      { name: 'Chungthang - Lachen High Spur', status: 'Closed', type: 'Bridge superstructure severed', delay: 'Airlift Required' },
      { name: 'Chungthang - Lachung Evac Route', status: 'Partially Blocked', type: 'Emergency foot trail & ropeway bridge', delay: '+6.0h' }
    ],
    incidents: [
      {
        id: 'inc-ns-1',
        title: 'Chungthang Teesta Flash Flood Debris',
        severity: 'Critical',
        status: 'Closed',
        desc: 'Roadbed completely eroded for 800m. 2,100 people isolated in upper reaches.',
        lat: 27.601,
        lng: 88.645,
        time: '15m ago',
        photo: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=400&q=80'
      }
    ],
    bottlenecks: [
      {
        location: 'Chungthang Isolated Base Camp',
        site_id: 'site-chungthang-base',
        commodity: 'High-Altitude Trauma Medical Kit',
        sku: 'MED-HIMAL-01',
        category: 'Medical',
        required: 350,
        available: 40,
        gap: 310,
        priority: 'CRITICAL',
        corridorImpact: 'Total ground isolation — aerial airdrop mandatory',
        recommendedVehicle: 'Helicopter (HELO-MI17-02)'
      },
      {
        location: 'Lachen Glacial Encampment',
        site_id: 'site-lachen-camp',
        commodity: 'High-Calorie Himalayan Survival Rations',
        sku: 'FOO-ALP-RATION',
        category: 'Food',
        required: 500,
        available: 90,
        gap: 410,
        priority: 'CRITICAL',
        corridorImpact: 'Bridge washout',
        recommendedVehicle: 'Helicopter (HELO-MI17-02)'
      }
    ]
  },

  'Langtang Valley': {
    name: 'Langtang Valley',
    state: 'Border Himalayan Sector',
    hq: 'Syabrubesi / Dhunche',
    lat: 28.2140,
    lng: 85.5390,
    terrain: 'Glacial Himalayan Valley (1,460m - 3,870m)',
    totalRoutes: 10,
    openRoutes: 6,
    partialRoutes: 2,
    closedRoutes: 2,
    highRiskRoutes: 3,
    connectivityPct: 70.0,
    activeIncidentsCount: 3,
    operatingVehicles: ['HELO-B3-01', 'HELO-MI17-02', 'TRK-UNIMOG-01', 'PACK-MULE-ALP1'],
    avgDelayHours: 4.0,
    keyCorridors: [
      { name: 'Syabrubesi - Lama Hotel Trek Corridor', status: 'Open', type: 'Mule train & light porter pack trail', delay: 'None' },
      { name: 'Lama Hotel - Ghodatabela Canyon Spur', status: 'Partially Blocked', type: 'Debris field crossing', delay: '+2.0h' },
      { name: 'Langtang Village Ground Zero Access', status: 'Closed', type: 'Avalanche debris cone (3.5km wide)', delay: 'Airlift Only' }
    ],
    incidents: [
      {
        id: 'inc-lt-1',
        title: 'Langtang Avalanche Cone Blockage',
        severity: 'Critical',
        status: 'Closed',
        desc: 'Post-seismic debris completely buried main trail. Helipad operational at Ghodatabela.',
        lat: 28.214,
        lng: 85.539,
        time: '18m ago'
      }
    ],
    bottlenecks: [
      {
        location: 'Langtang Village Ground Zero',
        site_id: 'site-langtang',
        commodity: 'High-Altitude Trauma Medical Kit',
        sku: 'MED-HIMAL-01',
        category: 'Medical',
        required: 200,
        available: 50,
        gap: 150,
        priority: 'CRITICAL',
        corridorImpact: 'Avalanche cone isolates valley head',
        recommendedVehicle: 'Helicopter (HELO-B3-01)'
      },
      {
        location: 'Kyanjin Gompa High Evac Base',
        site_id: 'site-kyanjin',
        commodity: 'Portable High-Altitude O2 Concentrator',
        sku: 'MED-OXY-PORT',
        category: 'Medical',
        required: 50,
        available: 12,
        gap: 38,
        priority: 'CRITICAL',
        corridorImpact: 'Extreme elevation hypothermia threat',
        recommendedVehicle: 'Helicopter (HELO-MI17-02)'
      }
    ]
  }
};

const DistrictsEngine = {
  currentDistrictKey: localStorage.getItem('optirelief_district') || 'Dima Hasao',
  listeners: new Set(),

  getAll() {
    return DISTRICT_DATA;
  },

  get(name = this.currentDistrictKey) {
    return DISTRICT_DATA[name] || DISTRICT_DATA['Dima Hasao'];
  },

  setDistrict(name) {
    if (DISTRICT_DATA[name]) {
      this.currentDistrictKey = name;
      localStorage.setItem('optirelief_district', name);
      this.notify();
    }
  },

  onChange(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  },

  notify() {
    this.listeners.forEach((fn) => {
      try { fn(this.get()); } catch (e) { console.warn(e); }
    });
    if (window.App && App.state && App.state.loaded) {
      App.reroute();
    }
  },

  recordIncident(districtName, inc) {
    const dist = DISTRICT_DATA[districtName];
    if (!dist) return;

    dist.incidents.unshift({
      id: 'inc-user-' + Date.now(),
      title: inc.title,
      severity: inc.severity,
      status: inc.status,
      desc: inc.desc,
      photo: inc.photo,
      lat: inc.lat,
      lng: inc.lng,
      time: 'Just now'
    });

    dist.activeIncidentsCount = dist.incidents.length;
    if (inc.status === 'Closed') {
      dist.closedRoutes = Math.min(dist.totalRoutes, dist.closedRoutes + 1);
      dist.openRoutes = Math.max(0, dist.openRoutes - 1);
    } else if (inc.status === 'Partially Blocked') {
      dist.partialRoutes = Math.min(dist.totalRoutes, dist.partialRoutes + 1);
      dist.openRoutes = Math.max(0, dist.openRoutes - 1);
    }
    dist.connectivityPct = Number(((dist.openRoutes + dist.partialRoutes * 0.5) / dist.totalRoutes * 100).toFixed(1));
    this.notify();
  },

  /**
   * One-Click workflow: Load bottleneck demand into 3D Optimizer and switch view
   */
  loadGapIntoOptimizer(gap) {
    if (!window.RBAC.can('canRunOptimizer')) {
      UI.toast('Permission denied: Viewer cannot modify optimizer plans', 'warn');
      return;
    }

    // Prepare solver pre-fill state
    window.SESSION_OPTIMIZER_PREFILL = {
      targetSiteName: gap.location,
      sku: gap.sku,
      requiredGap: gap.gap,
      priority: gap.priority,
      commodity: gap.commodity
    };

    location.hash = '#/optimizer';
    UI.toast(`Pre-loaded ${gap.commodity} gap (${gap.gap} units) into 3D Optimizer!`, 'success');
  }
};

window.DistrictsEngine = DistrictsEngine;
