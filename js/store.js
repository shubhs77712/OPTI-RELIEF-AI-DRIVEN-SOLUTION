/* ==========================================================================
   OptiRelief — Data Layer
   --------------------------------------------------------------------------
   Two-tier persistence:
     • Remote  — RESTful Table API (tables/{table}) — source of truth.
     • Local   — Dexie/IndexedDB mirror + outbound sync queue, so field
                 workers keep working with no connectivity.

   Every read hits the network first and refreshes the mirror; on failure it
   transparently falls back to the mirror. Every write goes to the queue when
   offline and is flushed automatically once connectivity returns.
   ========================================================================== */

const TABLES = ['vehicles', 'supplies', 'sites', 'alerts', 'dispatches'];

/* ------------------------------------------------------------ Dexie setup */

const db = new Dexie('optirelief');
db.version(1).stores({
  vehicles: 'id',
  supplies: 'id',
  sites: 'id',
  alerts: 'id',
  dispatches: 'id',
  outbox: '++seq, table, op, created_at',
  meta: 'key'
});

/* --------------------------------------------------------- online tracking */

const netState = {
  online: navigator.onLine,
  listeners: new Set()
};

function onNetChange(fn) {
  netState.listeners.add(fn);
  return () => netState.listeners.delete(fn);
}

function emitNet() {
  netState.listeners.forEach((fn) => {
    try { fn(netState.online); } catch (e) { console.warn(e); }
  });
}

window.addEventListener('online', () => {
  netState.online = true;
  emitNet();
  flushOutbox();
});
window.addEventListener('offline', () => {
  netState.online = false;
  emitNet();
});

/* ------------------------------------------------------------ REST helpers */

async function req(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!res.ok) throw new Error('HTTP ' + res.status + ' on ' + path);
  if (res.status === 204) return null;
  return res.json();
}

/* ------------------------------------------------------------ Seed data for Langtang Valley */

