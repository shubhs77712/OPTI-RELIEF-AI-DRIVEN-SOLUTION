/* ==========================================================================
   OptiRelief — 3D Bin-Packing Visualizer (Three.js)
   --------------------------------------------------------------------------
   Renders the interior of a vehicle cargo bed with every allocated box at its
   solver-assigned (x, y, z) coordinate. Orbit / zoom via pointer, click a box
   to inspect it. Self-contained orbit controls (no external control script).
   ========================================================================== */

const Viz3D = (function () {
  let scene, camera, renderer, raycaster, hostEl;
  let boxGroup, containerGroup;
  let animId = null;
  let onSelect = null;
  let disposed = true;

  // Spherical camera state
  const cam = { radius: 14, theta: Math.PI * 0.28, phi: Math.PI * 0.32, target: null };
  const pointer = { down: false, x: 0, y: 0, moved: 0, id: null };
  let selectedMesh = null;
  let allBoxMeshes = [];
  let hiddenCats = new Set();

  function dispose() {
    if (animId) cancelAnimationFrame(animId);
    animId = null;
    if (renderer) {
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    }
    window.removeEventListener('resize', onResize);
    scene = camera = renderer = raycaster = null;
    allBoxMeshes = [];
    selectedMesh = null;
    disposed = true;
  }

  function onResize() {
    if (!renderer || !hostEl) return;
    const w = hostEl.clientWidth || 1;
    const h = hostEl.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function updateCamera() {
    const t = cam.target || new THREE.Vector3();
    camera.position.set(
      t.x + cam.radius * Math.sin(cam.phi) * Math.cos(cam.theta),
      t.y + cam.radius * Math.cos(cam.phi),
      t.z + cam.radius * Math.sin(cam.phi) * Math.sin(cam.theta)
    );
    camera.lookAt(t);
  }

  /* ------------------------------------------------------------- build */

  /**
   * @param {HTMLElement} host
   * @param {Object} load   one vehicle load from the solver output
   * @param {Function} selectCb  called with box data (or null) on click
   */
  function render(host, load, selectCb) {
    dispose();
    hostEl = host;
    onSelect = selectCb;
    disposed = false;
    hiddenCats = new Set();

    const W = host.clientWidth || 800;
    const H = host.clientHeight || 480;

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x060a14, 18, 52);

    camera = new THREE.PerspectiveCamera(46, W / H, 0.1, 400);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(W, H, false);
    renderer.setClearColor(0x000000, 0);
    host.appendChild(renderer.domElement);
    raycaster = new THREE.Raycaster();

    const c = load.container || { length: 6, width: 2.4, height: 2.4 };
    const L = Number(c.length) || 6;
    const Wd = Number(c.width) || 2.4;
    const Ht = Number(c.height) || 2.4;

    // Center the scene on the container's middle; solver coords start at origin.
    const offset = new THREE.Vector3(-L / 2, 0, -Wd / 2);
    cam.target = new THREE.Vector3(0, Ht / 2, 0);
    cam.radius = Math.max(L, Wd, Ht) * 2.1;
    cam.theta = Math.PI * 0.28;
    cam.phi = Math.PI * 0.34;

    /* --- lighting --- */
    scene.add(new THREE.AmbientLight(0xffffff, 0.62));
    const key = new THREE.DirectionalLight(0xffffff, 0.85);
    key.position.set(L, Ht * 3, Wd * 2);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x60a5fa, 0.4);
    fill.position.set(-L, Ht * 1.5, -Wd * 2);
    scene.add(fill);
    const rim = new THREE.PointLight(0x38bdf8, 0.5, Math.max(L, Wd) * 4);
    rim.position.set(0, Ht * 2.2, 0);
    scene.add(rim);

    /* --- container shell --- */
    containerGroup = new THREE.Group();

    const shellGeo = new THREE.BoxGeometry(L, Ht, Wd);
    const shell = new THREE.Mesh(shellGeo, new THREE.MeshBasicMaterial({
      color: 0x38bdf8, transparent: true, opacity: 0.045, side: THREE.BackSide
    }));
    shell.position.set(0, Ht / 2, 0);
    containerGroup.add(shell);

    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(shellGeo),
      new THREE.LineBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.55 })
    );
    edges.position.set(0, Ht / 2, 0);
    containerGroup.add(edges);

    // Cargo bed floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(L, Wd),
      new THREE.MeshStandardMaterial({
        color: 0x1e293b, roughness: 0.85, metalness: 0.15,
        transparent: true, opacity: 0.92
      })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0.002;
    containerGroup.add(floor);

    const grid = new THREE.GridHelper(Math.max(L, Wd), Math.round(Math.max(L, Wd) * 2), 0x334155, 0x1e293b);
    grid.position.y = 0.006;
    containerGroup.add(grid);

    scene.add(containerGroup);

    /* --- packed boxes --- */
    boxGroup = new THREE.Group();
    const boxes = load.boxes || [];

    boxes.forEach((b) => {
      const geo = new THREE.BoxGeometry(b.length, b.height, b.width);
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(b.color || '#94a3b8'),
        roughness: 0.55, metalness: 0.2,
        transparent: true, opacity: 0.94
      });
      const mesh = new THREE.Mesh(geo, mat);
      // Solver: x along length, y along width, z upward.
      mesh.position.set(
        offset.x + b.x + b.length / 2,
        b.z + b.height / 2,
        offset.z + b.y + b.width / 2
      );
      mesh.userData.box = b;
      mesh.userData.baseColor = b.color;

      const wire = new THREE.LineSegments(
        new THREE.EdgesGeometry(geo),
        new THREE.LineBasicMaterial({ color: 0x0b1120, transparent: true, opacity: 0.5 })
      );
      mesh.add(wire);

      boxGroup.add(mesh);
      allBoxMeshes.push(mesh);
    });

    scene.add(boxGroup);
    updateCamera();
    bindPointer(host);
    window.addEventListener('resize', onResize);

    (function loop() {
      if (disposed) return;
      animId = requestAnimationFrame(loop);
      if (selectedMesh) {
        const t = Date.now() * 0.005;
        selectedMesh.material.emissiveIntensity = 0.4 + Math.sin(t) * 0.25;
      }
      renderer.render(scene, camera);
    })();

    return { boxCount: boxes.length };
  }

  /* --------------------------------------------------- pointer interaction */

  function bindPointer(host) {
    const el = renderer.domElement;

    el.addEventListener('pointerdown', (e) => {
      pointer.down = true;
      pointer.moved = 0;
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.id = e.pointerId;
      el.setPointerCapture(e.pointerId);
    });

    el.addEventListener('pointermove', (e) => {
      if (!pointer.down) return;
      const dx = e.clientX - pointer.x;
      const dy = e.clientY - pointer.y;
      pointer.moved += Math.abs(dx) + Math.abs(dy);
      cam.theta -= dx * 0.007;
      cam.phi = Math.max(0.12, Math.min(Math.PI * 0.92, cam.phi - dy * 0.006));
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      updateCamera();
    });

    el.addEventListener('pointerup', (e) => {
      pointer.down = false;
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
      if (pointer.moved < 6) pick(e);
    });

    el.addEventListener('pointercancel', () => { pointer.down = false; });

    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      cam.radius = Math.max(1.5, Math.min(90, cam.radius + e.deltaY * 0.012));
      updateCamera();
    }, { passive: false });

    // Pinch zoom on touch
    let pinchStart = null;
    host.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        pinchStart = { d: touchDist(e), r: cam.radius };
      }
    }, { passive: true });
    host.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2 && pinchStart) {
        e.preventDefault();
        const ratio = pinchStart.d / Math.max(1, touchDist(e));
        cam.radius = Math.max(1.5, Math.min(90, pinchStart.r * ratio));
        updateCamera();
      }
    }, { passive: false });
    host.addEventListener('touchend', () => { pinchStart = null; }, { passive: true });
  }

  function touchDist(e) {
    const a = e.touches[0], b = e.touches[1];
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  }

  function pick(e) {
    if (!renderer) return;
    const rect = renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
    raycaster.setFromCamera(mouse, camera);
    const visible = allBoxMeshes.filter((m) => m.visible);
    const hits = raycaster.intersectObjects(visible, false);
    highlight(hits.length ? hits[0].object : null);
  }

  function highlight(mesh) {
    if (selectedMesh) {
      selectedMesh.material.emissive = new THREE.Color(0x000000);
      selectedMesh.material.emissiveIntensity = 0;
      selectedMesh.material.opacity = 0.94;
      selectedMesh.scale.set(1, 1, 1);
    }
    selectedMesh = mesh;
    if (mesh) {
      mesh.material.emissive = new THREE.Color(0xffffff);
      mesh.material.emissiveIntensity = 0.45;
      mesh.material.opacity = 1;
      mesh.scale.set(1.04, 1.04, 1.04);
    }
    if (onSelect) onSelect(mesh ? mesh.userData.box : null);
  }

  /** Highlight by sequence number (used by the manifest table). */
  function selectBySeq(seq) {
    const m = allBoxMeshes.find((x) => x.userData.box && x.userData.box.seq === seq);
    highlight(m || null);
    return !!m;
  }

  /** Toggle visibility of a whole category. */
  function toggleCategory(cat) {
    if (hiddenCats.has(cat)) hiddenCats.delete(cat);
    else hiddenCats.add(cat);
    allBoxMeshes.forEach((m) => {
      m.visible = !hiddenCats.has(m.userData.box.category);
    });
    if (selectedMesh && !selectedMesh.visible) highlight(null);
    return !hiddenCats.has(cat);
  }

  function setView(preset) {
    const presets = {
      iso:   { theta: Math.PI * 0.28, phi: Math.PI * 0.34 },
      top:   { theta: Math.PI * 0.5,  phi: 0.16 },
      side:  { theta: 0,              phi: Math.PI * 0.5 },
      front: { theta: Math.PI * 0.5,  phi: Math.PI * 0.5 }
    };
    const p = presets[preset] || presets.iso;
    cam.theta = p.theta;
    cam.phi = p.phi;
    updateCamera();
  }

  function zoom(delta) {
    cam.radius = Math.max(1.5, Math.min(90, cam.radius + delta));
    updateCamera();
  }

  function supported() {
    try {
      const c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext &&
        (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) { return false; }
  }

  return { render, dispose, selectBySeq, toggleCategory, setView, zoom, supported };
})();

window.Viz3D = Viz3D;
