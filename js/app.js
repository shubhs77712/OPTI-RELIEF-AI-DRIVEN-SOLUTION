/* ==========================================================================
   OptiRelief — Application shell, router and shared state
   SIH 26002 Compliant: Multilingual, RBAC, and Integration-Ready Providers
   ========================================================================== */

const App = {
  state: {
    vehicles: [], supplies: [], sites: [], alerts: [], dispatches: [],
    lastResult: null,       // most recent solver output
    loaded: false
  },

  routes: {
    dashboard: { title: 'Dashboard', sub: 'Operational overview and district accessibility intelligence', view: () => Views.dashboard },
    optimizer: { title: 'Optimization & Manifest Generator', sub: 'Multi-constraint solver with 3D load visualiser', view: () => Views.optimizer },
    map:       { title: 'Emergency Route & Zone Map', sub: 'Warehouses, transport corridors and disaster pins', view: () => Views.zonemap },
    fleet:     { title: 'Fleet Assets', sub: 'Trucks, boats and rotary-wing transport', view: () => Views.fleet },
    inventory: { title: 'Warehouse Inventory', sub: 'Relief supply lines and urgency scoring', view: () => Views.inventory },
    sites:     { title: 'Disaster Sites', sub: 'Destination nodes and severity indices', view: () => Views.sites },
    dispatch:  { title: 'Dispatch Log', sub: 'Generated manifests and offline queue', view: () => Views.dispatch },
    system:    { title: 'System & Sync', sub: 'Health, storage and background sync status', view: () => Views.system }
  },

  currentRoute: null,
  currentCleanup: null,

  /* ---------------------------------------------------------------- boot */

  async init() {
    this.bindChrome();
    this.startClock();
    this.registerServiceWorker();

    await this.refresh(true);
    this.state.loaded = true;

    window.addEventListener('hashchange', () => this.route());
    this.route();

    // Network + queue indicators
    OptiStore.onNetChange((online) => this.paintNet(online));
    OptiStore.onOutboxChange((n) => this.paintQueue(n));
    this.paintNet(OptiStore.isOnline());
    OptiStore.notifyOutbox();
  },

  /** Reload every table into memory. */
  async refresh(silent = false) {
    try {
      const [vehicles, supplies, sites, alerts, dispatches] = await Promise.all([
        OptiStore.list('vehicles'),
        OptiStore.list('supplies'),
        OptiStore.list('sites'),
        OptiStore.list('alerts'),
        OptiStore.list('dispatches')
      ]);
      this.state.vehicles = vehicles;
      this.state.supplies = supplies;
      this.state.sites = sites;
      this.state.alerts = alerts.sort(
        (a, b) => Date.parse(b.created_ts || 0) - Date.parse(a.created_ts || 0)
      );
      this.state.dispatches = dispatches.sort(
        (a, b) => Date.parse(b.queued_at || 0) - Date.parse(a.queued_at || 0)
      );
      if (!silent) UI.toast('Data refreshed', 'success', 1800);
    } catch (err) {
      console.error('[app] refresh failed', err);
      UI.toast('Could not reach relief command — showing cached data', 'warn');
    }
  },

  /* --------------------------------------------------------------- router */

  route() {
    const hash = (location.hash || '#/dashboard').replace(/^#\/?/, '');
    const key = hash.split('/')[0] || 'dashboard';
    const def = this.routes[key] || this.routes.dashboard;

    // Tear down the previous view (3D loop, map instance, timers…)
    if (typeof this.currentCleanup === 'function') {
      try { this.currentCleanup(); } catch (e) { console.warn(e); }
    }
    this.currentCleanup = null;
    this.currentRoute = key;

    const pageTitleEl = document.getElementById('page-title');
    const pageSubEl = document.getElementById('page-sub');
    if (pageTitleEl) pageTitleEl.textContent = def.title;
    if (pageSubEl) pageSubEl.textContent = def.sub;

    document.querySelectorAll('#app-nav .nav-link').forEach((a) => {
      a.classList.toggle('active', a.dataset.route === key);
    });
    const sidebar = document.getElementById('app-sidebar');
    if (sidebar) sidebar.classList.remove('open');
    const scrim = document.getElementById('sidebar-scrim');
    if (scrim) scrim.remove();

    const outlet = document.getElementById('view-outlet');
    if (!outlet) return;
    outlet.scrollTop = 0;
    window.scrollTo({ top: 0 });

    const viewFn = def.view();
    if (typeof viewFn !== 'function') {
      outlet.innerHTML = UI.emptyState('fa-triangle-exclamation', 'View unavailable', 'This module failed to load.');
      return;
    }
    try {
      const cleanup = viewFn(outlet);
      if (typeof cleanup === 'function') this.currentCleanup = cleanup;
    } catch (err) {
      console.error('[app] view error', err);
      outlet.innerHTML = UI.emptyState('fa-bug', 'Something went wrong', String(err.message || err));
    }
  },

  reroute() { this.route(); },

  /* --------------------------------------------------------------- chrome */

  bindChrome() {
    const sidebar = document.getElementById('app-sidebar');
    const toggleBtn = document.getElementById('sidebar-toggle');
    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener('click', () => {
        const opening = !sidebar.classList.contains('open');
        sidebar.classList.toggle('open', opening);
        if (opening) {
          const scrim = document.createElement('div');
          scrim.id = 'sidebar-scrim';
          scrim.addEventListener('click', () => {
            sidebar.classList.remove('open');
            scrim.remove();
          });
          document.body.appendChild(scrim);
        } else {
          const s = document.getElementById('sidebar-scrim');
          if (s) s.remove();
        }
      });
    }

    // Sync button
    const syncBtn = document.getElementById('sync-now');
    if (syncBtn) {
      syncBtn.addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        btn.disabled = true;
        const res = await OptiStore.flushOutbox();
        await this.refresh(true);
        btn.disabled = false;
        if (res.offline) UI.toast('Still offline — queue preserved for later', 'warn');
        else if (res.flushed) UI.toast(`Synced ${res.flushed} queued operation(s)`, 'success');
        else UI.toast('Nothing queued — everything is up to date', 'info');
        if (this.currentRoute === 'system' || this.currentRoute === 'dispatch') this.reroute();
      });
    }

    // SIH Compliance Buttons
    const topCompBtn = document.getElementById('top-compliance-btn');
    const sideCompBtn = document.getElementById('sidebar-compliance-btn');
    if (topCompBtn) {
      topCompBtn.addEventListener('click', () => {
        if (window.SIHCompliance) window.SIHCompliance.openComplianceModal();
      });
    }
    if (sideCompBtn) {
      sideCompBtn.addEventListener('click', () => {
        if (window.SIHCompliance) window.SIHCompliance.openComplianceModal();
      });
    }

    // Role selector
    const roleSel = document.getElementById('role-selector');
    if (roleSel && window.RBAC) {
      roleSel.value = window.RBAC.currentRole;
      roleSel.addEventListener('change', (e) => {
        window.RBAC.setRole(e.target.value);
      });
    }

    // Language selector
    const langSel = document.getElementById('lang-selector');
    if (langSel && window.I18N) {
      langSel.value = window.I18N.getLanguage();
      langSel.addEventListener('change', (e) => {
        window.I18N.setLanguage(e.target.value);
      });
    }

    // Data Source Badge
    const dsBadge = document.getElementById('datasource-badge');
    const dsText = document.getElementById('datasource-text');
    if (dsBadge && window.ProviderRegistry) {
      const updateBadge = () => {
        const mode = window.ProviderRegistry.getMode();
        if (dsText) dsText.textContent = `SRC: ${mode}`;
        dsBadge.className = `flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs cursor-pointer transition ${
          mode === 'LIVE' ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-200' : 'border-sky-500/30 bg-sky-950/30 text-sky-200'
        }`;
      };
      updateBadge();

      dsBadge.addEventListener('click', () => {
        const next = window.ProviderRegistry.isLive() ? 'SIMULATED' : 'LIVE';
        window.ProviderRegistry.setMode(next);
        updateBadge();
        UI.toast(`Data source changed to ${next}`, 'info');
      });
    }
  },

  paintNet(online) {
    const dot = document.getElementById('net-dot');
    const label = document.getElementById('net-label');
    const sub = document.getElementById('net-sub');
    if (dot) dot.className = 'status-dot ' + (online ? 'dot-live' : 'dot-off');
    if (label) {
      label.textContent = online ? 'Online' : 'Offline Mode';
      label.className = 'text-xs font-semibold ' + (online ? 'text-slate-200' : 'text-amber-300');
    }
    if (sub) {
      sub.textContent = online
        ? 'Live sync with relief command'
        : 'Manifests queue locally and sync on reconnect';
    }
  },

  paintQueue(n) {
    const badge = document.getElementById('nav-queue-badge');
    if (!badge) return;
    badge.textContent = n;
    badge.classList.toggle('hidden', !n);
  },

  startClock() {
    const el = document.getElementById('clock');
    if (!el) return;
    const tick = () => {
      el.textContent = new Date().toLocaleTimeString('en-GB', { hour12: false });
    };
    tick();
    setInterval(tick, 1000);
  },

  registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js')
        .then(() => console.log('[pwa] service worker registered'))
        .catch((err) => console.warn('[pwa] registration failed', err));
    });
  },

  /* ------------------------------------------------------------- helpers */

  vehicleById(id) { return this.state.vehicles.find((v) => v.id === id); },
  siteById(id) { return this.state.sites.find((s) => s.id === id); },
  warehouses() { return this.state.sites.filter((s) => s.kind === 'Warehouse'); },
  disasterSites() { return this.state.sites.filter((s) => s.kind === 'Disaster Site'); },

  /** Aggregate KPIs used by the dashboard. */
  kpis() {
    const v = this.state.vehicles;
    const s = this.state.supplies;
    const d = this.state.dispatches;
    const active = v.filter((x) => x.status === 'Available' || x.status === 'In Transit').length;
    const tonnage = d.reduce((sum, x) => sum + (Number(x.total_weight) || 0), 0) / 1000;
    const urgentUnits = s.filter((x) => (Number(x.urgency) || 0) >= 8)
      .reduce((sum, x) => sum + (Number(x.qty_available) || 0), 0);
    const effVals = d.map((x) => Number(x.efficiency) || 0).filter((n) => n > 0);
    const eff = effVals.length ? effVals.reduce((a, b) => a + b, 0) / effVals.length : 0;
    const critSites = this.disasterSites().filter((x) => (Number(x.urgency) || 0) >= 8).length;
    return {
      activeVehicles: active,
      totalVehicles: v.length,
      tonnage,
      urgentUnits,
      efficiency: eff,
      criticalSites: critSites,
      totalSites: this.disasterSites().length,
      dispatchCount: d.length,
      skuCount: s.length
    };
  }
};

window.App = App;
window.Views = window.Views || {};

document.addEventListener('DOMContentLoaded', () => App.init());
