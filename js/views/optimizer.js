/* ==========================================================================
   OptiRelief — Interactive Optimization & Manifest Generator
   ========================================================================== */

window.Views = window.Views || {};
Views.optimizerPreset = null;

Views.optimizer = function (outlet) {
  const vehicles = App.state.vehicles;
  const supplies = App.state.supplies;
  const sites = App.disasterSites();

  // Local view state
  const sel = {
    vehicleIds: new Set(
      vehicles.filter((v) => v.status === 'Available').slice(0, 2).map((v) => v.id)
    ),
    siteId: (Views.optimizerPreset && Views.optimizerPreset.siteId) ||
            (sites.sort((a, b) => (b.urgency || 0) - (a.urgency || 0))[0] || {}).id,
    categories: new Set(UI.CATEGORIES),
    strategy: 'balanced',
    urgencyFloor: 1,
    activeLoadIdx: 0,
    gapPrefill: window.SESSION_OPTIMIZER_PREFILL || null
  };
  Views.optimizerPreset = null;
  window.SESSION_OPTIMIZER_PREFILL = null;

  /* --------------------------------------------------------- static shell */

  const gapBannerHtml = sel.gapPrefill ? `
    <div class="panel-flat p-3 mb-4 border-amber-500/40 bg-amber-950/20 flex items-start gap-2.5 animate-fadeIn">
      <i class="fa-solid fa-bolt text-amber-400 mt-0.5"></i>
      <div class="text-xs">
        <p class="font-bold text-amber-200">Supply-Chain Gap Resolution Mode</p>
        <p class="text-slate-300">Targeting <span class="font-semibold text-white">${UI.esc(sel.gapPrefill.commodity)}</span> (Deficit: <span class="font-mono-num font-bold text-red-400">-${sel.gapPrefill.requiredGap} units</span>) for <span class="text-white font-semibold">${UI.esc(sel.gapPrefill.targetSiteName)}</span>.</p>
      </div>
    </div>` : '';

  outlet.innerHTML = `
    <div class="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">

      <!-- ============ Control panel ============ -->
      <section class="panel p-4 self-start xl:sticky xl:top-[86px]">
        ${gapBannerHtml}
        ${UI.sectionHead('Solver Control Panel', 'Constraints and destination weighting')}

        <div class="space-y-4">
          <div>
            <label class="field-label" for="dest-select">Destination site</label>
            <select class="field" id="dest-select">
              ${sites.map((s) => `<option value="${UI.esc(s.id)}"${s.id === sel.siteId ? ' selected' : ''}>
                ${UI.esc(s.site_name)} — U${UI.num(s.urgency)} · ${UI.num(s.transport_time, 1)}h</option>`).join('')}
            </select>
            <div id="dest-meta" class="grid grid-cols-3 gap-2 mt-2"></div>
          </div>

          <div>
            <label class="field-label" for="strategy-select">Optimization strategy</label>
            <select class="field" id="strategy-select">
              <option value="balanced">Balanced (weight + cube density)</option>
              <option value="urgency">Urgency first (strict priority)</option>
              <option value="weight">Weight-efficient (payload limited)</option>
              <option value="volume">Cube-efficient (volume limited)</option>
            </select>
          </div>

          <div>
            <label class="field-label" for="urgency-floor">Minimum item urgency
              <span id="urgency-floor-val" class="text-sky-300 font-mono-num ml-1">1</span></label>
            <input type="range" id="urgency-floor" min="1" max="10" step="1" value="1" class="w-full accent-sky-500">
          </div>

          <div>
            <p class="field-label">Supply categories</p>
            <div id="cat-filters" class="flex flex-wrap gap-1.5">
              ${UI.CATEGORIES.map((c) => `<button class="btn btn-xs cat-filter" data-cat="${c}"
                style="border-color:${UI.CAT_COLORS[c]}66;background:${UI.CAT_COLORS[c]}22;color:#e2e8f0">
                ${UI.catDot(c)}${c}</button>`).join('')}
            </div>
          </div>

          <div>
            <div class="flex items-center gap-2 mb-2">
              <p class="field-label !mb-0">Transport assets</p>
              <button id="sel-all-veh" class="btn btn-ghost btn-xs ml-auto">All available</button>
            </div>
            <div id="vehicle-picker" class="space-y-1.5 max-h-64 overflow-y-auto pr-1"></div>
          </div>

          <div id="capacity-readout" class="panel-flat p-3"></div>

          <button id="run-solver" class="btn btn-solve w-full !py-3 text-[0.92rem]">
            <i class="fa-solid fa-bolt"></i>Run Optimization Solver
          </button>
          <p class="text-[0.68rem] text-slate-500 text-center leading-snug">
            Greedy multi-knapsack fill with extreme-point 3D placement.
            Runs locally — works with no connectivity.
          </p>
        </div>
      </section>

      <!-- ============ Results ============ -->
      <section class="min-w-0 space-y-5" id="result-zone">
        <div class="panel">
          ${UI.emptyState('fa-boxes-packing', 'No manifest generated yet',
            'Choose a destination and transport assets, then run the solver to compute an optimal load plan with 3D packing coordinates.')}
        </div>
      </section>
    </div>`;

  /* -------------------------------------------------------- picker render */

  function renderVehiclePicker() {
    const host = document.getElementById('vehicle-picker');
    if (!vehicles.length) {
      host.innerHTML = `<p class="text-xs text-slate-500">No fleet assets. Add them under Fleet Assets.</p>`;
      return;
    }
    host.innerHTML = vehicles.map((v) => {
      const on = sel.vehicleIds.has(v.id);
      const usable = v.status !== 'Maintenance';
      return `<label class="flex items-center gap-2.5 p-2 rounded-lg border cursor-pointer transition
        ${on ? 'border-sky-500/50 bg-sky-500/10' : 'hairline bg-slate-900/40'}
        ${usable ? '' : 'opacity-50'}">
        <input type="checkbox" class="veh-check accent-sky-500" value="${UI.esc(v.id)}"
          ${on ? 'checked' : ''} ${usable ? '' : 'disabled'}>
        <i class="fa-solid ${UI.VEHICLE_ICONS[v.type] || 'fa-truck'} text-sky-400 text-xs w-4"></i>
        <span class="text-xs font-semibold text-slate-200">${UI.esc(v.vehicle_code)}</span>
        <span class="text-[0.66rem] text-slate-500 font-mono-num ml-auto">
          ${UI.num(v.max_weight)}kg · ${UI.num(v.max_volume, 1)}m³
        </span>
      </label>`;
    }).join('');

    host.querySelectorAll('.veh-check').forEach((cb) => {
      cb.addEventListener('change', () => {
        if (cb.checked) sel.vehicleIds.add(cb.value);
        else sel.vehicleIds.delete(cb.value);
        renderVehiclePicker();
        renderCapacity();
      });
    });
  }

  function renderDestMeta() {
    const s = App.siteById(sel.siteId);
    const host = document.getElementById('dest-meta');
    if (!s) { host.innerHTML = ''; return; }
    const pIdx = OptiSolver.priorityIndex(s.urgency, s.need_severity, s.transport_time);
    host.innerHTML = `
      <div class="panel-flat p-2 text-center"><p class="text-[0.6rem] uppercase text-slate-500 tracking-wider">Urgency</p>
        <p class="font-mono-num text-sm font-bold" style="color:${UI.urgencyColor(s.urgency)}">${UI.num(s.urgency)}</p></div>
      <div class="panel-flat p-2 text-center"><p class="text-[0.6rem] uppercase text-slate-500 tracking-wider">Severity</p>
        <p class="font-mono-num text-sm font-bold text-slate-200">${UI.num(s.need_severity)}</p></div>
      <div class="panel-flat p-2 text-center"><p class="text-[0.6rem] uppercase text-slate-500 tracking-wider">P-Index</p>
        <p class="font-mono-num text-sm font-bold text-amber-300">${UI.num(pIdx, 2)}</p></div>`;
  }

  function pickedVehicles() {
    return vehicles.filter((v) => sel.vehicleIds.has(v.id) && v.status !== 'Maintenance');
  }

  function eligibleSupplies() {
    return supplies.filter((s) =>
      sel.categories.has(s.category || 'Equipment') &&
      (Number(s.urgency) || 0) >= sel.urgencyFloor &&
      (Number(s.qty_available) || 0) > 0
    );
  }

  function renderCapacity() {
    const picked = pickedVehicles();
    const capW = picked.reduce((s, v) => s + (Number(v.max_weight) || 0), 0);
    const capV = picked.reduce((s, v) => s + (Number(v.max_volume) || 0), 0);
    const pool = eligibleSupplies();
    const poolW = pool.reduce((s, x) => s + (Number(x.qty_available) || 0) * (Number(x.unit_weight) || 0), 0);
    const poolU = pool.reduce((s, x) => s + (Number(x.qty_available) || 0), 0);

    document.getElementById('capacity-readout').innerHTML = `
      <div class="grid grid-cols-2 gap-2.5 text-[0.72rem]">
        <div><p class="text-slate-500">Fleet payload</p><p class="font-mono-num text-slate-100 font-semibold">${UI.fmtKg(capW)}</p></div>
        <div><p class="text-slate-500">Fleet cube</p><p class="font-mono-num text-slate-100 font-semibold">${UI.num(capV, 1)} m³</p></div>
        <div><p class="text-slate-500">Eligible stock</p><p class="font-mono-num text-slate-100 font-semibold">${UI.num(poolU)} units</p></div>
        <div><p class="text-slate-500">Stock weight</p><p class="font-mono-num text-slate-100 font-semibold">${UI.fmtKg(poolW)}</p></div>
      </div>
      ${capW > 0 && poolW > capW
        ? `<p class="text-[0.68rem] text-amber-300/90 mt-2 leading-snug"><i class="fa-solid fa-triangle-exclamation mr-1"></i>Demand exceeds fleet capacity — solver will triage by priority.</p>`
        : ''}
      ${!picked.length ? `<p class="text-[0.68rem] text-red-300/90 mt-2"><i class="fa-solid fa-circle-exclamation mr-1"></i>Select at least one asset.</p>` : ''}`;

    document.getElementById('run-solver').disabled = !picked.length || !pool.length;
  }

  function paintCatFilters() {
    outlet.querySelectorAll('.cat-filter').forEach((b) => {
      const on = sel.categories.has(b.dataset.cat);
      b.style.opacity = on ? '1' : '0.34';
      b.style.filter = on ? 'none' : 'grayscale(0.7)';
    });
  }

  /* ------------------------------------------------------------- bindings */

  document.getElementById('dest-select').addEventListener('change', (e) => {
    sel.siteId = e.target.value;
    renderDestMeta();
  });

  document.getElementById('strategy-select').addEventListener('change', (e) => {
    sel.strategy = e.target.value;
  });

  const floorInput = document.getElementById('urgency-floor');
  floorInput.addEventListener('input', (e) => {
    sel.urgencyFloor = Number(e.target.value);
    document.getElementById('urgency-floor-val').textContent = e.target.value;
    renderCapacity();
  });

  outlet.querySelectorAll('.cat-filter').forEach((b) => {
    b.addEventListener('click', () => {
      const c = b.dataset.cat;
      if (sel.categories.has(c)) sel.categories.delete(c);
      else sel.categories.add(c);
      if (!sel.categories.size) sel.categories.add(c); // never allow empty
      paintCatFilters();
      renderCapacity();
    });
  });

  document.getElementById('sel-all-veh').addEventListener('click', () => {
    const avail = vehicles.filter((v) => v.status === 'Available');
    const allOn = avail.every((v) => sel.vehicleIds.has(v.id));
    avail.forEach((v) => { if (allOn) sel.vehicleIds.delete(v.id); else sel.vehicleIds.add(v.id); });
    renderVehiclePicker();
    renderCapacity();
  });

  document.getElementById('run-solver').addEventListener('click', runSolver);

  renderVehiclePicker();
  renderDestMeta();
  paintCatFilters();
  renderCapacity();

  /* ------------------------------------------------------------ run solver */

  async function runSolver() {
    const btn = document.getElementById('run-solver');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>Solving…';

    // Yield a frame so the spinner paints before the synchronous solve.
    await new Promise((r) => setTimeout(r, 60));

    const dest = App.siteById(sel.siteId) || { site_name: 'Unassigned', urgency: 5, need_severity: 5, transport_time: 2 };
    let result;
    try {
      result = OptiSolver.optimizeAllocation(pickedVehicles(), eligibleSupplies(), dest, { strategy: sel.strategy });
    } catch (err) {
      console.error(err);
      UI.toast('Solver failed: ' + err.message, 'error');
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-bolt"></i>Run Optimization Solver';
      return;
    }

    App.state.lastResult = result;
    sel.activeLoadIdx = result.loads.findIndex((l) => l.unit_count > 0);
    if (sel.activeLoadIdx < 0) sel.activeLoadIdx = 0;

    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-rotate-right"></i>Re-run Solver';
    renderResults(result);
    UI.toast(`Manifest ${result.manifest_ref} — ${result.summary.units_packed} units, ${UI.num(result.summary.efficiency, 1)}% efficiency`, 'success', 4500);
  }

  /* -------------------------------------------------------- render results */

  function renderResults(res) {
    const s = res.summary;
    const zone = document.getElementById('result-zone');

    const catLegend = Object.entries(s.by_category).map(([c, d]) =>
      `<button class="btn btn-xs viz-cat-toggle" data-cat="${c}"
        style="border-color:${d.color}66;background:${d.color}22">
        ${UI.catDot(c)}<span>${c}</span>
        <span class="font-mono-num text-slate-400 ml-1">${d.units}</span>
      </button>`).join('');

    zone.innerHTML = `
      <!-- Summary -->
      <div class="panel p-4">
        ${UI.sectionHead(`Manifest ${res.manifest_ref}`,
          `${res.destination.site_name} · ${res.strategy} strategy · solved in ${s.solve_ms} ms`,
          `<button id="export-csv" class="btn btn-ghost btn-xs"><i class="fa-solid fa-file-csv"></i>CSV</button>
           <button id="export-print" class="btn btn-ghost btn-xs"><i class="fa-solid fa-print"></i>PDF / Print</button>
           <button id="queue-dispatch" class="btn btn-primary btn-xs"><i class="fa-solid fa-paper-plane"></i>Queue Dispatch</button>`)}

        <div class="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <div class="panel-flat p-3">
            <p class="kpi-label">Weight used</p>
            <p class="font-mono-num text-lg font-bold text-white mt-1">${UI.fmtKg(s.total_weight)}</p>
            <div class="spark-bar mt-2"><div class="spark-fill" style="width:${Math.min(100, s.weight_util)}%;background:#22c55e"></div></div>
            <p class="text-[0.66rem] text-slate-500 mt-1">${UI.num(s.weight_util, 1)}% of ${UI.fmtKg(s.capacity_weight)}</p>
          </div>
          <div class="panel-flat p-3">
            <p class="kpi-label">Volume used</p>
            <p class="font-mono-num text-lg font-bold text-white mt-1">${UI.num(s.total_volume, 2)} m³</p>
            <div class="spark-bar mt-2"><div class="spark-fill" style="width:${Math.min(100, s.volume_util)}%;background:#38bdf8"></div></div>
            <p class="text-[0.66rem] text-slate-500 mt-1">${UI.num(s.volume_util, 1)}% of ${UI.num(s.capacity_volume, 1)} m³</p>
          </div>
          <div class="panel-flat p-3">
            <p class="kpi-label">Hi-priority coverage</p>
            <p class="font-mono-num text-lg font-bold text-emerald-300 mt-1">${UI.num(s.high_priority_coverage, 1)}%</p>
            <div class="spark-bar mt-2"><div class="spark-fill" style="width:${Math.min(100, s.high_priority_coverage)}%;background:#10b981"></div></div>
            <p class="text-[0.66rem] text-slate-500 mt-1">Urgency ≥ 8 stock loaded</p>
          </div>
          <div class="panel-flat p-3">
            <p class="kpi-label">Efficiency score</p>
            <p class="font-mono-num text-lg font-bold text-amber-300 mt-1">${UI.num(s.efficiency, 1)}%</p>
            <div class="spark-bar mt-2"><div class="spark-fill" style="width:${Math.min(100, s.efficiency)}%;background:#f59e0b"></div></div>
            <p class="text-[0.66rem] text-slate-500 mt-1">${s.units_packed} units · ${s.vehicles_used}/${s.vehicles_selected} assets</p>
          </div>
        </div>
      </div>

      <!-- 3D visualiser -->
      <div class="panel p-4">
        ${UI.sectionHead('3D Cargo Bed Visualiser', 'Drag to orbit · scroll or pinch to zoom · click a box for details',
          `<div class="flex gap-1">
            <button class="btn btn-ghost btn-xs" data-view="iso">Iso</button>
            <button class="btn btn-ghost btn-xs" data-view="top">Top</button>
            <button class="btn btn-ghost btn-xs" data-view="side">Side</button>
            <button class="btn btn-ghost btn-xs" data-view="front">Front</button>
          </div>`)}

        <div id="load-tabs" class="flex flex-wrap gap-1.5 mb-3"></div>

        <div id="packing-canvas-host">
          <div class="viz-overlay" style="top:.6rem;left:.6rem">
            <span id="viz-dims" class="font-mono-num"></span>
          </div>
          <div class="viz-overlay" style="bottom:.6rem;left:.6rem" id="viz-hint">
            <i class="fa-solid fa-hand-pointer mr-1"></i>Click a crate to inspect
          </div>
          <div class="viz-overlay hidden" style="top:.6rem;right:.6rem;max-width:210px;pointer-events:auto" id="viz-detail"></div>
        </div>

        <div class="flex flex-wrap items-center gap-1.5 mt-3">
          <span class="text-[0.68rem] text-slate-500 mr-1">Toggle:</span>${catLegend}
          <div class="ml-auto flex gap-1">
            <button class="btn btn-ghost btn-xs" id="zoom-in"><i class="fa-solid fa-magnifying-glass-plus"></i></button>
            <button class="btn btn-ghost btn-xs" id="zoom-out"><i class="fa-solid fa-magnifying-glass-minus"></i></button>
          </div>
        </div>
      </div>

      <!-- Manifest detail -->
      <div class="grid gap-5 lg:grid-cols-2">
        <div class="panel p-4">
          ${UI.sectionHead('Packing Order', 'Sequence in which crates are loaded')}
          <div class="table-scroll rounded-xl border hairline" style="max-height:340px">
            <table class="data-table">
              <thead><tr><th>#</th><th>Item</th><th>Cat</th><th>Coords (x,y,z)</th><th>Kg</th></tr></thead>
              <tbody id="packing-order-body"></tbody>
            </table>
          </div>
        </div>

        <div class="panel p-4">
          ${UI.sectionHead('Unallocated Items', `${s.unallocated_lines} line(s) could not be loaded`)}
          <div class="table-scroll rounded-xl border hairline" style="max-height:340px">
            <table class="data-table">
              <thead><tr><th>Item</th><th>Cat</th><th>Short</th><th>P-idx</th></tr></thead>
              <tbody>${res.unallocated.length ? res.unallocated.map((u) => `<tr>
                <td class="text-slate-200">${UI.esc(u.name)}</td>
                <td>${UI.catDot(u.category)} <span class="text-[0.72rem] text-slate-400">${UI.esc(u.category)}</span></td>
                <td class="font-mono-num text-amber-300">${UI.num(u.qty_unallocated)} / ${UI.num(u.qty_requested)}</td>
                <td class="font-mono-num text-slate-400">${UI.num(u.priority, 2)}</td>
              </tr>`).join('')
              : `<tr><td colspan="4" class="text-center text-emerald-300/80 py-8">
                  <i class="fa-solid fa-circle-check mr-1"></i>All eligible stock allocated</td></tr>`}
              </tbody>
            </table>
          </div>
        </div>
      </div>`;

    renderLoadTabs(res);
    bindResultActions(res);
    showLoad(res, sel.activeLoadIdx);
  }

  function renderLoadTabs(res) {
    const host = document.getElementById('load-tabs');
    host.innerHTML = res.loads.map((l, i) => `
      <button class="btn btn-xs load-tab ${i === sel.activeLoadIdx ? 'btn-primary' : 'btn-ghost'}" data-idx="${i}">
        <i class="fa-solid ${UI.VEHICLE_ICONS[l.vehicle_type] || 'fa-truck'}"></i>
        ${UI.esc(l.vehicle_code)}
        <span class="font-mono-num opacity-75 ml-1">${l.unit_count}u · ${UI.num(l.volume_util, 0)}%</span>
      </button>`).join('');
    host.querySelectorAll('.load-tab').forEach((b) => {
      b.addEventListener('click', () => {
        sel.activeLoadIdx = Number(b.dataset.idx);
        renderLoadTabs(res);
        showLoad(res, sel.activeLoadIdx);
      });
    });
  }

  /* ------------------------------------------------------- show one load */

  function showLoad(res, idx) {
    const load = res.loads[idx];
    if (!load) return;
    const host = document.getElementById('packing-canvas-host');

    document.getElementById('viz-dims').textContent =
      `${load.vehicle_code} · ${load.container.length}×${load.container.width}×${load.container.height} m · ` +
      `${UI.num(load.used_weight)}kg (${UI.num(load.weight_util, 0)}%) · ${UI.num(load.used_volume, 2)}m³ (${UI.num(load.volume_util, 0)}%)`;

    // Packing order table
    const body = document.getElementById('packing-order-body');
    body.innerHTML = load.boxes.length ? load.boxes.map((b) => `<tr class="cursor-pointer pack-row" data-seq="${b.seq}">
      <td class="font-mono-num text-slate-500">${b.seq}</td>
      <td class="text-slate-200">${UI.esc(b.name)}</td>
      <td>${UI.catDot(b.category)}</td>
      <td class="font-mono-num text-[0.72rem] text-sky-300/90">${b.x}, ${b.y}, ${b.z}</td>
      <td class="font-mono-num text-slate-400">${UI.num(b.weight, 1)}</td>
    </tr>`).join('')
      : `<tr><td colspan="5" class="text-center text-slate-500 py-8">This asset was not loaded.</td></tr>`;

    body.querySelectorAll('.pack-row').forEach((tr) => {
      tr.addEventListener('click', () => {
        Viz3D.selectBySeq(Number(tr.dataset.seq));
        body.querySelectorAll('.pack-row').forEach((x) => x.classList.remove('bg-sky-500/15'));
        tr.classList.add('bg-sky-500/15');
      });
    });

    if (!Viz3D.supported()) {
      host.innerHTML = `<div class="h-full grid place-items-center p-6 text-center">
        <div><i class="fa-solid fa-cube text-2xl text-slate-600"></i>
        <p class="text-sm text-slate-400 mt-2">WebGL unavailable on this device.</p>
        <p class="text-xs text-slate-500 mt-1">Packing coordinates are still listed in the manifest table.</p></div>
      </div>`;
      return;
    }

    Viz3D.render(host, load, (box) => {
      const panel = document.getElementById('viz-detail');
      if (!panel) return;
      if (!box) { panel.classList.add('hidden'); return; }
      panel.classList.remove('hidden');
      panel.innerHTML = `
        <p class="font-semibold text-slate-100 text-[0.74rem] leading-tight">${UI.esc(box.name)}</p>
        <div class="flex items-center gap-1.5 mt-1">${UI.catDot(box.category)}
          <span class="text-[0.66rem] text-slate-400">${UI.esc(box.category)} · ${UI.esc(box.sku)}</span></div>
        <dl class="mt-2 space-y-0.5 text-[0.66rem] font-mono-num text-slate-400">
          <div class="flex justify-between"><dt>Seq</dt><dd class="text-slate-200">#${box.seq}</dd></div>
          <div class="flex justify-between"><dt>Pos</dt><dd class="text-sky-300">${box.x}, ${box.y}, ${box.z}</dd></div>
          <div class="flex justify-between"><dt>Size</dt><dd class="text-slate-200">${box.length}×${box.width}×${box.height}</dd></div>
          <div class="flex justify-between"><dt>Weight</dt><dd class="text-slate-200">${UI.num(box.weight, 1)} kg</dd></div>
          <div class="flex justify-between"><dt>P-idx</dt><dd class="text-amber-300">${UI.num(box.priority, 2)}</dd></div>
        </dl>`;
    });
  }

  /* --------------------------------------------------------- result actions */

  function bindResultActions(res) {
    outlet.querySelectorAll('[data-view]').forEach((b) => {
      b.addEventListener('click', () => Viz3D.setView(b.dataset.view));
    });
    const zi = document.getElementById('zoom-in');
    const zo = document.getElementById('zoom-out');
    if (zi) zi.addEventListener('click', () => Viz3D.zoom(-1.6));
    if (zo) zo.addEventListener('click', () => Viz3D.zoom(1.6));

    outlet.querySelectorAll('.viz-cat-toggle').forEach((b) => {
      b.addEventListener('click', () => {
        const on = Viz3D.toggleCategory(b.dataset.cat);
        b.style.opacity = on ? '1' : '0.35';
      });
    });

    document.getElementById('export-csv').addEventListener('click', () => exportCSV(res));
    document.getElementById('export-print').addEventListener('click', () => printManifest(res));
    document.getElementById('queue-dispatch').addEventListener('click', () => queueDispatch(res));
  }

  function exportCSV(res) {
    const rows = [];
    res.loads.forEach((l) => l.boxes.forEach((b) => rows.push({
      manifest: res.manifest_ref, destination: res.destination.site_name,
      vehicle: l.vehicle_code, vehicle_type: l.vehicle_type,
      seq: b.seq, sku: b.sku, item: b.name, category: b.category,
      x: b.x, y: b.y, z: b.z,
      length: b.length, width: b.width, height: b.height,
      weight_kg: b.weight, priority_index: b.priority
    })));
    if (!rows.length) { UI.toast('Nothing to export — no items were packed', 'warn'); return; }
    const cols = Object.keys(rows[0]).map((k) => ({ key: k, label: k }));
    UI.downloadText(`${res.manifest_ref}_packing_manifest.csv`, UI.toCSV(rows, cols));
    UI.toast('Manifest CSV downloaded', 'success');
  }

  function printManifest(res) {
    const s = res.summary;
    const area = document.getElementById('print-area');
    area.innerHTML = `
      <div style="font-family:Inter,sans-serif;color:#000;padding:18px">
        <h1 style="margin:0;font-size:19px">OptiRelief — Load Manifest ${UI.esc(res.manifest_ref)}</h1>
        <p style="margin:5px 0 0;font-size:12px">
          Destination: <b>${UI.esc(res.destination.site_name)}</b> ·
          Urgency ${UI.num(res.destination.urgency)} ·
          Transit ${UI.num(res.destination.transport_time, 1)} h ·
          Strategy: ${UI.esc(res.strategy)}<br>
          Generated ${new Date(res.generated_at).toLocaleString()}
        </p>
        <table style="width:100%;border-collapse:collapse;margin-top:12px;font-size:11px">
          <tr>
            <td style="border:1px solid #999;padding:5px"><b>Total weight</b><br>${UI.num(s.total_weight, 1)} kg (${UI.num(s.weight_util, 1)}%)</td>
            <td style="border:1px solid #999;padding:5px"><b>Total volume</b><br>${UI.num(s.total_volume, 3)} m³ (${UI.num(s.volume_util, 1)}%)</td>
            <td style="border:1px solid #999;padding:5px"><b>Hi-priority coverage</b><br>${UI.num(s.high_priority_coverage, 1)}%</td>
            <td style="border:1px solid #999;padding:5px"><b>Efficiency</b><br>${UI.num(s.efficiency, 1)}%</td>
          </tr>
        </table>
        ${res.loads.filter((l) => l.unit_count).map((l) => `
          <h2 style="font-size:14px;margin:16px 0 4px">${UI.esc(l.vehicle_code)} — ${UI.esc(l.vehicle_type)}
            <span style="font-weight:400;font-size:11px">(${UI.num(l.used_weight, 1)} kg / ${UI.num(l.used_volume, 3)} m³ ·
            bed ${l.container.length}×${l.container.width}×${l.container.height} m)</span></h2>
          <table style="width:100%;border-collapse:collapse;font-size:10.5px">
            <thead><tr style="background:#eee">
              <th style="border:1px solid #999;padding:3px 5px;text-align:left">Seq</th>
              <th style="border:1px solid #999;padding:3px 5px;text-align:left">SKU</th>
              <th style="border:1px solid #999;padding:3px 5px;text-align:left">Item</th>
              <th style="border:1px solid #999;padding:3px 5px;text-align:left">Category</th>
              <th style="border:1px solid #999;padding:3px 5px;text-align:left">Position x,y,z (m)</th>
              <th style="border:1px solid #999;padding:3px 5px;text-align:left">L×W×H</th>
              <th style="border:1px solid #999;padding:3px 5px;text-align:right">Kg</th>
            </tr></thead>
            <tbody>${l.boxes.map((b) => `<tr>
              <td style="border:1px solid #ccc;padding:3px 5px">${b.seq}</td>
              <td style="border:1px solid #ccc;padding:3px 5px">${UI.esc(b.sku)}</td>
              <td style="border:1px solid #ccc;padding:3px 5px">${UI.esc(b.name)}</td>
              <td style="border:1px solid #ccc;padding:3px 5px">${UI.esc(b.category)}</td>
              <td style="border:1px solid #ccc;padding:3px 5px">${b.x}, ${b.y}, ${b.z}</td>
              <td style="border:1px solid #ccc;padding:3px 5px">${b.length}×${b.width}×${b.height}</td>
              <td style="border:1px solid #ccc;padding:3px 5px;text-align:right">${UI.num(b.weight, 1)}</td>
            </tr>`).join('')}</tbody>
          </table>`).join('')}
        ${res.unallocated.length ? `
          <h2 style="font-size:14px;margin:16px 0 4px">Unallocated / Next Convoy</h2>
          <table style="width:100%;border-collapse:collapse;font-size:10.5px">
            <thead><tr style="background:#eee">
              <th style="border:1px solid #999;padding:3px 5px;text-align:left">Item</th>
              <th style="border:1px solid #999;padding:3px 5px;text-align:left">Category</th>
              <th style="border:1px solid #999;padding:3px 5px;text-align:right">Shortfall</th>
            </tr></thead>
            <tbody>${res.unallocated.map((u) => `<tr>
              <td style="border:1px solid #ccc;padding:3px 5px">${UI.esc(u.name)}</td>
              <td style="border:1px solid #ccc;padding:3px 5px">${UI.esc(u.category)}</td>
              <td style="border:1px solid #ccc;padding:3px 5px;text-align:right">${UI.num(u.qty_unallocated)} units</td>
            </tr>`).join('')}</tbody>
          </table>` : ''}
        <p style="margin-top:18px;font-size:10px;color:#555">
          Loader signature: ____________________  Driver signature: ____________________  Time out: __________
        </p>
      </div>`;
    window.print();
  }

  async function queueDispatch(res) {
    const loaded = res.loads.filter((l) => l.unit_count > 0);
    if (!loaded.length) { UI.toast('Nothing packed — nothing to dispatch', 'warn'); return; }

    let queued = 0;
    for (const l of loaded) {
      const out = await OptiStore.create('dispatches', {
        id: OptiStore.cryptoId(),
        manifest_ref: res.manifest_ref,
        vehicle_code: l.vehicle_code,
        site_name: res.destination.site_name,
        total_weight: l.used_weight,
        total_volume: l.used_volume,
        efficiency: res.summary.efficiency,
        payload: JSON.stringify({
          destination: res.destination, strategy: res.strategy,
          lines: l.lines, boxes: l.boxes.length, container: l.container
        }),
        status: OptiStore.isOnline() ? 'Synced' : 'Queued Offline',
        queued_at: new Date().toISOString()
      });
      if (out.queued) queued++;
    }
    await App.refresh(true);
    if (queued) UI.toast(`${loaded.length} dispatch(es) queued offline — will sync automatically`, 'warn', 5000);
    else UI.toast(`${loaded.length} dispatch record(s) committed`, 'success');
  }

  /* ------------------------------------------------------------- restore */

  if (App.state.lastResult) renderResults(App.state.lastResult);

  // Cleanup: kill the WebGL loop when navigating away.
  return () => Viz3D.dispose();
};
