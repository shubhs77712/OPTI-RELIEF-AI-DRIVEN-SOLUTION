/* ==========================================================================
   OptiRelief — Optimization Engine
   --------------------------------------------------------------------------
   Multi-constraint relief allocation solver. Mirrors the reference Python
   engine (app/engine/solver.py) one-for-one so manifests are identical
   whether computed in the field (offline, here) or on a central server.

   Pipeline
     1. Dynamic priority index per supply line
     2. Value-density ordering (priority per unit weight & volume)
     3. Greedy multi-knapsack fill across the selected fleet
     4. Extreme-point 3D placement with axis rotations (non-overlapping)
     5. Manifest roll-up + spatial coordinate matrix for rendering
   ========================================================================== */

const CATEGORY_COLORS = {
  Medical: '#ef4444',
  Water: '#3b82f6',
  Food: '#22c55e',
  Shelter: '#f59e0b',
  Equipment: '#a855f7'
};

const EPS = 1e-6;

/* ---------------------------------------------------------------- helpers */

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

function round(v, dp = 3) {
  const f = Math.pow(10, dp);
  return Math.round(v * f) / f;
}

/**
 * Dynamic priority index.
 *   Priority = (Urgency * 0.6) + (NeedSeverity / TransportTime * 0.4)
 * Transport time is floored so a near-zero ETA cannot produce a runaway term,
 * and the logistics term is normalised onto the same 1-10 band as urgency.
 */
function priorityIndex(urgency, needSeverity, transportTime) {
  const u = clamp(Number(urgency) || 0, 0, 10);
  const sev = clamp(Number(needSeverity) || 0, 0, 10);
  const t = Math.max(Number(transportTime) || 0, 0.5);
  const logistics = clamp((sev / t) * 2.2, 0, 10);
  return round(u * 0.6 + logistics * 0.4, 4);
}

/** Six axis-aligned orientations of a box. */
function orientations(l, w, h) {
  return [
    [l, w, h], [l, h, w],
    [w, l, h], [w, h, l],
    [h, l, w], [h, w, l]
  ];
}

function boxesOverlap(a, b) {
  return (
    a.x + a.l > b.x + EPS && b.x + b.l > a.x + EPS &&
    a.y + a.w > b.y + EPS && b.y + b.w > a.y + EPS &&
    a.z + a.h > b.z + EPS && b.z + b.h > a.z + EPS
  );
}

/* ------------------------------------------------------- 3D bin container */

/**
 * Extreme-point packer for one vehicle cargo bed.
 * Axes: x = length (depth), y = width, z = height (stacking axis).
 */
class Container {
  constructor(vehicle) {
    this.L = Number(vehicle.length) || 0;
    this.W = Number(vehicle.width) || 0;
    this.H = Number(vehicle.height) || 0;
    this.maxWeight = Number(vehicle.max_weight) || 0;
    this.maxVolume = Number(vehicle.max_volume) || 0;
    this.placed = [];
    this.weight = 0;
    this.volume = 0;
    // Candidate anchor corners, seeded with the bed's origin.
    this.anchors = [{ x: 0, y: 0, z: 0 }];
  }

  fits(cand) {
    if (cand.x + cand.l > this.L + EPS) return false;
    if (cand.y + cand.w > this.W + EPS) return false;
    if (cand.z + cand.h > this.H + EPS) return false;
    for (const p of this.placed) {
      if (boxesOverlap(cand, p)) return false;
    }
    return true;
  }

  /**
   * A box may only rest on the floor or on top of another box's face —
   * prevents physically implausible floating placements.
   */
  isSupported(cand) {
    if (cand.z <= EPS) return true;
    const need = cand.l * cand.w * 0.55;
    let covered = 0;
    for (const p of this.placed) {
      if (Math.abs(p.z + p.h - cand.z) > 0.02) continue;
      const ox = Math.min(p.x + p.l, cand.x + cand.l) - Math.max(p.x, cand.x);
      const oy = Math.min(p.y + p.w, cand.y + cand.w) - Math.max(p.y, cand.y);
      if (ox > 0 && oy > 0) covered += ox * oy;
      if (covered >= need) return true;
    }
    return covered >= need;
  }

