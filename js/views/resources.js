/* ==========================================================================
   OptiRelief — Resource management views (Fleet / Inventory / Sites)
   Generic CRUD table factory + CSV bulk importer.
   ========================================================================== */

window.Views = window.Views || {};

/* --------------------------------------------------------- configurations */

const RESOURCE_DEFS = {
  vehicles: {
    table: 'vehicles',
    label: 'Fleet Asset',
    icon: 'fa-truck-fast',
    numeric: ['max_weight', 'max_volume', 'length', 'width', 'height', 'speed_kmh'],
    columns: [
      { key: 'vehicle_code', label: 'Code', cell: (r) => `<span class="font-semibold text-slate-100">${UI.esc(r.vehicle_code)}</span>` },
      { key: 'type', label: 'Type', cell: (r) => `<i class="fa-solid ${UI.VEHICLE_ICONS[r.type] || 'fa-truck'} text-sky-400 mr-1.5"></i>${UI.esc(r.type)}` },
      { key: 'max_weight', label: 'Max weight', cell: (r) => `<span class="font-mono-num">${UI.num(r.max_weight)} kg</span>` },
      { key: 'max_volume', label: 'Max volume', cell: (r) => `<span class="font-mono-num">${UI.num(r.max_volume, 1)} m³</span>` },
      { key: 'dims', label: 'Bed L×W×H', cell: (r) => `<span class="font-mono-num text-slate-400">${UI.num(r.length, 1)}×${UI.num(r.width, 1)}×${UI.num(r.height, 1)}</span>` },
      { key: 'base', label: 'Base' },
      { key: 'speed_kmh', label: 'Speed', cell: (r) => `<span class="font-mono-num">${UI.num(r.speed_kmh)} km/h</span>` },
      { key: 'status', label: 'Status', cell: (r) => `<span class="badge ${UI.statusBadgeClass(r.status)}">${UI.esc(r.status)}</span>` }
    ],
    form: (r = {}) => `
      <div class="grid grid-cols-2 gap-3">
        ${UI.fieldRow('Asset code', 'vehicle_code', r.vehicle_code, 'text', { placeholder: 'TRK-04' })}
        ${UI.fieldRow('Type', 'type', r.type || 'Truck', 'select', { options: UI.VEHICLE_TYPES })}
        ${UI.fieldRow('Max weight (kg)', 'max_weight', r.max_weight, 'number', { min: 0 })}
        ${UI.fieldRow('Max volume (m³)', 'max_volume', r.max_volume, 'number', { min: 0 })}
        ${UI.fieldRow('Bed length (m)', 'length', r.length, 'number', { min: 0 })}
        ${UI.fieldRow('Bed width (m)', 'width', r.width, 'number', { min: 0 })}
        ${UI.fieldRow('Bed height (m)', 'height', r.height, 'number', { min: 0 })}
        ${UI.fieldRow('Avg speed (km/h)', 'speed_kmh', r.speed_kmh, 'number', { min: 0 })}
        ${UI.fieldRow('Home base', 'base', r.base, 'text', { placeholder: 'Central Depot' })}
        ${UI.fieldRow('Status', 'status', r.status || 'Available', 'select', { options: ['Available', 'In Transit', 'Maintenance'] })}
      </div>`,
    csvTemplate: 'vehicle_code,type,max_weight,max_volume,length,width,height,base,speed_kmh,status\nTRK-99,Truck,10000,40,6.5,2.4,2.6,Central Depot,55,Available',
    searchKeys: ['vehicle_code', 'type', 'base', 'status']
  },

  supplies: {
    table: 'supplies',
    label: 'Supply Line',
    icon: 'fa-boxes-stacked',
    numeric: ['unit_weight', 'unit_volume', 'length', 'width', 'height', 'qty_available', 'urgency'],
    columns: [
      { key: 'sku', label: 'SKU', cell: (r) => `<span class="font-mono-num text-slate-400">${UI.esc(r.sku)}</span>` },
      { key: 'name', label: 'Item', cell: (r) => `<span class="font-medium text-slate-100">${UI.esc(r.name)}</span>` },
      { key: 'category', label: 'Category', cell: (r) => `${UI.catDot(r.category)} <span class="ml-1">${UI.esc(r.category)}</span>` },
      { key: 'unit_weight', label: 'Unit wt', cell: (r) => `<span class="font-mono-num">${UI.num(r.unit_weight, 1)} kg</span>` },
      { key: 'unit_volume', label: 'Unit vol', cell: (r) => `<span class="font-mono-num">${UI.num(r.unit_volume, 3)} m³</span>` },
      { key: 'dims', label: 'L×W×H', cell: (r) => `<span class="font-mono-num text-slate-400">${UI.num(r.length, 2)}×${UI.num(r.width, 2)}×${UI.num(r.height, 2)}</span>` },
      { key: 'qty_available', label: 'Qty', cell: (r) => `<span class="font-mono-num text-slate-100">${UI.num(r.qty_available)}</span>` },
      {
        key: 'urgency', label: 'Urgency', cell: (r) => `<div class="flex items-center gap-1.5">
          <span class="font-mono-num font-bold" style="color:${UI.urgencyColor(r.urgency)}">${UI.num(r.urgency)}</span>
          <span class="spark-bar w-10"><span class="spark-fill block" style="width:${(Number(r.urgency) || 0) * 10}%;background:${UI.urgencyColor(r.urgency)}"></span></span></div>`
      },
      { key: 'warehouse', label: 'Warehouse' }
    ],
    form: (r = {}) => `
      <div class="grid grid-cols-2 gap-3">
        ${UI.fieldRow('SKU', 'sku', r.sku, 'text', { placeholder: 'MED-XXXX' })}
        ${UI.fieldRow('Item name', 'name', r.name, 'text')}
        ${UI.fieldRow('Category', 'category', r.category || 'Medical', 'select', { options: UI.CATEGORIES })}
        ${UI.fieldRow('Urgency (1-10)', 'urgency', r.urgency || 5, 'number', { min: 1, max: 10, step: 1 })}
        ${UI.fieldRow('Unit weight (kg)', 'unit_weight', r.unit_weight, 'number', { min: 0 })}
        ${UI.fieldRow('Unit volume (m³)', 'unit_volume', r.unit_volume, 'number', { min: 0, step: '0.001' })}
        ${UI.fieldRow('Box length (m)', 'length', r.length, 'number', { min: 0, step: '0.01' })}
        ${UI.fieldRow('Box width (m)', 'width', r.width, 'number', { min: 0, step: '0.01' })}
        ${UI.fieldRow('Box height (m)', 'height', r.height, 'number', { min: 0, step: '0.01' })}
        ${UI.fieldRow('Qty available', 'qty_available', r.qty_available, 'number', { min: 0, step: 1 })}
        ${UI.fieldRow('Warehouse', 'warehouse', r.warehouse, 'text')}
      </div>
      <p class="text-[0.68rem] text-slate-500 mt-3">Leave unit volume blank to derive it from L×W×H.</p>`,
    csvTemplate: 'sku,name,category,unit_weight,unit_volume,length,width,height,qty_available,urgency,warehouse\nMED-9001,Field Dressing Kit,Medical,12,0.048,0.4,0.4,0.3,120,9,Central Depot',
    searchKeys: ['sku', 'name', 'category', 'warehouse']
  },

  sites: {
    table: 'sites',
    label: 'Site / Node',
    icon: 'fa-location-crosshairs',
    numeric: ['lat', 'lng', 'urgency', 'need_severity', 'transport_time', 'population'],
    columns: [
      { key: 'site_name', label: 'Name', cell: (r) => `<span class="font-medium text-slate-100">${UI.esc(r.site_name)}</span>` },
      { key: 'kind', label: 'Kind', cell: (r) => `<span class="badge ${r.kind === 'Warehouse' ? 'badge-moderate' : 'badge-muted'}">${UI.esc(r.kind)}</span>` },
      { key: 'coords', label: 'Coordinates', cell: (r) => `<span class="font-mono-num text-slate-400">${UI.num(r.lat, 4)}, ${UI.num(r.lng, 4)}</span>` },
      { key: 'urgency', label: 'Urgency', cell: (r) => `<span class="font-mono-num font-bold" style="color:${UI.urgencyColor(r.urgency)}">${UI.num(r.urgency)}</span>` },
      { key: 'need_severity', label: 'Severity', cell: (r) => `<span class="font-mono-num">${UI.num(r.need_severity)}</span>` },
      { key: 'transport_time', label: 'Transit', cell: (r) => `<span class="font-mono-num">${UI.num(r.transport_time, 1)} h</span>` },
      { key: 'pidx', label: 'P-index', cell: (r) => `<span class="font-mono-num text-amber-300">${UI.num(OptiSolver.priorityIndex(r.urgency, r.need_severity, r.transport_time), 2)}</span>` },
      { key: 'population', label: 'Affected', cell: (r) => `<span class="font-mono-num">${UI.num(r.population)}</span>` },
      { key: 'status', label: 'Status', cell: (r) => `<span class="badge ${UI.statusBadgeClass(r.status)}">${UI.esc(r.status)}</span>` }
    ],
    form: (r = {}) => `
      <div class="grid grid-cols-2 gap-3">
        ${UI.fieldRow('Site name', 'site_name', r.site_name, 'text')}
        ${UI.fieldRow('Kind', 'kind', r.kind || 'Disaster Site', 'select', { options: ['Disaster Site', 'Warehouse'] })}
        ${UI.fieldRow('Latitude', 'lat', r.lat, 'number', { step: '0.0001' })}
        ${UI.fieldRow('Longitude', 'lng', r.lng, 'number', { step: '0.0001' })}
        ${UI.fieldRow('Urgency (0-10)', 'urgency', r.urgency, 'number', { min: 0, max: 10, step: 1 })}
        ${UI.fieldRow('Need severity (0-10)', 'need_severity', r.need_severity, 'number', { min: 0, max: 10, step: 1 })}
        ${UI.fieldRow('Transport time (h)', 'transport_time', r.transport_time, 'number', { min: 0, step: '0.1' })}
        ${UI.fieldRow('Affected population', 'population', r.population, 'number', { min: 0, step: 1 })}
        ${UI.fieldRow('Status', 'status', r.status || 'High', 'select', { options: ['Critical', 'High', 'Moderate', 'Stable', 'Depot'] })}
      </div>`,
    csvTemplate: 'site_name,kind,lat,lng,urgency,need_severity,transport_time,population,status\nNew Relief Camp,Disaster Site,22.11,88.33,8,7,4.0,5400,High',
    searchKeys: ['site_name', 'kind', 'status']
  }
};

