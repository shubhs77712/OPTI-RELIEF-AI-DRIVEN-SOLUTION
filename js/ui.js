/* ==========================================================================
   OptiRelief — Shared UI primitives
   ========================================================================== */

const CAT_COLORS = {
  Medical: '#ef4444',
  Water: '#3b82f6',
  Food: '#22c55e',
  Shelter: '#f59e0b',
  Equipment: '#a855f7'
};

const CATEGORIES = Object.keys(CAT_COLORS);
const VEHICLE_TYPES = ['Truck', 'Boat', 'Helicopter'];
const VEHICLE_ICONS = { Truck: 'fa-truck-fast', Boat: 'fa-ship', Helicopter: 'fa-helicopter' };

/* ------------------------------------------------------------- formatting */

function esc(v) {
  if (v === null || v === undefined) return '';
  return String(v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function num(v, dp = 0) {
  const n = Number(v);
  if (!isFinite(n)) return '—';
  return n.toLocaleString(undefined, { minimumFractionDigits: dp, maximumFractionDigits: dp });
}

function fmtKg(kg) {
  const n = Number(kg) || 0;
  return n >= 1000 ? num(n / 1000, 2) + ' t' : num(n, 0) + ' kg';
}

function timeAgo(ts) {
  if (!ts) return '—';
  const t = typeof ts === 'number' ? ts : Date.parse(ts);
  if (!isFinite(t)) return '—';
  const d = Math.floor((Date.now() - t) / 1000);
  if (d < 60) return d + 's ago';
  if (d < 3600) return Math.floor(d / 60) + 'm ago';
  if (d < 86400) return Math.floor(d / 3600) + 'h ago';
  return Math.floor(d / 86400) + 'd ago';
}

function statusBadgeClass(status) {
  const s = String(status || '').toLowerCase();
  if (s.includes('critical')) return 'badge-critical';
  if (s.includes('high')) return 'badge-high';
  if (s.includes('moderate') || s.includes('transit') || s.includes('info')) return 'badge-moderate';
  if (s.includes('stable') || s.includes('available') || s.includes('deliver') || s.includes('sync')) return 'badge-stable';
  return 'badge-muted';
}

function urgencyColor(u) {
  const n = Number(u) || 0;
  if (n >= 9) return '#ef4444';
  if (n >= 7) return '#f59e0b';
  if (n >= 5) return '#38bdf8';
  return '#22c55e';
}

function catDot(cat) {
  return `<span class="cat-dot" style="background:${CAT_COLORS[cat] || '#94a3b8'}"></span>`;
}

/* ---------------------------------------------------------------- toasts */

function toast(message, kind = 'info', ms = 3600) {
  const host = document.getElementById('toast-stack');
  if (!host) return;
  const icons = {
    info: 'fa-circle-info text-sky-400',
    success: 'fa-circle-check text-emerald-400',
    warn: 'fa-triangle-exclamation text-amber-400',
    error: 'fa-circle-xmark text-red-400'
  };
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<i class="fa-solid ${icons[kind] || icons.info} mt-0.5"></i>
    <span class="flex-1 text-slate-200">${esc(message)}</span>`;
  host.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity .25s, transform .25s';
    el.style.opacity = '0';
    el.style.transform = 'translateY(6px)';
    setTimeout(() => el.remove(), 260);
  }, ms);
}

/* ----------------------------------------------------------------- modal */

function openModal(title, bodyHtml, opts = {}) {
  closeModal();
  const host = document.getElementById('modal-host');
  const wide = opts.wide ? 'max-w-3xl' : 'max-w-lg';
  const wrap = document.createElement('div');
  wrap.className = 'modal-backdrop';
  wrap.id = 'active-modal';
  wrap.innerHTML = `
    <section class="panel w-full ${wide} my-auto bg-white rounded-2xl shadow-2xl border hairline" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <header class="flex items-center gap-3 px-6 py-4 border-b hairline">
        <h3 class="font-semibold text-[#1d1d1f] text-[1.05rem] tracking-tight">${esc(title)}</h3>
        <button class="btn btn-ghost btn-xs ml-auto !p-1.5 text-[#7a7a7a] hover:text-[#1d1d1f]" data-modal-close aria-label="Close dialog">
          <i class="fa-solid fa-xmark text-sm"></i>
        </button>
      </header>
      <div class="p-6">${bodyHtml}</div>
    </section>`;
  host.appendChild(wrap);
  wrap.addEventListener('click', (e) => { if (e.target === wrap) closeModal(); });
  wrap.querySelector('[data-modal-close]').addEventListener('click', closeModal);
  document.addEventListener('keydown', escClose);
  return wrap;
}

function escClose(e) { if (e.key === 'Escape') closeModal(); }

function closeModal() {
  const m = document.getElementById('active-modal');
  if (m) m.remove();
  document.removeEventListener('keydown', escClose);
}

function confirmDialog(message, onYes, label = 'Delete') {
  const m = openModal('Please confirm', `
    <p class="text-[15px] text-[#1d1d1f] leading-relaxed">${esc(message)}</p>
    <div class="flex gap-2.5 justify-end mt-6">
      <button class="btn btn-secondary-pill px-4" data-no>Cancel</button>
      <button class="btn btn-danger px-4" data-yes><i class="fa-solid fa-trash-can mr-1"></i>${esc(label)}</button>
    </div>`);
  m.querySelector('[data-no]').addEventListener('click', closeModal);
  m.querySelector('[data-yes]').addEventListener('click', () => { closeModal(); onYes(); });
}

/* ------------------------------------------------------- form field maker */

function fieldRow(label, name, value, type = 'text', extra = {}) {
  if (type === 'select') {
    const opts = (extra.options || []).map(
      (o) => `<option value="${esc(o)}"${String(value) === String(o) ? ' selected' : ''}>${esc(o)}</option>`
    ).join('');
    return `<div><label class="field-label" for="f-${name}">${esc(label)}</label>
      <select class="field" id="f-${name}" name="${name}">${opts}</select></div>`;
  }
  const step = extra.step ? ` step="${extra.step}"` : (type === 'number' ? ' step="any"' : '');
  const min = extra.min !== undefined ? ` min="${extra.min}"` : '';
  const max = extra.max !== undefined ? ` max="${extra.max}"` : '';
  return `<div><label class="field-label" for="f-${name}">${esc(label)}</label>
    <input class="field" id="f-${name}" name="${name}" type="${type}"${step}${min}${max}
      value="${esc(value === undefined || value === null ? '' : value)}"
      ${extra.placeholder ? `placeholder="${esc(extra.placeholder)}"` : ''}></div>`;
}

function readForm(formEl, numericFields = []) {
  const out = {};
  new FormData(formEl).forEach((v, k) => {
    out[k] = numericFields.includes(k) ? (v === '' ? 0 : Number(v)) : String(v).trim();
  });
  return out;
}

/* ----------------------------------------------------------- CSV utilities */

/** Minimal RFC-4180 tolerant CSV parser (handles quotes and embedded commas). */
function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; }
        else inQuotes = false;
      } else cell += c;
      continue;
    }
    if (c === '"') { inQuotes = true; continue; }
    if (c === ',') { row.push(cell); cell = ''; continue; }
    if (c === '\r') continue;
    if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; continue; }
    cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }

  const clean = rows.filter((r) => r.some((v) => String(v).trim() !== ''));
  if (!clean.length) return { headers: [], records: [] };

  const headers = clean[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, '_'));
  const records = clean.slice(1).map((r) => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = (r[i] === undefined ? '' : String(r[i]).trim()); });
    return obj;
  });
  return { headers, records };
}

function toCSV(rows, columns) {
  const head = columns.map((c) => c.label).join(',');
  const body = rows.map((r) => columns.map((c) => {
    const v = typeof c.get === 'function' ? c.get(r) : r[c.key];
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }).join(',')).join('\n');
  return head + '\n' + body;
}

function downloadText(filename, text, mime = 'text/csv;charset=utf-8') {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/* ------------------------------------------------------------ small blocks */

function kpiCard({ label, value, unit, icon, tone = 'sky', foot, pct }) {
  const iconTones = {
    sky: 'bg-[#0066cc]/10 text-[#0066cc] border-[#0066cc]/20',
    red: 'bg-red-500/10 text-red-600 border-red-500/20',
    amber: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    green: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    violet: 'bg-purple-500/10 text-purple-600 border-purple-500/20'
  };
  const barColors = { sky: '#0066cc', red: '#ff3b30', amber: '#ff9500', green: '#34c759', violet: '#af52de' };
  return `<article class="panel p-5 bg-white border hairline rounded-2xl transition hover:border-[#d2d2d7]">
    <div class="flex items-start gap-3.5">
      <div class="w-10 h-10 rounded-xl grid place-items-center border ${iconTones[tone] || iconTones.sky} shrink-0">
        <i class="fa-solid ${icon} text-sm"></i>
      </div>
      <div class="min-w-0 flex-1">
        <p class="kpi-label text-[12px] font-semibold text-[#7a7a7a] tracking-tight uppercase">${esc(label)}</p>
        <p class="kpi-value font-mono-num text-[#1d1d1f] text-2xl sm:text-3xl font-semibold mt-0.5 tracking-tight">${value}<span class="text-sm font-normal text-[#7a7a7a] ml-1">${esc(unit || '')}</span></p>
      </div>
    </div>
    ${pct !== undefined ? `<div class="spark-bar mt-3.5"><div class="spark-fill" style="width:${Math.min(100, Math.max(0, pct))}%;background:${barColors[tone]}"></div></div>` : ''}
    ${foot ? `<p class="text-[12px] text-[#7a7a7a] mt-2 leading-tight">${foot}</p>` : ''}
  </article>`;
}

function emptyState(icon, title, sub, actionHtml = '') {
  return `<div class="text-center py-16 px-6">
    <div class="w-16 h-16 rounded-2xl grid place-items-center mx-auto bg-[#f5f5f7] border hairline">
      <i class="fa-solid ${icon} text-2xl text-[#7a7a7a]"></i>
    </div>
    <h4 class="mt-4 font-semibold text-[#1d1d1f] text-lg tracking-tight">${esc(title)}</h4>
    <p class="mt-1.5 text-sm text-[#7a7a7a] max-w-md mx-auto leading-relaxed">${esc(sub)}</p>
    ${actionHtml ? `<div class="mt-6">${actionHtml}</div>` : ''}
  </div>`;
}

function sectionHead(title, sub, rightHtml = '') {
  return `<div class="flex flex-wrap items-end gap-3 mb-4">
    <div>
      <h3 class="font-semibold text-[#1d1d1f] text-[18px] sm:text-[20px] tracking-tight">${esc(title)}</h3>
      ${sub ? `<p class="text-[12px] text-[#7a7a7a] mt-0.5 leading-snug">${esc(sub)}</p>` : ''}
    </div>
    <div class="ml-auto flex flex-wrap items-center gap-2">${rightHtml}</div>
  </div>`;
}

window.UI = {
  CAT_COLORS, CATEGORIES, VEHICLE_TYPES, VEHICLE_ICONS,
  esc, num, fmtKg, timeAgo, statusBadgeClass, urgencyColor, catDot,
  toast, openModal, closeModal, confirmDialog,
  fieldRow, readForm, parseCSV, toCSV, downloadText,
  kpiCard, emptyState, sectionHead
};