const LANGTANG_SEED = {
  sites: [
    {
      id: 'site-syabrubesi',
      site_name: 'Syabrubesi Roadhead Logistics Depot',
      kind: 'Warehouse',
      lat: 28.1580,
      lng: 85.3330,
      urgency: 0,
      need_severity: 0,
      transport_time: 0,
      population: 1460,
      status: 'Depot'
    },
    {
      id: 'site-dhunche',
      site_name: 'Dhunche District Forward HQ',
      kind: 'Warehouse',
      lat: 28.1130,
      lng: 85.3020,
      urgency: 0,
      need_severity: 0,
      transport_time: 1.2,
      population: 2800,
      status: 'Depot'
    },
    {
      id: 'site-bamboo',
      site_name: 'Bamboo / Pahare Outpost',
      kind: 'Disaster Site',
      lat: 28.1635,
      lng: 85.3780,
      urgency: 7,
      need_severity: 6,
      transport_time: 2.5,
      population: 280,
      status: 'High'
    },
    {
      id: 'site-rimche',
      site_name: 'Rimche High Junction',
      kind: 'Disaster Site',
      lat: 28.1720,
      lng: 85.4080,
      urgency: 8,
      need_severity: 7,
      transport_time: 3.5,
      population: 340,
      status: 'High'
    },
    {
      id: 'site-lamahotel',
      site_name: 'Lama Hotel Relief Station',
      kind: 'Disaster Site',
      lat: 28.1760,
      lng: 85.4240,
      urgency: 9,
      need_severity: 8,
      transport_time: 4.5,
      population: 650,
      status: 'Critical'
    },
    {
      id: 'site-ghodatabela',
      site_name: 'Ghodatabela Checkpost & Helipad',
      kind: 'Disaster Site',
      lat: 28.2040,
      lng: 85.4850,
      urgency: 8,
      need_severity: 8,
      transport_time: 6.0,
      population: 420,
      status: 'High'
    },
    {
      id: 'site-thangshyap',
      site_name: 'Thangshyap Relief Camp',
      kind: 'Disaster Site',
      lat: 28.2130,
      lng: 85.5140,
      urgency: 8,
      need_severity: 7,
      transport_time: 7.0,
      population: 310,
      status: 'High'
    },
    {
      id: 'site-langtang',
      site_name: 'Langtang Village Ground Zero',
      kind: 'Disaster Site',
      lat: 28.2140,
      lng: 85.5390,
      urgency: 10,
      need_severity: 10,
      transport_time: 8.5,
      population: 1850,
      status: 'Critical'
    },
    {
      id: 'site-mundu',
      site_name: 'Mundu Shelter Cluster',
      kind: 'Disaster Site',
      lat: 28.2170,
      lng: 85.5510,
      urgency: 9,
      need_severity: 8,
      transport_time: 9.5,
      population: 480,
      status: 'Critical'
    },
    {
      id: 'site-kyanjin',
      site_name: 'Kyanjin Gompa Evac & Medical Base',
      kind: 'Disaster Site',
      lat: 28.2125,
      lng: 85.5680,
      urgency: 10,
      need_severity: 9,
      transport_time: 11.0,
      population: 1200,
      status: 'Critical'
    },
    {
      id: 'site-kyanjinri',
      site_name: 'Kyanjin Ri High Observation Camp',
      kind: 'Disaster Site',
      lat: 28.2250,
      lng: 85.5720,
      urgency: 7,
      need_severity: 7,
      transport_time: 13.0,
      population: 150,
      status: 'High'
    }
  ],
  vehicles: [
    {
      id: 'v-chopper-01',
      vehicle_code: 'HELO-B3-01',
      type: 'Helicopter',
      max_weight: 1400,
      max_volume: 4.5,
      length: 2.1,
      width: 1.4,
      height: 1.5,
      status: 'Available',
      base: 'Syabrubesi Roadhead Logistics Depot',
      speed_kmh: 220
    },
    {
      id: 'v-chopper-02',
      vehicle_code: 'HELO-MI17-02',
      type: 'Helicopter',
      max_weight: 4000,
      max_volume: 23.0,
      length: 5.3,
      width: 2.3,
      height: 1.8,
      status: 'Available',
      base: 'Dhunche District Forward HQ',
      speed_kmh: 210
    },
    {
      id: 'v-truck-01',
      vehicle_code: 'TRK-UNIMOG-01',
      type: 'Truck',
      max_weight: 6500,
      max_volume: 18.0,
      length: 4.2,
      width: 2.2,
      height: 1.9,
      status: 'Available',
      base: 'Syabrubesi Roadhead Logistics Depot',
      speed_kmh: 45
    },
    {
      id: 'v-truck-02',
      vehicle_code: 'TRK-TATA4X4-02',
      type: 'Truck',
      max_weight: 4200,
      max_volume: 14.5,
      length: 3.6,
      width: 2.0,
      height: 1.8,
      status: 'Available',
      base: 'Dhunche District Forward HQ',
      speed_kmh: 40
    },
    {
      id: 'v-mule-01',
      vehicle_code: 'PACK-MULE-ALP1',
      type: 'Truck',
      max_weight: 1200,
      max_volume: 6.0,
      length: 3.0,
      width: 1.5,
      height: 1.3,
      status: 'Available',
      base: 'Syabrubesi Roadhead Logistics Depot',
      speed_kmh: 8
    }
  ],
  supplies: [
    {
      id: 's-med-trauma',
      sku: 'MED-HIMAL-01',
      name: 'High-Altitude Trauma Medical Kit',
      category: 'Medical',
      unit_weight: 25,
      unit_volume: 0.09,
      length: 0.6,
      width: 0.5,
      height: 0.3,
      qty_available: 80,
      urgency: 10,
      warehouse: 'Syabrubesi Roadhead Logistics Depot'
    },
    {
      id: 's-med-oxygen',
      sku: 'MED-OXY-PORT',
      name: 'Portable High-Altitude O2 Concentrator',
      category: 'Medical',
      unit_weight: 18,
      unit_volume: 0.064,
      length: 0.4,
      width: 0.4,
      height: 0.4,
      qty_available: 45,
      urgency: 10,
      warehouse: 'Syabrubesi Roadhead Logistics Depot'
    },
    {
      id: 's-wat-purif',
      sku: 'WAT-PUR-TABS',
      name: 'Aquatabs & Water Filtration Units',
      category: 'Water',
      unit_weight: 15,
      unit_volume: 0.048,
      length: 0.4,
      width: 0.4,
      height: 0.3,
      qty_available: 250,
      urgency: 9,
      warehouse: 'Syabrubesi Roadhead Logistics Depot'
    },
    {
      id: 's-wat-can',
      sku: 'WAT-CAN-10L',
      name: 'Insulated Water Jerrycan (10L)',
      category: 'Water',
      unit_weight: 11,
      unit_volume: 0.027,
      length: 0.3,
      width: 0.3,
      height: 0.3,
      qty_available: 400,
      urgency: 8,
      warehouse: 'Syabrubesi Roadhead Logistics Depot'
    },
    {
      id: 's-foo-ration',
      sku: 'FOO-ALP-RATION',
      name: 'High-Calorie Himalayan Survival Rations',
      category: 'Food',
      unit_weight: 28,
      unit_volume: 0.084,
      length: 0.6,
      width: 0.4,
      height: 0.35,
      qty_available: 350,
      urgency: 9,
      warehouse: 'Syabrubesi Roadhead Logistics Depot'
    },
    {
      id: 's-foo-grain',
      sku: 'FOO-GRAIN-25K',
      name: 'Fortified Grain & Flour Sack (25kg)',
      category: 'Food',
      unit_weight: 25,
      unit_volume: 0.05,
      length: 0.5,
      width: 0.4,
      height: 0.25,
      qty_available: 300,
      urgency: 7,
      warehouse: 'Dhunche District Forward HQ'
    },
    {
      id: 's-she-tent',
      sku: 'SHE-SUBZERO-TENT',
      name: 'Sub-Zero Mountain Relief Tent (6-Person)',
      category: 'Shelter',
      unit_weight: 38,
      unit_volume: 0.168,
      length: 0.8,
      width: 0.6,
      height: 0.35,
      qty_available: 120,
      urgency: 9,
      warehouse: 'Syabrubesi Roadhead Logistics Depot'
    },
    {
      id: 's-she-blanket',
      sku: 'SHE-THERMAL-BLANKET',
      name: 'Thermal Wool Blanket Bale (x20)',
      category: 'Shelter',
      unit_weight: 22,
      unit_volume: 0.12,
      length: 0.6,
      width: 0.5,
      height: 0.4,
      qty_available: 180,
      urgency: 8,
      warehouse: 'Syabrubesi Roadhead Logistics Depot'
    },
    {
      id: 's-eqp-sat',
      sku: 'EQP-SAT-COMMS',
      name: 'Emergency Satellite Comms & Beacon',
      category: 'Equipment',
      unit_weight: 12,
      unit_volume: 0.036,
      length: 0.4,
      width: 0.3,
      height: 0.3,
      qty_available: 30,
      urgency: 9,
      warehouse: 'Syabrubesi Roadhead Logistics Depot'
    },
    {
      id: 's-eqp-gen',
      sku: 'EQP-ALP-GEN',
      name: 'Extreme-Altitude Power Generator',
      category: 'Equipment',
      unit_weight: 65,
      unit_volume: 0.24,
      length: 0.8,
      width: 0.6,
      height: 0.5,
      qty_available: 15,
      urgency: 7,
      warehouse: 'Syabrubesi Roadhead Logistics Depot'
    }
  ],
  alerts: [
    {
      id: 'alt-01',
      region: 'Langtang Village Ground Zero',
      message: 'CRITICAL: Post-seismic avalanche debris field blocking lower trail. 1,850 individuals requiring immediate sub-zero shelter, trauma dressings and food airdrop.',
      level: 'Critical',
      requested: 'MED-HIMAL-01 (x25), SHE-SUBZERO-TENT (x40), FOO-ALP-RATION (x60)',
      created_ts: new Date(Date.now() - 1000 * 60 * 18).toISOString()
    },
    {
      id: 'alt-02',
      region: 'Kyanjin Gompa High Evac Base',
      message: 'CRITICAL: Severe hypothermia and altitude sickness cases reported. Medical oxygen concentrators and warm winter thermal blankets urgently needed.',
      level: 'Critical',
      requested: 'MED-OXY-PORT (x15), SHE-THERMAL-BLANKET (x50), WAT-PUR-TABS (x40)',
      created_ts: new Date(Date.now() - 1000 * 60 * 45).toISOString()
    },
    {
      id: 'alt-03',
      region: 'Lama Hotel Relief Station',
      message: 'HIGH: Syabrubesi-to-Lama Hotel corridor cleared for mule pack trains. Forward transit hub ready to stage supplies toward Ghodatabela.',
      level: 'High',
      requested: 'FOO-ALP-RATION (x30), WAT-CAN-10L (x50)',
      created_ts: new Date(Date.now() - 1000 * 60 * 110).toISOString()
    }
  ],
  dispatches: []
};