/* -------------------------------------------------------- generic factory */

function buildResourceView(defKey, headTitle, headSub) {
  const def = RESOURCE_DEFS[defKey];

  return function (outlet) {
    let query = '';
    let sortKey = def.columns[0].key;
    let sortDir = 1;

    outlet.innerHTML = `
      <section class="panel p-4">
        ${UI.sectionHead(headTitle, headSub,
          `<input id="res-search" class="field !w-auto !py-1.5" style="min-width:190px" type="search" placeholder="Search…">
           <button id="res-import" class="btn btn-ghost btn-xs"><i class="fa-solid fa-file-arrow-up"></i>CSV Import</button>
           <button id="res-export" class="btn btn-ghost btn-xs"><i class="fa-solid fa-file-arrow-down"></i>Export</button>
           <button id="res-add" class="btn btn-primary btn-xs"><i class="fa-solid fa-plus"></i>New</button>`)}
        <div id="res-stats" class="grid gap-3 grid-cols-2 lg:grid-cols-4 mb-4"></div>
        <div class="table-scroll rounded-xl border hairline">
          <table class="data-table">
            <thead><tr id="res-head"></tr></thead>
            <tbody id="res-body"></tbody>
          </table>
        </div>
        <p id="res-count" class="text-[0.7rem] text-slate-500 mt-2"></p>
      </section>`;

    /* ------------------------------------------------------------ render */

    function rows() {
      let list = App.state[def.table].slice();
      if (query) {
        const q = query.toLowerCase();
        list = list.filter((r) => def.searchKeys.some(
          (k) => String(r[k] || '').toLowerCase().includes(q)
        ));
      }
      list.sort((a, b) => {
        const av = a[sortKey], bv = b[sortKey];
        const an = Number(av), bn = Number(bv);
        if (isFinite(an) && isFinite(bn) && av !== '' && bv !== '') return (an - bn) * sortDir;
        return String(av || '').localeCompare(String(bv || '')) * sortDir;
      });
      return list;
    }

    function paintHead() {
      document.getElementById('res-head').innerHTML =
        def.columns.map((c) => `<th class="cursor-pointer select-none res-sort" data-key="${c.key}">
          ${UI.esc(c.label)}${sortKey === c.key ? `<i class="fa-solid fa-caret-${sortDir > 0 ? 'up' : 'down'} ml-1 text-sky-400"></i>` : ''}
        </th>`).join('') + `<th class="text-right">Actions</th>`;

      outlet.querySelectorAll('.res-sort').forEach((th) => {
        th.addEventListener('click', () => {
          if (sortKey === th.dataset.key) sortDir *= -1;
          else { sortKey = th.dataset.key; sortDir = 1; }
          paintHead();
          paintBody();
        });
      });
    }

    function paintBody() {
      const list = rows();
      const body = document.getElementById('res-body');
      body.innerHTML = list.length ? list.map((r) => `<tr>
        ${def.columns.map((c) => `<td>${c.cell ? c.cell(r) : UI.esc(r[c.key])}</td>`).join('')}
        <td class="text-right whitespace-nowrap">
          <button class="btn btn-ghost btn-xs res-edit" data-id="${UI.esc(r.id)}" aria-label="Edit"><i class="fa-solid fa-pen"></i></button>
          <button class="btn btn-ghost btn-xs res-del" data-id="${UI.esc(r.id)}" aria-label="Delete"><i class="fa-solid fa-trash-can text-red-400"></i></button>
        </td>
      </tr>`).join('') : `<tr><td colspan="${def.columns.length + 1}">${UI.emptyState(def.icon, 'No records', query ? 'No match for your search.' : `Add your first ${def.label.toLowerCase()} to begin.`)}</td></tr>`;

      document.getElementById('res-count').textContent =
        `${list.length} of ${App.state[def.table].length} record(s)`;

      body.querySelectorAll('.res-edit').forEach((b) =>
        b.addEventListener('click', () => openForm(App.state[def.table].find((x) => x.id === b.dataset.id))));
      body.querySelectorAll('.res-del').forEach((b) =>
        b.addEventListener('click', () => {
          const rec = App.state[def.table].find((x) => x.id === b.dataset.id);
          UI.confirmDialog(
            `Permanently remove "${rec[def.columns[0].key] || rec.id}"? This cannot be undone.`,
            async () => {
              const res = await OptiStore.remove(def.table, b.dataset.id);
              await App.refresh(true);
              paintAll();
              UI.toast(res.queued ? 'Deletion queued for sync' : 'Record deleted', res.queued ? 'warn' : 'success');
            });
        }));
    }

    function paintStats() {
      const list = App.state[def.table];
      const host = document.getElementById('res-stats');
      let cards = '';

      if (defKey === 'vehicles') {
        const capW = list.reduce((s, v) => s + (Number(v.max_weight) || 0), 0);
        const capV = list.reduce((s, v) => s + (Number(v.max_volume) || 0), 0);
        cards = [
          UI.kpiCard({ label: 'Total assets', value: list.length, icon: 'fa-truck-fast', tone: 'sky' }),
          UI.kpiCard({ label: 'Available now', value: list.filter((v) => v.status === 'Available').length, icon: 'fa-circle-check', tone: 'green' }),
          UI.kpiCard({ label: 'Fleet payload', value: UI.num(capW / 1000, 1), unit: 't', icon: 'fa-weight-hanging', tone: 'amber' }),
          UI.kpiCard({ label: 'Fleet cube', value: UI.num(capV, 1), unit: 'm³', icon: 'fa-cube', tone: 'violet' })
        ].join('');
      } else if (defKey === 'supplies') {
        const units = list.reduce((s, x) => s + (Number(x.qty_available) || 0), 0);
        const kg = list.reduce((s, x) => s + (Number(x.qty_available) || 0) * (Number(x.unit_weight) || 0), 0);
        const urgent = list.filter((x) => (Number(x.urgency) || 0) >= 8).length;
        cards = [
          UI.kpiCard({ label: 'Supply lines', value: list.length, icon: 'fa-boxes-stacked', tone: 'sky' }),
          UI.kpiCard({ label: 'Units in stock', value: UI.num(units), icon: 'fa-cubes', tone: 'green' }),
          UI.kpiCard({ label: 'Stock weight', value: UI.num(kg / 1000, 2), unit: 't', icon: 'fa-weight-hanging', tone: 'amber' }),
          UI.kpiCard({ label: 'Critical lines', value: urgent, unit: '≥ U8', icon: 'fa-triangle-exclamation', tone: 'red' })
        ].join('');
      } else {
        const zones = list.filter((s) => s.kind === 'Disaster Site');
        const pop = zones.reduce((s, x) => s + (Number(x.population) || 0), 0);
        cards = [
          UI.kpiCard({ label: 'Total nodes', value: list.length, icon: 'fa-location-dot', tone: 'sky' }),
          UI.kpiCard({ label: 'Disaster sites', value: zones.length, icon: 'fa-house-crack', tone: 'red' }),
          UI.kpiCard({ label: 'Depots', value: list.filter((s) => s.kind === 'Warehouse').length, icon: 'fa-warehouse', tone: 'green' }),
          UI.kpiCard({ label: 'Affected people', value: UI.num(pop), icon: 'fa-users', tone: 'amber' })
        ].join('');
      }
      host.innerHTML = cards;
    }

    function paintAll() { paintHead(); paintBody(); paintStats(); }

    /* ------------------------------------------------------------- form */

    function openForm(record) {
      const editing = !!record;
      const m = UI.openModal(
        `${editing ? 'Edit' : 'New'} ${def.label}`,
        `<form id="res-form">${def.form(record || {})}
          <div class="flex gap-2 justify-end mt-5">
            <button type="button" class="btn btn-ghost" data-cancel>Cancel</button>
            <button type="submit" class="btn btn-primary"><i class="fa-solid fa-floppy-disk"></i>${editing ? 'Save changes' : 'Create'}</button>
          </div></form>`, { wide: true });

      m.querySelector('[data-cancel]').addEventListener('click', UI.closeModal);
      m.querySelector('#res-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = UI.readForm(e.target, def.numeric);

        // Derive volume from dimensions when omitted.
        if (defKey === 'supplies' && !data.unit_volume && data.length && data.width && data.height) {
          data.unit_volume = Number((data.length * data.width * data.height).toFixed(4));
        }
        if (defKey === 'vehicles' && !data.max_volume && data.length && data.width && data.height) {
          data.max_volume = Number((data.length * data.width * data.height).toFixed(3));
        }

        UI.closeModal();
        const res = editing
          ? await OptiStore.update(def.table, record.id, data)
          : await OptiStore.create(def.table, data);
        await App.refresh(true);
        paintAll();
        UI.toast(res.queued
          ? `${def.label} saved locally — queued for sync`
          : `${def.label} ${editing ? 'updated' : 'created'}`, res.queued ? 'warn' : 'success');
      });
    }

    /* ---------------------------------------------------------- CSV import */

    function openImport() {
      const m = UI.openModal(`Bulk CSV Import — ${def.label}`, `
        <p class="text-sm text-slate-400 leading-relaxed">
          Upload a CSV whose header row matches the field names below. Rows are validated,
          then committed one by one; while offline they queue for automatic sync.
        </p>
        <div class="panel-flat p-3 mt-3">
          <p class="field-label">Expected header</p>
          <code class="block text-[0.68rem] text-sky-300 font-mono-num break-all">${UI.esc(def.csvTemplate.split('\n')[0])}</code>
          <button class="btn btn-ghost btn-xs mt-2.5" id="dl-template"><i class="fa-solid fa-download"></i>Download template</button>
        </div>
        <div class="mt-4">
          <label class="field-label" for="csv-file">CSV file</label>
          <input type="file" id="csv-file" accept=".csv,text/csv" class="field !py-2">
        </div>
        <div id="csv-preview" class="mt-3"></div>
        <div class="flex gap-2 justify-end mt-5">
          <button type="button" class="btn btn-ghost" data-cancel>Cancel</button>
          <button class="btn btn-primary" id="csv-commit" disabled><i class="fa-solid fa-database"></i>Import rows</button>
        </div>`, { wide: true });

      let staged = [];

      m.querySelector('[data-cancel]').addEventListener('click', UI.closeModal);
      m.querySelector('#dl-template').addEventListener('click', () =>
        UI.downloadText(`${def.table}_template.csv`, def.csvTemplate));

      m.querySelector('#csv-file').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          const { headers, records } = UI.parseCSV(String(reader.result));
          const preview = m.querySelector('#csv-preview');

          if (!records.length) {
            preview.innerHTML = `<p class="text-sm text-red-300"><i class="fa-solid fa-circle-xmark mr-1"></i>No data rows found.</p>`;
            m.querySelector('#csv-commit').disabled = true;
            return;
          }

          const expected = def.csvTemplate.split('\n')[0].split(',');
          const missing = expected.filter((h) => !headers.includes(h));

          staged = records.map((r) => {
            const row = { id: OptiStore.cryptoId() };
            expected.forEach((h) => {
              const raw = r[h];
              row[h] = def.numeric.includes(h) ? (Number(raw) || 0) : (raw || '');
            });
            if (defKey === 'supplies' && !row.unit_volume) {
              row.unit_volume = Number(((row.length || 0.1) * (row.width || 0.1) * (row.height || 0.1)).toFixed(4));
            }
            return row;
          });

          preview.innerHTML = `
            ${missing.length ? `<p class="text-[0.75rem] text-amber-300 mb-2">
              <i class="fa-solid fa-triangle-exclamation mr-1"></i>Missing column(s): ${UI.esc(missing.join(', '))} — will default to blank/zero.</p>` : ''}
            <p class="text-[0.75rem] text-emerald-300 mb-2"><i class="fa-solid fa-circle-check mr-1"></i>
              ${staged.length} row(s) parsed and ready.</p>
            <div class="table-scroll rounded-lg border hairline" style="max-height:200px">
              <table class="data-table"><thead><tr>
                ${expected.slice(0, 6).map((h) => `<th>${UI.esc(h)}</th>`).join('')}
              </tr></thead><tbody>
                ${staged.slice(0, 8).map((r) => `<tr>${expected.slice(0, 6).map((h) =>
                  `<td class="text-slate-300">${UI.esc(r[h])}</td>`).join('')}</tr>`).join('')}
              </tbody></table>
            </div>
            ${staged.length > 8 ? `<p class="text-[0.68rem] text-slate-500 mt-1.5">…and ${staged.length - 8} more row(s).</p>` : ''}`;

          m.querySelector('#csv-commit').disabled = false;
        };
        reader.readAsText(file);
      });

      m.querySelector('#csv-commit').addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner"></span>Importing…';
        const res = await OptiStore.createMany(def.table, staged);
        UI.closeModal();
        await App.refresh(true);
        paintAll();
        UI.toast(`Imported ${res.total} row(s)${res.queued ? ` — ${res.queued} queued offline` : ''}`,
          res.queued ? 'warn' : 'success', 5000);
      });
    }

    /* ----------------------------------------------------------- bindings */

    document.getElementById('res-search').addEventListener('input', (e) => {
      query = e.target.value.trim();
      paintBody();
    });
    document.getElementById('res-add').addEventListener('click', () => openForm(null));
    document.getElementById('res-import').addEventListener('click', openImport);
    document.getElementById('res-export').addEventListener('click', () => {
      const list = rows();
      if (!list.length) { UI.toast('Nothing to export', 'warn'); return; }
      const keys = Object.keys(list[0]).filter((k) => !k.startsWith('gs_') && k !== 'deleted');
      UI.downloadText(`${def.table}_export.csv`, UI.toCSV(list, keys.map((k) => ({ key: k, label: k }))));
      UI.toast('Export downloaded', 'success');
    });

    paintAll();
  };
}

Views.fleet = buildResourceView('vehicles', 'Relief Transport Assets', 'Trucks, boats and rotary-wing capacity');
Views.inventory = buildResourceView('supplies', 'Warehouse Inventory', 'Supply lines with dimensional and urgency data');
Views.sites = buildResourceView('sites', 'Sites & Depots', 'Destination nodes and staging warehouses');