  /** Try to seat one unit; returns the placement or null. */
  place(unit) {
    if (this.weight + unit.weight > this.maxWeight + EPS) return null;
    if (this.volume + unit.volume > this.maxVolume + EPS) return null;

    // Deepest-bottom-leftmost anchor ordering yields dense, stable stacks.
    const anchors = this.anchors.slice().sort(
      (a, b) => (a.z - b.z) || (a.x - b.x) || (a.y - b.y)
    );

    let best = null;
    for (const a of anchors) {
      for (const [l, w, h] of orientations(unit.l, unit.w, unit.h)) {
        const cand = { x: a.x, y: a.y, z: a.z, l, w, h };
        if (!this.fits(cand)) continue;
        if (!this.isSupported(cand)) continue;
        // Score: hug the floor, then the back wall, then the side wall.
        const score = cand.z * 1000 + cand.x * 10 + cand.y;
        if (!best || score < best.score) best = { cand, score };
      }
      if (best && best.cand.z <= EPS) break; // good enough, keep it fast
    }
    if (!best) return null;

    const box = Object.assign({}, best.cand, {
      item_id: unit.item_id,
      sku: unit.sku,
      name: unit.name,
      category: unit.category,
      weight: unit.weight,
      volume: unit.volume,
      priority: unit.priority,
      color: CATEGORY_COLORS[unit.category] || '#94a3b8'
    });

    this.placed.push(box);
    this.weight += unit.weight;
    this.volume += unit.volume;

    // Spawn new anchors on the three exposed faces.
    this.anchors.push(
      { x: round(box.x + box.l), y: box.y, z: box.z },
      { x: box.x, y: round(box.y + box.w), z: box.z },
      { x: box.x, y: box.y, z: round(box.z + box.h) }
    );
    this.pruneAnchors();
    return box;
  }

  /**
   * Drop anchors that can never host another box — duplicates, points outside
   * the bed, and points buried inside an already-placed crate. Truncating the
   * list blindly would discard live anchors and stall the fill early, so only
   * provably dead ones are removed.
   */
  pruneAnchors() {
    const seen = new Set();
    const kept = [];
    for (const a of this.anchors) {
      const key = a.x.toFixed(3) + '|' + a.y.toFixed(3) + '|' + a.z.toFixed(3);
      if (seen.has(key)) continue;
      seen.add(key);
      if (a.x >= this.L - EPS || a.y >= this.W - EPS || a.z >= this.H - EPS) continue;

      let buried = false;
      for (const p of this.placed) {
        if (a.x > p.x - EPS && a.x < p.x + p.l - EPS &&
            a.y > p.y - EPS && a.y < p.y + p.w - EPS &&
            a.z > p.z - EPS && a.z < p.z + p.h - EPS) { buried = true; break; }
      }
      if (!buried) kept.push(a);
    }
    this.anchors = kept;
  }
}

/* ---------------------------------------------------------- main solver */

/**
 * @param {Array}  vehicles  fleet assets selected for this run
 * @param {Array}  supplies  warehouse supply lines
 * @param {Object} dest      { site_name, urgency, need_severity, transport_time }
 * @param {Object} opts      { strategy, unitCap }
 */
