/* ==========================================================================
   OptiRelief — System health, storage and sync diagnostics
   Mirrors GET /api/v1/health
   ========================================================================== */

window.Views = window.Views || {};

Views.system = async function (outlet) {
  outlet.innerHTML = `<div class="space-y-4">
    <div class="skeleton h-28 w-full"></div>
    <div class="skeleton h-56 w-full"></div></div>`;

  const h = await OptiStore.health();
  const counts = h.tables;

  const statusTone = {
    operational: { c: 'text-emerald-300', b: 'badge-stable', i: 'fa-circle-check' },
    offline: { c: 'text-amber-300', b: 'badge-high', i: 'fa-plug-circle-xmark' },
    unreachable: { c: 'text-red-300', b: 'badge-critical', i: 'fa-triangle-exclamation' },
    degraded: { c: 'text-amber-300', b: 'badge-high', i: 'fa-circle-exclamation' }
  }[h.status] || { c: 'text-slate-300', b: 'badge-muted', i: 'fa-circle' };

  const endpoints = [
    { m: 'GET', p: '/api/v1/health', d: 'System status, table counts, queue depth', fn: 'OptiStore.health()' },
    { m: 'POST', p: '/api/v1/optimize', d: 'Run the allocation solver, return manifest + 3D matrix', fn: 'OptiSolver.optimizeAllocation()' },
    { m: 'GET', p: '/api/v1/inventory', d: 'List relief supply lines', fn: "OptiStore.list('supplies')" },
    { m: 'POST', p: '/api/v1/inventory', d: 'Create a supply line', fn: "OptiStore.create('supplies', …)" },
    { m: 'GET', p: '/api/v1/vehicles', d: 'List fleet assets', fn: "OptiStore.list('vehicles')" },
    { m: 'POST', p: '/api/v1/vehicles', d: 'Register a fleet asset', fn: "OptiStore.create('vehicles', …)" },
    { m: 'POST', p: '/api/v1/sync', d: 'Drain the offline background-sync queue', fn: 'OptiStore.flushOutbox()' }
  ];

  outlet.innerHTML = `
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-5">
      ${UI.kpiCard({
        label: 'Service status', value: `<span class="${statusTone.c}">${h.status}</span>`,
        icon: statusTone.i, tone: h.status === 'operational' ? 'green' : 'amber',
        foot: h.latency_ms !== null ? `Round-trip ${h.latency_ms} ms` : 'No successful round-trip'
      })}
      ${UI.kpiCard({ label: 'Connectivity', value: h.online ? 'Online' : 'Offline', icon: h.online ? 'fa-wifi' : 'fa-plane-up', tone: h.online ? 'sky' : 'amber', foot: h.online ? 'Writes commit immediately' : 'Writes queue in IndexedDB' })}
      ${UI.kpiCard({ label: 'Queued operations', value: h.queued, icon: 'fa-inbox', tone: h.queued ? 'red' : 'green', foot: h.queued ? 'Will flush on reconnect' : 'Nothing pending' })}
      ${UI.kpiCard({ label: 'Service worker', value: h.sw, icon: 'fa-gears', tone: h.sw === 'active' ? 'green' : 'violet', foot: h.sw === 'active' ? 'Offline shell cached' : 'Reload to activate caching' })}
    </div>

    <div class="grid gap-5 xl:grid-cols-2">
      <section class="panel p-4">
        ${UI.sectionHead('Local Data Mirror', 'IndexedDB (Dexie) record counts — available offline',
          `<button id="reseed-check" class="btn btn-ghost btn-xs"><i class="fa-solid fa-rotate"></i>Re-check</button>`)}
        <div class="space-y-2">
          ${OptiStore.TABLES.map((t) => `<div class="flex items-center gap-3 panel-flat p-2.5">
            <i class="fa-solid fa-table text-slate-500 text-xs"></i>
            <span class="text-sm text-slate-200 font-medium">${t}</span>
            <span class="ml-auto font-mono-num text-sm ${counts[t] ? 'text-emerald-300' : 'text-slate-500'}">${UI.num(counts[t])} rows</span>
          </div>`).join('')}
        </div>
        <p class="text-[0.7rem] text-slate-500 mt-3">
          Last successful sync: <span class="font-mono-num text-slate-400">${h.last_sync ? new Date(h.last_sync).toLocaleString() : 'never'}</span>
        </p>
        <div class="flex gap-2 mt-3">
          <button id="purge-local" class="btn btn-danger btn-xs"><i class="fa-solid fa-eraser"></i>Clear local mirror</button>
          <button id="refetch-all" class="btn btn-primary btn-xs"><i class="fa-solid fa-cloud-arrow-down"></i>Re-fetch from server</button>
        </div>
      </section>

      <section class="panel p-4">
        ${UI.sectionHead('API Surface', 'Logical endpoints and their client bindings')}
        <div class="space-y-1.5">
          ${endpoints.map((e) => `<div class="panel-flat p-2.5">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="badge ${e.m === 'GET' ? 'badge-moderate' : 'badge-stable'}">${e.m}</span>
              <code class="text-[0.74rem] text-sky-300 font-mono-num">${UI.esc(e.p)}</code>
            </div>
            <p class="text-[0.7rem] text-slate-400 mt-1">${UI.esc(e.d)}</p>
            <code class="text-[0.66rem] text-slate-500 font-mono-num">${UI.esc(e.fn)}</code>
          </div>`).join('')}
        </div>
      </section>
    </div>

    <section class="panel p-4 mt-5">
      ${UI.sectionHead('Solver Specification', 'How the allocation engine reaches its decision')}
      <div class="grid gap-4 md:grid-cols-2 text-sm text-slate-400 leading-relaxed">
        <div>
          <h4 class="font-semibold text-slate-200 mb-1.5">1 · Dynamic priority index</h4>
          <code class="block panel-flat p-2.5 text-[0.72rem] text-sky-300 font-mono-num mb-3">
            Priority = (Urgency × 0.6) + (Severity ÷ Transit × 0.4)
          </code>
          <p>An item's urgency is blended 65/35 with the destination's own urgency, so the same crate scores higher when bound for a critical zone. The logistics term is normalised onto the 0–10 band and the transit divisor is floored at 0.5 h.</p>

          <h4 class="font-semibold text-slate-200 mb-1.5 mt-4">2 · Value-density ordering</h4>
          <p>Lines are ranked by priority per unit of the binding resource. <em>Balanced</em> blends weight and cube; <em>Urgency first</em> ignores density and packs strictly by priority.</p>
        </div>
        <div>
          <h4 class="font-semibold text-slate-200 mb-1.5">3 · Multi-knapsack fill</h4>
          <p>Vehicles are filled largest-cube first. Round-robin passes over the ranked lines keep the category mix representative rather than exhausting one line. Both <code class="text-sky-300">Σweight ≤ max_weight</code> and <code class="text-sky-300">Σvolume ≤ max_volume</code> are hard constraints.</p>

          <h4 class="font-semibold text-slate-200 mb-1.5 mt-4">4 · Extreme-point 3D placement</h4>
          <p>Each crate is seated at the deepest-bottom-leftmost free anchor, testing all six axis rotations. Placements are rejected unless they are collision-free inside the bed and at least 55% supported by the floor or the crate below — so the rendered stack is physically plausible.</p>
        </div>
      </div>
    </section>

    <section class="panel p-4 mt-5">
      ${UI.sectionHead('Deployment Note', 'Where this build differs from the original brief')}
      <div class="text-sm text-slate-400 leading-relaxed space-y-2">
        <p>This workspace hosts static assets only — it cannot run a Python process, so the FastAPI/SQLAlchemy tier described in the brief is not deployed here. The optimization engine was ported to JavaScript (<code class="text-sky-300">js/solver.js</code>) with identical mathematics, and it executes in the browser.</p>
        <p>Persistence uses the platform's REST table API in place of PostgreSQL/PostGIS, with a Dexie/IndexedDB mirror and outbound queue providing the offline behaviour the brief asked of Workbox Background Sync.</p>
        <p class="text-slate-500 text-[0.8rem]">Consequence worth knowing: because the solver runs client-side, there is no server-side authority over manifests. Anything a field device computes can be inspected or altered by whoever holds that device — treat manifests as operational documents, not as audited records.</p>
      </div>
    </section>`;

  document.getElementById('reseed-check').addEventListener('click', () => App.reroute());

  document.getElementById('refetch-all').addEventListener('click', async () => {
    await App.refresh();
    App.reroute();
  });

  document.getElementById('purge-local').addEventListener('click', () => {
    UI.confirmDialog(
      'Clear the local IndexedDB mirror? Any operations still queued offline will be lost permanently.',
      async () => {
        for (const t of OptiStore.TABLES) await OptiStore.db.table(t).clear();
        await OptiStore.db.outbox.clear();
        await OptiStore.notifyOutbox();
        UI.toast('Local mirror cleared — re-fetching', 'success');
        await App.refresh(true);
        App.reroute();
      }, 'Clear');
  });
};
