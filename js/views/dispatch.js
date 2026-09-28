/* ==========================================================================
   OptiRelief — Dispatch Log & Offline Queue
   ========================================================================== */

window.Views = window.Views || {};

Views.dispatch = async function (outlet) {
  const list = App.state.dispatches;

  const totalKg = list.reduce((s, d) => s + (Number(d.total_weight) || 0), 0);
  const totalM3 = list.reduce((s, d) => s + (Number(d.total_volume) || 0), 0);
  const effs = list.map((d) => Number(d.efficiency) || 0).filter((n) => n > 0);
  const avgEff = effs.length ? effs.reduce((a, b) => a + b, 0) / effs.length : 0;
  const queuedCount = list.filter((d) => d.status === 'Queued Offline').length;

  outlet.innerHTML = `
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-5">
      ${UI.kpiCard({ label: 'Manifests logged', value: list.length, icon: 'fa-clipboard-list', tone: 'sky' })}
      ${UI.kpiCard({ label: 'Total dispatched', value: UI.num(totalKg / 1000, 2), unit: 't', icon: 'fa-weight-hanging', tone: 'green' })}
      ${UI.kpiCard({ label: 'Cube shipped', value: UI.num(totalM3, 2), unit: 'm³', icon: 'fa-cube', tone: 'violet' })}
      ${UI.kpiCard({ label: 'Mean efficiency', value: UI.num(avgEff, 1), unit: '%', icon: 'fa-chart-line', tone: 'amber', pct: avgEff })}
    </div>

    <div class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
      <section class="panel p-4 min-w-0">
        ${UI.sectionHead('Dispatch Records', 'Every manifest committed from this workspace',
          `<button id="disp-export" class="btn btn-ghost btn-xs"><i class="fa-solid fa-file-arrow-down"></i>Export CSV</button>
           <a href="#/optimizer" class="btn btn-primary btn-xs"><i class="fa-solid fa-plus"></i>New manifest</a>`)}
        <div class="table-scroll rounded-xl border hairline">
          <table class="data-table">
            <thead><tr>
              <th>Manifest</th><th>Vehicle</th><th>Destination</th><th>Weight</th>
              <th>Volume</th><th>Eff.</th><th>Status</th><th>Queued</th><th></th>
            </tr></thead>
            <tbody id="disp-body"></tbody>
          </table>
        </div>
      </section>

      <section class="space-y-4 min-w-0">
        <div class="panel p-4">
          ${UI.sectionHead('Offline Sync Queue', 'Pending operations awaiting connectivity')}
          <div id="outbox-panel"></div>
        </div>
        <div class="panel p-4">
          ${UI.sectionHead('Status Breakdown', 'Lifecycle of logged dispatches')}
          <div id="status-breakdown" class="space-y-3"></div>
        </div>
      </section>
    </div>`;

  /* ------------------------------------------------------------ records */

  function paintBody() {
    const body = document.getElementById('disp-body');
    body.innerHTML = list.length ? list.map((d) => `<tr>
      <td class="font-mono-num text-sky-300">${UI.esc(d.manifest_ref)}</td>
      <td class="font-semibold text-slate-100">${UI.esc(d.vehicle_code)}</td>
      <td class="text-slate-300">${UI.esc(d.site_name)}</td>
      <td class="font-mono-num">${UI.num(d.total_weight, 1)} kg</td>
      <td class="font-mono-num">${UI.num(d.total_volume, 2)} m³</td>
      <td class="font-mono-num text-amber-300">${UI.num(d.efficiency, 1)}%</td>
      <td><span class="badge ${UI.statusBadgeClass(d.status)}">${UI.esc(d.status)}</span></td>
      <td class="text-slate-500 text-[0.72rem]">${UI.timeAgo(d.queued_at)}</td>
      <td class="text-right whitespace-nowrap">
        <button class="btn btn-ghost btn-xs disp-view" data-id="${UI.esc(d.id)}" aria-label="View"><i class="fa-solid fa-eye"></i></button>
        <button class="btn btn-ghost btn-xs disp-adv" data-id="${UI.esc(d.id)}" aria-label="Advance status"><i class="fa-solid fa-forward text-emerald-400"></i></button>
        <button class="btn btn-ghost btn-xs disp-del" data-id="${UI.esc(d.id)}" aria-label="Delete"><i class="fa-solid fa-trash-can text-red-400"></i></button>
      </td>
    </tr>`).join('') : `<tr><td colspan="9">${UI.emptyState('fa-paper-plane', 'No dispatches yet',
      'Generated manifests appear here once you queue them from the optimizer.',
      '<a href="#/optimizer" class="btn btn-solve"><i class="fa-solid fa-bolt"></i>Run the solver</a>')}</td></tr>`;

    body.querySelectorAll('.disp-view').forEach((b) =>
      b.addEventListener('click', () => showDetail(list.find((x) => x.id === b.dataset.id))));

    body.querySelectorAll('.disp-adv').forEach((b) =>
      b.addEventListener('click', async () => {
        const rec = list.find((x) => x.id === b.dataset.id);
        const flow = ['Queued Offline', 'Synced', 'Dispatched', 'Delivered'];
        const next = flow[Math.min(flow.indexOf(rec.status) + 1, flow.length - 1)];
        if (next === rec.status) { UI.toast('Already delivered', 'info'); return; }
        await OptiStore.update('dispatches', rec.id, { status: next });
        await App.refresh(true);
        App.reroute();
        UI.toast(`${rec.manifest_ref} → ${next}`, 'success');
      }));

    body.querySelectorAll('.disp-del').forEach((b) =>
      b.addEventListener('click', () => {
        const rec = list.find((x) => x.id === b.dataset.id);
        UI.confirmDialog(`Remove dispatch record ${rec.manifest_ref} (${rec.vehicle_code})?`, async () => {
          await OptiStore.remove('dispatches', rec.id);
          await App.refresh(true);
          App.reroute();
          UI.toast('Dispatch record removed', 'success');
        });
      }));
  }

  function showDetail(rec) {
    if (!rec) return;
    let payload = {};
    try { payload = JSON.parse(rec.payload || '{}'); } catch (e) { payload = {}; }
    const lines = payload.lines || [];

    UI.openModal(`Manifest ${rec.manifest_ref}`, `
      <div class="grid grid-cols-2 gap-3 mb-4">
        <div class="panel-flat p-3"><p class="kpi-label">Vehicle</p>
          <p class="text-sm font-semibold text-slate-100 mt-1">${UI.esc(rec.vehicle_code)}</p></div>
        <div class="panel-flat p-3"><p class="kpi-label">Destination</p>
          <p class="text-sm font-semibold text-slate-100 mt-1">${UI.esc(rec.site_name)}</p></div>
        <div class="panel-flat p-3"><p class="kpi-label">Payload</p>
          <p class="text-sm font-mono-num text-slate-100 mt-1">${UI.num(rec.total_weight, 1)} kg / ${UI.num(rec.total_volume, 3)} m³</p></div>
        <div class="panel-flat p-3"><p class="kpi-label">Efficiency</p>
          <p class="text-sm font-mono-num text-amber-300 mt-1">${UI.num(rec.efficiency, 1)}%</p></div>
      </div>
      ${payload.container ? `<p class="text-[0.72rem] text-slate-500 mb-3">
        Cargo bed ${payload.container.length}×${payload.container.width}×${payload.container.height} m ·
        ${UI.num(payload.boxes)} crates placed · strategy: ${UI.esc(payload.strategy || '—')}</p>` : ''}
      ${lines.length ? `<div class="table-scroll rounded-lg border hairline" style="max-height:260px">
        <table class="data-table"><thead><tr><th>Item</th><th>Cat</th><th>Qty</th><th>Kg</th></tr></thead>
        <tbody>${lines.map((l) => `<tr>
          <td class="text-slate-200">${UI.esc(l.name)}</td>
          <td>${UI.catDot(l.category)}</td>
          <td class="font-mono-num">${UI.num(l.qty)}</td>
          <td class="font-mono-num text-slate-400">${UI.num((l.qty || 0) * (l.unit_weight || 0), 1)}</td>
        </tr>`).join('')}</tbody></table></div>`
        : '<p class="text-sm text-slate-500">No line detail stored for this record.</p>'}
      <div class="flex justify-end mt-4">
        <button class="btn btn-ghost" onclick="UI.closeModal()">Close</button>
      </div>`, { wide: true });
  }

  /* ------------------------------------------------------------- outbox */

  async function paintOutbox() {
    const items = await OptiStore.outboxItems();
    const host = document.getElementById('outbox-panel');
    if (!host) return;

    if (!items.length) {
      host.innerHTML = `<div class="text-center py-5">
        <i class="fa-solid fa-circle-check text-2xl text-emerald-400"></i>
        <p class="text-sm text-slate-300 mt-2 font-medium">Queue empty</p>
        <p class="text-[0.72rem] text-slate-500 mt-1">All local changes are synchronised with relief command.</p>
      </div>`;
      return;
    }

    host.innerHTML = `
      <p class="text-[0.72rem] text-amber-300 mb-2.5">
        <i class="fa-solid fa-triangle-exclamation mr-1"></i>${items.length} operation(s) pending
      </p>
      <div class="space-y-1.5 max-h-56 overflow-y-auto pr-1">
        ${items.map((i) => `<div class="panel-flat p-2.5">
          <div class="flex items-center gap-2">
            <span class="badge ${i.op === 'delete' ? 'badge-critical' : 'badge-moderate'}">${UI.esc(i.op)}</span>
            <span class="text-[0.72rem] text-slate-300">${UI.esc(i.table)}</span>
            <span class="ml-auto text-[0.66rem] text-slate-500 font-mono-num">${UI.timeAgo(i.created_at)}</span>
          </div>
          ${i.attempts ? `<p class="text-[0.64rem] text-amber-400/80 mt-1">${i.attempts} retry attempt(s)</p>` : ''}
        </div>`).join('')}
      </div>
      <button id="flush-now" class="btn btn-primary w-full mt-3">
        <i class="fa-solid fa-cloud-arrow-up"></i>Sync queue now
      </button>`;

    const btn = document.getElementById('flush-now');
    if (btn) btn.addEventListener('click', async () => {
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span>Syncing…';
      const res = await OptiStore.flushOutbox();
      await App.refresh(true);
      App.reroute();
      if (res.offline) UI.toast('Offline — queue retained', 'warn');
      else UI.toast(`${res.flushed} synced, ${res.failed} retained`, res.failed ? 'warn' : 'success');
    });
  }

  function paintBreakdown() {
    const states = ['Queued Offline', 'Synced', 'Dispatched', 'Delivered'];
    const max = Math.max(1, ...states.map((s) => list.filter((d) => d.status === s).length));
    const colors = { 'Queued Offline': '#f59e0b', Synced: '#38bdf8', Dispatched: '#a855f7', Delivered: '#22c55e' };
    document.getElementById('status-breakdown').innerHTML = states.map((s) => {
      const n = list.filter((d) => d.status === s).length;
      return `<div>
        <div class="flex items-center gap-2 text-xs mb-1.5">
          <span class="w-2 h-2 rounded-full" style="background:${colors[s]}"></span>
          <span class="text-slate-300">${s}</span>
          <span class="ml-auto font-mono-num text-slate-400">${n}</span>
        </div>
        <div class="spark-bar"><div class="spark-fill" style="width:${(n / max) * 100}%;background:${colors[s]}"></div></div>
      </div>`;
    }).join('');
  }

  document.getElementById('disp-export').addEventListener('click', () => {
    if (!list.length) { UI.toast('Nothing to export', 'warn'); return; }
    const cols = ['manifest_ref', 'vehicle_code', 'site_name', 'total_weight', 'total_volume', 'efficiency', 'status', 'queued_at']
      .map((k) => ({ key: k, label: k }));
    UI.downloadText('dispatch_log.csv', UI.toCSV(list, cols));
    UI.toast('Dispatch log exported', 'success');
  });

  paintBody();
  paintBreakdown();
  await paintOutbox();

  if (queuedCount) {
    UI.toast(`${queuedCount} dispatch(es) still queued offline`, 'warn', 4000);
  }
};