/**
 * GET /api/v1/{table} equivalent — list a table, cache it locally.
 * Pre-populates Langtang Valley default seed data when empty.
 */
async function list(table, { limit = 500 } = {}) {
  if (netState.online) {
    try {
      const json = await req(`tables/${table}?limit=${limit}`);
      const rows = (json.data || []).filter((r) => !r.deleted);
      if (rows.length) {
        await db.table(table).bulkPut(rows);
        await db.meta.put({ key: 'synced:' + table, value: Date.now() });
        return rows;
      }
    } catch (err) {
      // Remote table API offline/mock environment — fallback to mirror / seed
    }
  }

  let local = await db.table(table).toArray();
  if (!local.length && LANGTANG_SEED[table]) {
    const seedRows = LANGTANG_SEED[table];
    await db.table(table).bulkPut(seedRows);
    local = seedRows;
  }
  return local;
}

async function create(table, row) {
  const record = { ...row };
  if (!record.id) record.id = cryptoId();

  if (netState.online) {
    try {
      const saved = await req(`tables/${table}`, { method: 'POST', body: JSON.stringify(record) });
      await db.table(table).put(saved);
      return { row: saved, queued: false };
    } catch (err) {
      // Offline fallback
    }
  }
  await db.table(table).put(record);
  await enqueue(table, 'create', record);
  return { row: record, queued: true };
}