function optimizeAllocation(vehicles, supplies, dest, opts = {}) {
  const t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const strategy = opts.strategy || 'balanced';
  const unitCap = opts.unitCap || 900;

  const destUrgency = clamp(Number(dest && dest.urgency) || 5, 0, 10);
  const destSeverity = clamp(Number(dest && dest.need_severity) || 5, 0, 10);
  const transportTime = Math.max(Number(dest && dest.transport_time) || 1, 0.5);

  /* --- 1. Score each supply line ------------------------------------- */
  const lines = supplies
    .filter((s) => (Number(s.qty_available) || 0) > 0)
    .map((s) => {
      // The destination's own urgency lifts every line dispatched to it.
      const effUrgency = clamp(
        (Number(s.urgency) || 1) * 0.65 + destUrgency * 0.35, 0, 10
      );
      const priority = priorityIndex(effUrgency, destSeverity, transportTime);
      const weight = Math.max(Number(s.unit_weight) || 0.01, 0.01);
      const volume = Math.max(
        Number(s.unit_volume) ||
          (Number(s.length) || 0.1) * (Number(s.width) || 0.1) * (Number(s.height) || 0.1),
        0.0001
      );

      let density;
      if (strategy === 'weight') density = priority / weight;
      else if (strategy === 'volume') density = priority / volume;
      else if (strategy === 'urgency') density = priority * 1000;
      else density = priority / (weight * 0.5 + volume * 220 * 0.5); // balanced

      return {
        ref: s,
        item_id: s.id,
        sku: s.sku || s.id,
        name: s.name,
        category: s.category || 'Equipment',
        l: Number(s.length) || 0.3,
        w: Number(s.width) || 0.3,
        h: Number(s.height) || 0.3,
        weight,
        volume,
        priority,
        density,
        qty: Math.max(0, Math.floor(Number(s.qty_available) || 0)),
        remaining: Math.max(0, Math.floor(Number(s.qty_available) || 0))
      };
    })
    .sort((a, b) => b.density - a.density || b.priority - a.priority);

  const totalRequestedPriority = lines.reduce((sum, l) => sum + l.priority * l.qty, 0);

  /* --- 2. Fill vehicles, richest-capacity first ---------------------- */
  const fleet = vehicles
    .slice()
    .sort((a, b) => (Number(b.max_volume) || 0) - (Number(a.max_volume) || 0));

  const loads = [];

  for (const v of fleet) {
    const bin = new Container(v);
    const lineTally = new Map();
    let units = 0;

    // Round-robin passes keep category mix representative rather than
    // exhausting the single densest line first. The loop only ends when a
    // whole pass seats nothing — so the bed is genuinely full, not merely
    // awkward for one line.
    let progress = true;
    while (progress && units < unitCap) {
      progress = false;
      for (const line of lines) {
        if (line.remaining <= 0) continue;
        if (units >= unitCap) break;
        if (bin.weight + line.weight > bin.maxWeight + EPS) continue;
        if (bin.volume + line.volume > bin.maxVolume + EPS) continue;

        const batch = strategy === 'urgency' ? line.remaining : Math.max(1, Math.ceil(line.remaining / 6));
        let seated = 0;
        for (let i = 0; i < batch; i++) {
          if (line.remaining <= 0 || units >= unitCap) break;
          const box = bin.place(line);
          if (!box) break;
          line.remaining--;
          units++;
          seated++;
          const t = lineTally.get(line.item_id) || {
            item_id: line.item_id, sku: line.sku, name: line.name,
            category: line.category, priority: line.priority,
            unit_weight: line.weight, unit_volume: line.volume, qty: 0
          };
          t.qty += 1;
          lineTally.set(line.item_id, t);
        }
        if (seated > 0) progress = true;
      }
    }

    const capW = Number(v.max_weight) || 1;
    const capV = Number(v.max_volume) || 1;
    const packedPriority = bin.placed.reduce((s, b) => s + b.priority, 0);

    loads.push({
      vehicle_id: v.id,
      vehicle_code: v.vehicle_code || v.id,
      vehicle_type: v.type,
      base: v.base || '—',
      container: { length: bin.L, width: bin.W, height: bin.H },
      capacity: { max_weight: capW, max_volume: capV },
      used_weight: round(bin.weight, 2),
      used_volume: round(bin.volume, 3),
      weight_util: round((bin.weight / capW) * 100, 1),
      volume_util: round((bin.volume / capV) * 100, 1),
      packed_priority: round(packedPriority, 2),
      unit_count: bin.placed.length,
      lines: Array.from(lineTally.values()).sort((a, b) => b.priority - a.priority),
      // Spatial coordinate matrix for the 3D renderer.
      boxes: bin.placed.map((b, i) => ({
        seq: i + 1,
        item_id: b.item_id,
        sku: b.sku,
        name: b.name,
        category: b.category,
        x: round(b.x), y: round(b.y), z: round(b.z),
        length: round(b.l), width: round(b.w), height: round(b.h),
        weight: b.weight,
        priority: b.priority,
        color: b.color
      }))
    });
  }

  /* --- 3. Roll-up ---------------------------------------------------- */
  const unallocated = lines
    .filter((l) => l.remaining > 0)
    .map((l) => ({
      item_id: l.item_id, sku: l.sku, name: l.name, category: l.category,
      qty_unallocated: l.remaining, qty_requested: l.qty,
      priority: l.priority,
      shortfall_weight: round(l.remaining * l.weight, 1)
    }))
    .sort((a, b) => b.priority - a.priority);

  const totalWeight = loads.reduce((s, l) => s + l.used_weight, 0);
  const totalVolume = loads.reduce((s, l) => s + l.used_volume, 0);
  const capWeight = loads.reduce((s, l) => s + l.capacity.max_weight, 0) || 1;
  const capVolume = loads.reduce((s, l) => s + l.capacity.max_volume, 0) || 1;
  const packedPriority = loads.reduce((s, l) => s + l.packed_priority, 0);
  const unitsPacked = loads.reduce((s, l) => s + l.unit_count, 0);

  // High-priority coverage: share of urgency >= 8 stock actually loaded.
  const hiLines = lines.filter((l) => (Number(l.ref.urgency) || 0) >= 8);
  const hiRequested = hiLines.reduce((s, l) => s + l.qty, 0);
  const hiPacked = hiLines.reduce((s, l) => s + (l.qty - l.remaining), 0);
  const hiCoverage = hiRequested ? round((hiPacked / hiRequested) * 100, 1) : 100;

  const weightUtil = round((totalWeight / capWeight) * 100, 1);
  const volumeUtil = round((totalVolume / capVolume) * 100, 1);
  const priorityCapture = totalRequestedPriority
    ? round((packedPriority / totalRequestedPriority) * 100, 1) : 0;

  // Composite score: how well the run used its cube, its payload and its
  // urgency mandate.
  const efficiency = round(
    volumeUtil * 0.4 + weightUtil * 0.25 + hiCoverage * 0.35, 1
  );

  const byCategory = {};
  for (const load of loads) {
    for (const b of load.boxes) {
      const c = byCategory[b.category] || { units: 0, weight: 0, color: CATEGORY_COLORS[b.category] || '#94a3b8' };
      c.units += 1;
      c.weight = round(c.weight + b.weight, 1);
      byCategory[b.category] = c;
    }
  }

  return {
    ok: true,
    generated_at: new Date().toISOString(),
    manifest_ref: 'MF-' + Date.now().toString(36).toUpperCase(),
    destination: {
      site_name: (dest && dest.site_name) || 'Unassigned',
      urgency: destUrgency,
      need_severity: destSeverity,
      transport_time: transportTime
    },
    strategy,
    summary: {
      vehicles_used: loads.filter((l) => l.unit_count > 0).length,
      vehicles_selected: loads.length,
      units_packed: unitsPacked,
      total_weight: round(totalWeight, 1),
      total_volume: round(totalVolume, 3),
      capacity_weight: round(capWeight, 1),
      capacity_volume: round(capVolume, 3),
      weight_util: weightUtil,
      volume_util: volumeUtil,
      high_priority_coverage: hiCoverage,
      priority_capture: priorityCapture,
      packed_priority: round(packedPriority, 2),
      efficiency,
      unallocated_lines: unallocated.length,
      by_category: byCategory,
      solve_ms: Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0)
    },
    loads,
    unallocated
  };
}

window.OptiSolver = { optimizeAllocation, priorityIndex, CATEGORY_COLORS };
