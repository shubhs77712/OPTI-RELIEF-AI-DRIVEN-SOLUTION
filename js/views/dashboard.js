/* ==========================================================================
   OptiRelief — Dashboard / Overview
   SIH 26002 Compliant: Integrated District Connectivity & Bottleneck Analysis
   ========================================================================== */

window.Views = window.Views || {};

Views.dashboard = function (outlet) {
  const k = App.kpis();
  const sites = App.disasterSites();
  const alerts = App.state.alerts;
  const supplies = App.state.supplies;
  const vehicles = App.state.vehicles;
  const currentLang = window.I18N ? window.I18N.getLanguage() : 'en';

  // Active NER District Data
  const distEngine = window.DistrictsEngine || {
    get: () => ({
      name: 'Dima Hasao', state: 'Assam', hq: 'Haflong',
      totalRoutes: 14, openRoutes: 8, partialRoutes: 4, closedRoutes: 2, highRiskRoutes: 3,
      connectivityPct: 71.4, activeIncidentsCount: 3, operatingVehicles: ['TRK-UNIMOG-01', 'HELO-B3-01'],
      avgDelayHours: 3.2, keyCorridors: [], bottlenecks: []
    }),
    getAll: () => ({})
  };
  const activeDistrict = distEngine.get();
  const allDistricts = distEngine.getAll();

  /* ---------------- KPI row ---------------- */
  const kpiHtml = [
    UI.kpiCard({
      label: I18N.t('vehicles_operating', 'Active Relief Vehicles'),
      value: k.activeVehicles, unit: `/ ${k.totalVehicles}`,
      icon: 'fa-truck-fast', tone: 'sky',
      pct: k.totalVehicles ? (k.activeVehicles / k.totalVehicles) * 100 : 0,
      foot: `${vehicles.filter((v) => v.status === 'Available').length} staged &amp; ready, ${vehicles.filter((v) => v.status === 'In Transit').length} in transit`
    }),
    UI.kpiCard({
      label: 'Dispatched Tonnage', value: UI.num(k.tonnage, 2), unit: 't',
      icon: 'fa-weight-hanging', tone: 'green',
      pct: Math.min(100, k.tonnage * 4),
      foot: `${k.dispatchCount} manifest${k.dispatchCount === 1 ? '' : 's'} generated to date`
    }),
    UI.kpiCard({
      label: I18N.t('critical_supply_gap', 'Urgent Supplies Pending'),
      value: UI.num(k.urgentUnits), unit: 'units',
      icon: 'fa-kit-medical', tone: 'red',
      pct: Math.min(100, k.urgentUnits / 12),
      foot: `Urgency &ge; 8 across ${supplies.filter((s) => (Number(s.urgency) || 0) >= 8).length} supply lines`
    }),
    UI.kpiCard({
      label: 'NER Accessibility Index',
      value: `${activeDistrict.connectivityPct}%`, unit: '',
      icon: 'fa-route', tone: 'violet',
      pct: activeDistrict.connectivityPct,
      foot: `${activeDistrict.openRoutes} open / ${activeDistrict.totalRoutes} total routes in ${activeDistrict.name}`
    })
  ].join('');

  /* ---------------- District Connectivity Section ---------------- */
  const districtOptions = Object.keys(allDistricts).map((dKey) => {
    const d = allDistricts[dKey];
    return `<option value="${dKey}" ${dKey === activeDistrict.name ? 'selected' : ''}>${d.name} (${d.state}) — ${d.connectivityPct}% Conn.</option>`;
  }).join('');

  const corridorRows = (activeDistrict.keyCorridors || []).map((c) => {
    let badgeCls = 'badge-stable';
    if (c.status.includes('Closed')) badgeCls = 'badge-critical';
    else if (c.status.includes('Partial')) badgeCls = 'badge-high';
    else if (c.status.includes('Risk')) badgeCls = 'badge-moderate';

    return `<div class="p-3 rounded-xl bg-white border hairline flex flex-wrap items-center justify-between gap-2">
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2">
          <span class="text-xs font-semibold text-[#1d1d1f]">${UI.esc(c.name)}</span>
          <span class="badge ${badgeCls} text-[10px] py-0">${UI.esc(c.status)}</span>
        </div>
        <p class="text-[11px] text-[#7a7a7a] mt-0.5">${UI.esc(c.type)}</p>
      </div>
      <div class="text-right">
        <span class="text-[11px] text-[#7a7a7a]">Delay:</span>
        <span class="font-mono-num text-xs font-bold ${c.delay === 'None' ? 'text-emerald-600' : 'text-amber-600'}">${UI.esc(c.delay)}</span>
      </div>
    </div>`;
  }).join('');

  const vehicleTags = (activeDistrict.operatingVehicles || []).map((vId) => {
    const isHelo = vId.includes('HELO');
    const isMule = vId.includes('MULE');
    const icon = isHelo ? 'fa-helicopter' : (isMule ? 'fa-horse' : 'fa-truck-front');
    return `<span class="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-sky-950/60 border border-sky-500/30 text-[0.7rem] font-mono-num text-sky-200">
      <i class="fa-solid ${icon} text-sky-400"></i>${vId}
    </span>`;
  }).join('');

  /* ---------------- Logistics Bottleneck & Supply-Chain Gap Section ---------------- */
  const bottlenecks = activeDistrict.bottlenecks || [];
  const gapRows = bottlenecks.length ? bottlenecks.map((b) => {
    const isCrit = b.priority === 'CRITICAL';
    return `<tr class="${isCrit ? 'bg-red-950/20' : ''}">
      <td>
        <span class="font-bold text-slate-200 text-xs">${UI.esc(b.location)}</span>
        <p class="text-[0.68rem] text-slate-500">${UI.esc(b.corridorImpact)}</p>
      </td>
      <td>
        <div class="flex items-center gap-1.5">
          ${UI.catDot(b.category || 'Equipment')}
          <span class="text-xs text-slate-300">${UI.esc(b.commodity)}</span>
        </div>
        <span class="font-mono-num text-[0.65rem] text-slate-500">${UI.esc(b.sku)}</span>
      </td>
      <td class="font-mono-num text-xs text-slate-300">${UI.num(b.required)} u</td>
      <td class="font-mono-num text-xs text-slate-300">${UI.num(b.available)} u</td>
      <td>
        <span class="font-mono-num text-xs font-bold text-red-400">-${UI.num(b.gap)} u</span>
      </td>
      <td>
        <span class="badge ${isCrit ? 'badge-critical' : 'badge-high'} text-[0.65rem]">${UI.esc(b.priority)}</span>
      </td>
      <td class="text-right">
        <button class="btn btn-xs btn-solve" data-solve-gap="${UI.esc(b.sku)}" data-site="${UI.esc(b.location)}" data-gap="${b.gap}">
          <i class="fa-solid fa-bolt"></i>${I18N.t('resolve_with_solver', 'Bridge Gap')}
        </button>
      </td>
    </tr>`;
  }).join('') : `<tr><td colspan="7" class="text-center py-6 text-sm text-slate-500">No critical supply-chain gaps detected in this sector. Buffer stocks normal.</td></tr>`;

  /* ---------------- Alert feed (Multilingual) ---------------- */
  const feedHtml = alerts.length ? alerts.map((rawA) => {
    const a = I18N.translateAlert(rawA);
    const lvl = String(rawA.level || 'Info').toLowerCase();
    const cls = lvl === 'critical' ? 'feed-critical' : (lvl === 'high' ? 'feed-high' : 'feed-info');
    return `<li class="feed-item ${cls}">
      <div class="flex items-start gap-2">
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <span class="font-semibold text-sm text-slate-100">${UI.esc(a.region)}</span>
            <span class="badge ${UI.statusBadgeClass(rawA.level)}">${UI.esc(a.level)}</span>
            ${rawA.has_photo ? `<span class="badge badge-stable text-[0.62rem] py-0"><i class="fa-solid fa-image mr-1"></i>Damage Photo</span>` : ''}
            <span class="text-[0.68rem] text-slate-500 ml-auto font-mono-num">${UI.timeAgo(rawA.created_ts)}</span>
          </div>
          <p class="text-[0.8rem] text-slate-400 mt-1 leading-snug">${UI.esc(a.message)}</p>
          ${rawA.photo_url ? `<div class="mt-2"><img src="${rawA.photo_url}" class="h-24 w-auto rounded-lg border border-slate-700 object-cover shadow" alt="Field Damage"></div>` : ''}
          ${rawA.requested ? `<p class="text-[0.7rem] text-sky-300/80 mt-1.5"><i class="fa-solid fa-clipboard-list mr-1"></i>${UI.esc(rawA.requested)}</p>` : ''}
        </div>
      </div>
    </li>`;
  }).join('') : `<li class="p-6 text-center text-sm text-slate-500">No incoming requests.</li>`;

  /* ---------------- Compose Main View ---------------- */
  outlet.innerHTML = `
    <!-- Top KPI row -->
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-5">${kpiHtml}</div>

    <!-- DISTRICT-WISE CONNECTIVITY (NER) -->
    <section class="panel p-5 mb-5 bg-white border hairline rounded-2xl">
      <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b hairline">
        <div>
          <div class="flex items-center gap-2">
            <i class="fa-solid fa-mountain-city text-[#0066cc] text-base"></i>
            <h3 class="font-semibold text-[#1d1d1f] text-base tracking-tight">${I18N.t('district_connectivity', 'District-Wise Connectivity (NER)')}</h3>
          </div>
          <p class="text-[12px] text-[#7a7a7a] mt-0.5 leading-snug">${I18N.t('district_connectivity_sub', 'Real-time accessibility, road status, vehicle presence and incident monitoring across NER districts')}</p>
        </div>
        <div class="flex items-center gap-2">
          <label class="text-[12px] text-[#7a7a7a] font-semibold" for="district-selector">${I18N.t('select_district', 'Select NER District')}:</label>
          <select id="district-selector" class="field text-xs py-1.5 px-3 w-auto bg-white border-[#d2d2d7] text-[#1d1d1f] font-semibold">
            ${districtOptions}
          </select>
          <button id="btn-report-field-incident" class="btn btn-primary btn-xs">
            <i class="fa-solid fa-camera"></i>${I18N.t('field_report_btn', 'Report Road Incident')}
          </button>
        </div>
      </div>

      <!-- District Metrics Grid -->
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 mt-4">
        <!-- Connectivity Meter -->
        <div class="panel-flat p-3.5 flex flex-col justify-between bg-[#f5f5f7] border hairline rounded-xl">
          <p class="text-[11px] text-[#7a7a7a] font-semibold uppercase tracking-wider">${I18N.t('connectivity_pct', 'Connectivity Score')}</p>
          <div class="my-2">
            <div class="flex items-baseline justify-between mb-1">
              <span class="text-2xl font-bold font-mono-num ${activeDistrict.connectivityPct >= 80 ? 'text-emerald-600' : (activeDistrict.connectivityPct >= 65 ? 'text-amber-600' : 'text-red-600')}">${activeDistrict.connectivityPct}%</span>
              <span class="text-[11px] text-[#7a7a7a]">${activeDistrict.openRoutes}/${activeDistrict.totalRoutes} Open</span>
            </div>
            <div class="spark-bar">
              <div class="spark-fill" style="width:${activeDistrict.connectivityPct}%;background:${activeDistrict.connectivityPct >= 80 ? '#34c759' : (activeDistrict.connectivityPct >= 65 ? '#ff9500' : '#ff3b30')}"></div>
            </div>
          </div>
          <p class="text-[11px] text-[#7a7a7a]">${activeDistrict.terrain}</p>
        </div>

        <!-- Route Breakdown -->
        <div class="panel-flat p-3.5 bg-[#f5f5f7] border hairline rounded-xl">
          <p class="text-[11px] text-[#7a7a7a] font-semibold uppercase tracking-wider mb-2">Route Status Breakdown</p>
          <div class="space-y-1 text-xs">
            <div class="flex justify-between"><span class="text-emerald-600 font-medium">● Open</span><span class="font-mono-num font-bold text-[#1d1d1f]">${activeDistrict.openRoutes}</span></div>
            <div class="flex justify-between"><span class="text-amber-600 font-medium">● Partially Blocked</span><span class="font-mono-num font-bold text-[#1d1d1f]">${activeDistrict.partialRoutes}</span></div>
            <div class="flex justify-between"><span class="text-red-600 font-medium">● Closed / Blocked</span><span class="font-mono-num font-bold text-[#1d1d1f]">${activeDistrict.closedRoutes}</span></div>
            <div class="flex justify-between"><span class="text-orange-600 font-medium">● High Risk Alert</span><span class="font-mono-num font-bold text-[#1d1d1f]">${activeDistrict.highRiskRoutes}</span></div>
          </div>
        </div>

        <!-- Active Incidents -->
        <div class="panel-flat p-3.5 flex flex-col justify-between bg-[#f5f5f7] border hairline rounded-xl">
          <p class="text-[11px] text-[#7a7a7a] font-semibold uppercase tracking-wider">${I18N.t('active_incidents', 'Active Incidents')}</p>
          <div class="my-1">
            <span class="text-2xl font-bold font-mono-num text-red-600">${activeDistrict.activeIncidentsCount}</span>
            <span class="text-xs text-[#7a7a7a] ml-1">landslides / blockages</span>
          </div>
          <p class="text-[11px] text-[#7a7a7a]">Live field patrols transmitting</p>
        </div>

        <!-- Average Delay -->
        <div class="panel-flat p-3.5 flex flex-col justify-between bg-[#f5f5f7] border hairline rounded-xl">
          <p class="text-[11px] text-[#7a7a7a] font-semibold uppercase tracking-wider">${I18N.t('avg_delay', 'Average Transit Delay')}</p>
          <div class="my-1">
            <span class="text-2xl font-bold font-mono-num text-amber-600">+${activeDistrict.avgDelayHours}h</span>
            <span class="text-xs text-[#7a7a7a] ml-1">over baseline</span>
          </div>
          <p class="text-[11px] text-[#7a7a7a]">Mountain detour transit penalty</p>
        </div>

        <!-- Operating Vehicles -->
        <div class="panel-flat p-3.5 bg-[#f5f5f7] border hairline rounded-xl">
          <p class="text-[11px] text-[#7a7a7a] font-semibold uppercase tracking-wider mb-2">${I18N.t('vehicles_operating', 'Operating Vehicles')} (${activeDistrict.operatingVehicles.length})</p>
          <div class="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
            ${vehicleTags}
          </div>
        </div>
      </div>

      <!-- District Key Corridors -->
      <div class="mt-4 pt-3 border-t hairline">
        <p class="text-[12px] font-semibold text-[#1d1d1f] mb-2 flex items-center gap-1.5">
          <i class="fa-solid fa-road text-[#0066cc]"></i>Key Arterial &amp; Relief Corridors in ${activeDistrict.name}
        </p>
        <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          ${corridorRows}
        </div>
      </div>
    </section>

    <!-- LOGISTICS BOTTLENECK & SUPPLY-CHAIN GAP ANALYSIS -->
    <section class="panel p-5 mb-5 bg-white border hairline rounded-2xl">
      <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b hairline">
        <div>
          <div class="flex items-center gap-2">
            <i class="fa-solid fa-triangle-exclamation text-amber-500 text-base"></i>
            <h3 class="font-semibold text-[#1d1d1f] text-base tracking-tight">${I18N.t('bottleneck_analysis', 'Logistics Bottlenecks & Supply-Chain Gap Analysis')}</h3>
            <span class="badge badge-critical text-[11px]">${bottlenecks.filter((b) => b.priority === 'CRITICAL').length} Critical Deficits</span>
          </div>
          <p class="text-[12px] text-[#7a7a7a] mt-0.5 leading-snug">${I18N.t('bottleneck_sub', 'Real-time inventory deficit, blocked corridors, and vehicle shortage detection')}</p>
        </div>
        <a href="#/optimizer" class="btn btn-solve btn-xs">
          <i class="fa-solid fa-bolt"></i>${I18N.t('auto_bridge_gap', 'Auto-Plan Relief for Gaps')}
        </a>
      </div>

      <!-- Gap Table -->
      <div class="table-scroll rounded-xl border hairline mt-4">
        <table class="data-table">
          <thead>
            <tr>
              <th>${I18N.t('location', 'Location / Corridor')}</th>
              <th>${I18N.t('commodity', 'Commodity / SKU')}</th>
              <th>${I18N.t('required', 'Required')}</th>
              <th>${I18N.t('available', 'Available')}</th>
              <th>${I18N.t('gap', 'Supply Gap')}</th>
              <th>${I18N.t('priority', 'Priority')}</th>
              <th class="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            ${gapRows}
          </tbody>
        </table>
      </div>
    </section>


    <!-- LIVE VEHICLE GPS TELEMETRY STREAM -->
    <section class="panel p-5 mb-6 bg-white border hairline rounded-2xl shadow-sm">
      <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b hairline">
        <div>
          <div class="flex items-center gap-2">
            <i class="fa-solid fa-satellite-dish text-[#0066cc] text-base animate-pulse"></i>
            <h3 class="font-semibold text-[#1d1d1f] text-base tracking-tight">Live Fleet GPS Telemetry Stream</h3>
            <span class="badge badge-stable text-[11px]"><span class="status-dot dot-live mr-1"></span>Satellite Polling Active</span>
          </div>
          <p class="text-[12px] text-[#7a7a7a] mt-0.5 leading-snug">Real-time coordinates, doppler speed, barometric altitude, and battery reserve across relief assets</p>
        </div>
        <a href="#/map" class="btn btn-primary btn-xs">
          <i class="fa-solid fa-map-location-dot"></i>Track on GIS Map
        </a>
      </div>

      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 mt-4" id="dash-telemetry-grid"></div>
    </section>

    <!-- Priority Queue & Live Multilingual Alerts -->
    <div class="grid gap-5 xl:grid-cols-3">
      <!-- Destination Priority Queue -->
      <section class="panel p-5 bg-white border hairline rounded-2xl xl:col-span-2">
        ${UI.sectionHead('Destination Priority Queue', 'Ranked by dynamic priority index — (Urgency × 0.6) + (Severity ÷ Transit × 0.4)',
          `<a href="#/map" class="btn btn-ghost btn-xs"><i class="fa-solid fa-map-location-dot"></i>Map</a>`)}
        <div class="table-scroll rounded-xl border hairline">
          <table class="data-table">
            <thead><tr>
              <th>Site</th><th>Status</th><th>Urgency</th><th>Transit</th><th>Affected</th><th>Priority idx</th><th></th>
            </tr></thead>
            <tbody>
              ${sites.map((s) => {
                const pIdx = OptiSolver.priorityIndex(s.urgency, s.need_severity, s.transport_time);
                return `<tr>
                  <td class="font-semibold text-[#1d1d1f]">${UI.esc(s.site_name)}</td>
                  <td><span class="badge ${UI.statusBadgeClass(s.status)}">${UI.esc(s.status)}</span></td>
                  <td class="font-mono-num text-[#1d1d1f]">${UI.num(s.urgency)}</td>
                  <td class="font-mono-num text-[#7a7a7a]">${UI.num(s.transport_time, 1)} h</td>
                  <td class="font-mono-num text-[#1d1d1f]">${UI.num(s.population)}</td>
                  <td>
                    <div class="flex items-center gap-2">
                      <span class="font-mono-num text-[#1d1d1f] font-semibold">${UI.num(pIdx, 2)}</span>
                      <span class="spark-bar w-16 hidden sm:inline-block">
                        <span class="spark-fill block" style="width:${Math.min(100, pIdx * 10)}%;background:${UI.urgencyColor(s.urgency)}"></span>
                      </span>
                    </div>
                  </td>
                  <td class="text-right">
                    <a href="#/optimizer" class="btn btn-xs btn-primary" data-target-site="${UI.esc(s.id)}">
                      <i class="fa-solid fa-bolt"></i>Plan
                    </a>
                  </td>
                </tr>`;
              }).join('') || `<tr><td colspan="7" class="text-center text-[#7a7a7a] py-8">No disaster sites registered.</td></tr>`}
            </tbody>
          </table>
        </div>
      </section>

      <!-- Multilingual Alert Feed -->
      <section class="panel p-5 bg-white border hairline rounded-2xl overflow-hidden">
        <div>
          ${UI.sectionHead(I18N.t('live_alerts', 'Multilingual Alerts'), 'Incoming field sitreps & warnings',
            `<span class="badge badge-critical"><i class="fa-solid fa-tower-broadcast mr-1"></i>${alerts.filter((a) => a.level === 'Critical').length} critical</span>`)}
        </div>
        <ul class="space-y-2 mt-3 max-h-[420px] overflow-y-auto pr-1">${feedHtml}</ul>
      </section>
    </div>
  `;

  /* ---------------- Interactive Bindings ---------------- */

  // District selector change
  const distSelect = outlet.querySelector('#district-selector');
  if (distSelect) {
    distSelect.addEventListener('change', (e) => {
      distEngine.setDistrict(e.target.value);
    });
  }

  // Field incident report button
  const reportBtn = outlet.querySelector('#btn-report-field-incident');
  if (reportBtn) {
    reportBtn.addEventListener('click', () => {
      if (window.RBAC) {
        window.RBAC.openIncidentReporter(activeDistrict.name);
      }
    });
  }

  // One-click resolve supply gap button
  outlet.querySelectorAll('[data-solve-gap]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const sku = btn.dataset.solveGap;
      const site = btn.dataset.site;
      const gap = btn.dataset.gap;
      distEngine.loadGapIntoOptimizer({
        sku,
        location: site,
        gap: Number(gap) || 100,
        priority: 'CRITICAL',
        commodity: sku
      });
    });
  });

  // Deep-link "Plan" buttons for disaster sites
  outlet.querySelectorAll('[data-target-site]').forEach((btn) => {
    btn.addEventListener('click', () => {
      Views.optimizerPreset = { siteId: btn.dataset.targetSite };
    });
  });

  /* ---------------- Live Telemetry Subscription ---------------- */
  const telemetryGrid = outlet.querySelector('#dash-telemetry-grid');
  function updateDashboardTelemetry(fleet) {
    if (!telemetryGrid) return;
    telemetryGrid.innerHTML = fleet.map((v) => {
      const isHelo = v.type === 'Helicopter';
      const isMule = v.type.includes('Mule');
      const icon = isHelo ? 'fa-helicopter text-[#0066cc]' : (isMule ? 'fa-horse text-amber-600' : 'fa-truck-fast text-emerald-600');
      return `
        <div class="panel-flat p-3.5 flex flex-col justify-between cursor-pointer hover:bg-[#f0f0f2] transition border hairline bg-[#f5f5f7] rounded-xl shadow-sm btn-open-hud" data-vid="${v.id}">
          <div class="flex items-center gap-2">
            <i class="fa-solid ${icon} text-sm"></i>
            <span class="font-extrabold text-[#1d1d1f] text-xs font-mono-num">${UI.esc(v.code)}</span>
            <span class="ml-auto font-mono-num text-[0.68rem] text-[#0066cc] font-bold">${v.speedKmh} km/h</span>
          </div>
          <div class="my-1.5 text-[0.68rem] text-[#6e6e73]">
            <p class="truncate font-semibold text-[#1d1d1f]">→ ${UI.esc(v.destination)}</p>
            <p class="font-mono-num text-[#7c3aed] mt-0.5 font-medium">${v.alt}m Alt · ${v.batteryFuelPct}% Fuel</p>
          </div>
          <div class="w-full bg-[#e5e5ea] rounded-full h-1.5 overflow-hidden">
            <div class="h-full bg-[#0066cc]" style="width: ${Math.round(v.progress * 100)}%"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  let unsubTracker = () => {};
  if (window.LiveVehicleTracker) {
    unsubTracker = window.LiveVehicleTracker.subscribe(updateDashboardTelemetry);
    updateDashboardTelemetry(window.LiveVehicleTracker.getFleet());
  }

  return () => {
    try { unsubTracker(); } catch (e) {}
  };
};