async function update(table, id, patch) {
  if (netState.online) {
    try {
      const saved = await req(`tables/${table}/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
      await db.table(table).put(saved);
      return { row: saved, queued: false };
    } catch (err) {
      // Offline fallback
    }
  }
  const local = (await db.table(table).get(id)) || { id };
  const merged = { ...local, ...patch, id };
  await db.table(table).put(merged);
  await enqueue(table, 'update', merged);
  return { row: merged, queued: true };
}

async function remove(table, id) {
  if (netState.online) {
    try {
      await req(`tables/${table}/${id}`, { method: 'DELETE' });
      await db.table(table).delete(id);
      return { queued: false };
    } catch (err) {
      // Offline fallback
    }
  }
  await db.table(table).delete(id);
  await enqueue(table, 'delete', { id });
  return { queued: true };
}

/** Bulk create — used by the CSV importer. */
async function createMany(table, rows) {
  let synced = 0;
  let queued = 0;
  for (const row of rows) {
    const res = await create(table, row);
    if (res.queued) queued++; else synced++;
  }
  return { synced, queued, total: rows.length };
}

/* ------------------------------------------------------------- sync outbox */

function cryptoId() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

async function enqueue(table, op, payload) {
  await db.outbox.add({ table, op, payload, created_at: Date.now(), attempts: 0 });
  notifyOutbox();
  requestBackgroundSync();
}

async function outboxCount() {
  return db.outbox.count();
}

async function outboxItems() {
  return db.outbox.orderBy('created_at').toArray();
}

const outboxListeners = new Set();
function onOutboxChange(fn) {
  outboxListeners.add(fn);
  return () => outboxListeners.delete(fn);
}
async function notifyOutbox() {
  const n = await outboxCount();
  outboxListeners.forEach((fn) => { try { fn(n); } catch (e) { console.warn(e); } });
}

/**
 * POST /api/v1/sync equivalent — drain queued offline mutations in order.
 */
async function flushOutbox() {
  if (!netState.online) return { flushed: 0, failed: 0, offline: true };
  const items = await outboxItems();
  if (!items.length) return { flushed: 0, failed: 0 };

  let flushed = 0;
  let failed = 0;

  for (const item of items) {
    try {
      if (item.op === 'create') {
        await req(`tables/${item.table}`, { method: 'POST', body: JSON.stringify(item.payload) });
      } else if (item.op === 'update') {
        await req(`tables/${item.table}/${item.payload.id}`, {
          method: 'PATCH', body: JSON.stringify(item.payload)
        });
      } else if (item.op === 'delete') {
        await req(`tables/${item.table}/${item.payload.id}`, { method: 'DELETE' });
      }
      await db.outbox.delete(item.seq);
      flushed++;
    } catch (err) {
      // Creates that were already accepted server-side must not block the
      // queue forever; retire after 4 attempts.
      const attempts = (item.attempts || 0) + 1;
      if (attempts >= 4) {
        await db.outbox.delete(item.seq);
      } else {
        await db.outbox.update(item.seq, { attempts });
      }
      failed++;
    }
  }
  await notifyOutbox();
  await db.meta.put({ key: 'last_sync', value: Date.now() });
  return { flushed, failed };
}

function requestBackgroundSync() {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready
      .then((reg) => reg.sync.register('optirelief-sync'))
      .catch(() => { /* Background Sync unsupported — periodic flush covers it */ });
  }
}

/* Service worker may signal that connectivity returned. */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (evt) => {
    if (evt.data && evt.data.type === 'RUN_SYNC') flushOutbox();
  });
}

/* Safety net for browsers without Background Sync. */
setInterval(() => { if (netState.online) flushOutbox(); }, 45000);

/* ------------------------------------------------------------ health probe */

async function health() {
  const t0 = performance.now();
  const out = {
    status: 'degraded',
    online: netState.online,
    latency_ms: null,
    tables: {},
    queued: await outboxCount(),
    last_sync: null,
    sw: 'serviceWorker' in navigator
      ? (navigator.serviceWorker.controller ? 'active' : 'registered')
      : 'unsupported'
  };
  const lastSync = await db.meta.get('last_sync');
  out.last_sync = lastSync ? lastSync.value : null;

  try {
    const json = await req('tables/sites?limit=1');
    out.latency_ms = Math.round(performance.now() - t0);
    out.status = 'operational';
    out.schema_ok = !!json.schema;
  } catch (err) {
    out.status = netState.online ? 'unreachable' : 'offline';
  }
  for (const t of TABLES) {
    out.tables[t] = await db.table(t).count();
  }
  return out;
}

async function localCounts() {
  const out = {};
  for (const t of TABLES) out[t] = await db.table(t).count();
  return out;
}

window.OptiStore = {
  db, TABLES,
  list, create, update, remove, createMany,
  flushOutbox, outboxCount, outboxItems, onOutboxChange, notifyOutbox,
  onNetChange, isOnline: () => netState.online,
  health, localCounts, cryptoId
};
