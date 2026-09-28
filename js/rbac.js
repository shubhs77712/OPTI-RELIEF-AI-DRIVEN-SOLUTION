/* ==========================================================================
   OptiRelief — Role-Based Access Control (RBAC) & Field Incident Reporter
   SIH 26002 Compliance: ADMIN, FIELD_OFFICIAL, LOGISTICS_OPERATOR, VIEWER
   ========================================================================== */

const RBAC = {
  currentRole: localStorage.getItem('optirelief_role') || 'ADMIN',
  listeners: new Set(),

  roles: {
    ADMIN: {
      id: 'ADMIN',
      label: 'Command Administrator',
      badgeClass: 'badge-critical',
      icon: 'fa-shield-halved',
      desc: 'Full system management, user administration, override solver limits, view all telemetry and audit logs.',
      permissions: {
        canCreateIncident: true,
        canUploadPhoto: true,
        canUpdateRoadStatus: true,
        canManageFleet: true,
        canManageInventory: true,
        canRunOptimizer: true,
        canCreateDispatch: true,
        canManageUsers: true,
        canManageSystem: true,
        canViewAnalytics: true
      }
    },
    FIELD_OFFICIAL: {
      id: 'FIELD_OFFICIAL',
      label: 'NER Field Official',
      badgeClass: 'badge-high',
      icon: 'fa-person-military-pointing',
      desc: 'Ground responder on patrol: report landslides, upload damaged bridge photos, log geo-tagged obstructions.',
      permissions: {
        canCreateIncident: true,
        canUploadPhoto: true,
        canUpdateRoadStatus: true,
        canManageFleet: false,
        canManageInventory: false,
        canRunOptimizer: false,
        canCreateDispatch: false,
        canManageUsers: false,
        canManageSystem: false,
        canViewAnalytics: true
      }
    },
    LOGISTICS_OPERATOR: {
      id: 'LOGISTICS_OPERATOR',
      label: 'Logistics Operator',
      badgeClass: 'badge-moderate',
      icon: 'fa-truck-ramp-box',
      desc: 'Warehouse and dispatch commander: manage fleet assets, balance supply inventory, execute 3D bin solver, manifest dispatches.',
      permissions: {
        canCreateIncident: false,
        canUploadPhoto: false,
        canUpdateRoadStatus: false,
        canManageFleet: true,
        canManageInventory: true,
        canRunOptimizer: true,
        canCreateDispatch: true,
        canManageUsers: false,
        canManageSystem: false,
        canViewAnalytics: true
      }
    },
    VIEWER: {
      id: 'VIEWER',
      label: 'Observer / Public Viewer',
      badgeClass: 'badge-stable',
      icon: 'fa-eye',
      desc: 'Read-only observer: view district connectivity, disaster zone map, high-demand heatmaps and sitreps.',
      permissions: {
        canCreateIncident: false,
        canUploadPhoto: false,
        canUpdateRoadStatus: false,
        canManageFleet: false,
        canManageInventory: false,
        canRunOptimizer: false,
        canCreateDispatch: false,
        canManageUsers: false,
        canManageSystem: false,
        canViewAnalytics: true
      }
    }
  },

  setRole(roleId) {
    if (!this.roles[roleId]) roleId = 'ADMIN';
    this.currentRole = roleId;
    localStorage.setItem('optirelief_role', roleId);
    UI.toast(`Switched role to ${this.roles[roleId].label}`, 'info');
    this.notify();
  },

  getRole() {
    return this.roles[this.currentRole] || this.roles.ADMIN;
  },

  can(action) {
    const r = this.getRole();
    return !!r.permissions[action];
  },

  onChange(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  },

  notify() {
    this.listeners.forEach((fn) => {
      try { fn(this.getRole()); } catch (e) { console.warn(e); }
    });
    if (window.App && App.state && App.state.loaded) {
      App.reroute();
    }
  },

  /**
   * Field Official: Open Geo-tagged Incident & Damage Photo Reporter Modal
   */
  async openIncidentReporter(prefillDistrict = 'Dima Hasao') {
    if (!this.can('canCreateIncident')) {
      UI.toast('Permission denied: Current role cannot report field incidents', 'warn');
      return;
    }

    // Attempt GPS capture
    const gps = await window.GPSProvider.getCurrentPosition();

    const html = `
      <form id="incident-form" class="space-y-4">
        <div class="panel-flat p-3 flex items-center gap-3 border-sky-500/30 bg-sky-950/20">
          <i class="fa-solid fa-satellite-dish text-sky-400 text-lg"></i>
          <div class="text-xs">
            <p class="font-bold text-slate-200">GPS Telemetry Verified</p>
            <p class="text-slate-400 font-mono-num">Lat: ${gps.lat.toFixed(4)}, Lng: ${gps.lng.toFixed(4)} (Accuracy: ±${gps.accuracy}m)</p>
          </div>
          <span class="ml-auto badge badge-stable text-[0.68rem]">${gps.simulated ? 'Simulated Lock' : 'Live Hardware GPS'}</span>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="field-label" for="inc-district">Target District (NER)</label>
            <select class="field" id="inc-district" required>
              <option value="Dima Hasao" ${prefillDistrict === 'Dima Hasao' ? 'selected' : ''}>Dima Hasao (Assam)</option>
              <option value="Champhai" ${prefillDistrict === 'Champhai' ? 'selected' : ''}>Champhai (Mizoram)</option>
              <option value="Papum Pare" ${prefillDistrict === 'Papum Pare' ? 'selected' : ''}>Papum Pare (Arunachal)</option>
              <option value="East Khasi Hills" ${prefillDistrict === 'East Khasi Hills' ? 'selected' : ''}>East Khasi Hills (Meghalaya)</option>
              <option value="Kamrup Metropolitan" ${prefillDistrict === 'Kamrup Metropolitan' ? 'selected' : ''}>Kamrup Metro (Assam)</option>
              <option value="North Sikkim" ${prefillDistrict === 'North Sikkim' ? 'selected' : ''}>North Sikkim (Sikkim)</option>
              <option value="Langtang Valley" ${prefillDistrict === 'Langtang Valley' ? 'selected' : ''}>Langtang Valley (Border Hub)</option>
            </select>
          </div>
          <div>
            <label class="field-label" for="inc-severity">Hazard Severity</label>
            <select class="field" id="inc-severity">
              <option value="Critical">Critical (Immediate Evac / Air Drop)</option>
              <option value="High" selected>High (Major Obstruction)</option>
              <option value="Moderate">Moderate (Single Lane Bypass)</option>
            </select>
          </div>
        </div>

        <div>
          <label class="field-label" for="inc-corridor">Specific Road Corridor / Landmark</label>
          <input type="text" class="field" id="inc-corridor" placeholder="e.g. NH-27 Km 42 near Haflong Bridge" required value="NH-27 Landslide Zone Km 38">
        </div>

        <div>
          <label class="field-label" for="inc-road-status">Road / Bridge Status Impact</label>
          <select class="field" id="inc-road-status">
            <option value="Closed">Closed / Impassable (Culvert Washout / Debris)</option>
            <option value="Partially Blocked" selected>Partially Blocked (4x4 & Pack Animals Only)</option>
            <option value="High Risk">High Risk (Active Rockfall Zone)</option>
            <option value="Open">Open (Cleared with Caution)</option>
          </select>
        </div>

        <div>
          <label class="field-label" for="inc-desc">Field Observation & Urgent Supply Needs</label>
          <textarea class="field h-20" id="inc-desc" placeholder="Describe extent of damage, trapped population, and required medical/food supplies..." required>Heavy monsoon landslide breached outer retaining wall. Debris blocking right lane. 400 families cut off at sub-divisional camp requiring urgent trauma dressing kits and potable water.</textarea>
        </div>

        <div>
          <label class="field-label">Damage Photograph Documentation</label>
          <div class="border-2 border-dashed border-slate-700 rounded-xl p-4 text-center hover:border-sky-500/50 transition">
            <input type="file" id="inc-photo" accept="image/*" class="hidden">
            <label for="inc-photo" class="cursor-pointer block">
              <i class="fa-solid fa-camera text-2xl text-sky-400 mb-2"></i>
              <p class="text-xs font-semibold text-slate-200">Tap to Capture Photo or Upload File</p>
              <p class="text-[0.68rem] text-slate-500">Auto-attaches EXIF metadata & GPS stamp</p>
            </label>
            <div id="photo-preview" class="mt-3 hidden">
              <img id="preview-img" class="h-28 w-auto mx-auto rounded-lg border border-slate-700 object-cover shadow-md" alt="Damage evidence">
              <p class="text-[0.68rem] text-emerald-400 mt-1"><i class="fa-solid fa-circle-check mr-1"></i>Photo Encoded & Ready to Sync</p>
            </div>
          </div>
        </div>

        <div class="flex gap-2 justify-end pt-2 border-t hairline">
          <button type="button" class="btn btn-ghost" data-modal-close>Cancel</button>
          <button type="submit" class="btn btn-primary"><i class="fa-solid fa-paper-plane"></i>Publish Incident Alert</button>
        </div>
      </form>
    `;

    const modal = UI.openModal('Geo-Tagged Field Incident & Road Obstruction Report', html, { wide: true });
    
    // Photo upload preview handler
    let photoData = null;
    const photoInput = modal.querySelector('#inc-photo');
    const previewDiv = modal.querySelector('#photo-preview');
    const previewImg = modal.querySelector('#preview-img');

    photoInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          photoData = evt.target.result;
          previewImg.src = photoData;
          previewDiv.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
      }
    });

    // Form submit
    modal.querySelector('#incident-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const district = modal.querySelector('#inc-district').value;
      const severity = modal.querySelector('#inc-severity').value;
      const corridor = modal.querySelector('#inc-corridor').value;
      const roadStatus = modal.querySelector('#inc-road-status').value;
      const desc = modal.querySelector('#inc-desc').value;

      const newAlert = {
        region: `${district} (${corridor})`,
        message: `${severity.toUpperCase()}: ${desc} [Status: ${roadStatus}]`,
        level: severity,
        requested: 'MED-HIMAL-01 (x20), WAT-PUR-TABS (x50), SHE-SUBZERO-TENT (x15)',
        created_ts: new Date().toISOString(),
        has_photo: !!photoData,
        photo_url: photoData,
        lat: gps.lat,
        lng: gps.lng,
        road_status: roadStatus
      };

      await OptiStore.create('alerts', newAlert);
      await App.refresh(true);
      
      // Notify District engine if present
      if (window.DistrictsEngine) {
        window.DistrictsEngine.recordIncident(district, {
          title: corridor,
          severity,
          status: roadStatus,
          desc,
          photo: photoData,
          lat: gps.lat,
          lng: gps.lng
        });
      }

      UI.closeModal();
      UI.toast(`Incident report published for ${district}!`, 'success');
      App.reroute();
    });
  }
};

window.RBAC = RBAC;
