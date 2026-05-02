import * as THREE from 'https://esm.sh/three@0.160.0';
import Globe from 'https://esm.sh/globe.gl@2.31.0';

window.addEventListener('load', () => {
  const container = document.getElementById('hero-globe');
  if (!container) return;

  // ── Cambodia ──
  const CAMBODIA = { lat: 11.5564, lng: 104.9282 };

  // Camera target SW of Cambodia by ~3° each axis — keeps the off-axis
  // "scanning the horizon" angle while putting Cambodia in the clear right
  // side of the viewport (away from the headline text on the left).
  const BASE_LAT = CAMBODIA.lat - 3;    // ≈ 8.55, slight south offset
  const BASE_LNG = CAMBODIA.lng - 3;    // ≈ 101.93, slight west offset
  const ALTITUDE = 1.10;                // close to surface, Cambodia bulges

  // Cursor parallax range
  const CURSOR_LNG_RANGE = 12;
  const CURSOR_LAT_RANGE = 8;

  // ── Init ──
  const world = Globe({
    rendererConfig: {
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    }
  })(container)
    .backgroundColor('rgba(0,0,0,0)')
    .showGlobe(true)
    .showAtmosphere(false);

  // Renderer quality
  const renderer = world.renderer();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

  // Hide the underlying globe sphere — only the hex polygons are visible
  const mat = world.globeMaterial();
  mat.color.setHex(0xFFFFFF);
  mat.opacity = 0;
  mat.transparent = true;
  mat.needsUpdate = true;

  // Phnom Penh marker — bright orange dot
  world
    .pointsData([{ ...CAMBODIA, size: 0.55, color: '#FF6B35' }])
    .pointAltitude(0.022)
    .pointRadius('size')
    .pointColor('color')
    .pointResolution(28)
    .pointsMerge(false);

  // ── Periodic incoming arcs ──
  // Random distant cities firing arched connections into Cambodia.
  const ARC_SOURCES = [
    { lat: 51.5074, lng:   -0.1278 },  // London
    { lat: 40.7128, lng:  -74.0060 },  // New York
    { lat: 35.6762, lng:  139.6503 },  // Tokyo
    { lat: -33.8688, lng: 151.2093 },  // Sydney
    { lat:  1.3521, lng:  103.8198 },  // Singapore
    { lat: 19.0760, lng:   72.8777 },  // Mumbai
    { lat: 25.2048, lng:   55.2708 },  // Dubai
    { lat: 55.7558, lng:   37.6173 },  // Moscow
    { lat: -23.5505, lng: -46.6333 },  // São Paulo
    { lat: -1.2921, lng:   36.8219 },  // Nairobi
    { lat: 13.7563, lng:  100.5018 },  // Bangkok
    { lat: 39.9042, lng:  116.4074 },  // Beijing
    { lat: -33.9249, lng:  18.4241 },  // Cape Town
    { lat: 52.5200, lng:   13.4050 },  // Berlin
    { lat: 34.0522, lng: -118.2437 },  // Los Angeles
    { lat: 14.5995, lng:  120.9842 },  // Manila
    { lat: 30.0444, lng:   31.2357 },  // Cairo
    { lat:  6.5244, lng:    3.3792 },  // Lagos
    { lat: 37.5665, lng:  126.9780 },  // Seoul
    { lat: 22.3193, lng:  114.1694 }   // Hong Kong
  ];

  const ARC_LIFETIME_MS = 5000;
  const ARC_SPAWN_MS = 3500;
  const ARC_FADE_IN_MS = 700;
  const ARC_FADE_OUT_MS = 700;
  let activeArcs = [];
  let arcId = 0;

  // Configure arc rendering once.
  // arcsTransitionDuration kept at 0 to avoid the "shoot out of Cambodia"
  // position interpolation. Opacity fade is driven manually per-arc via
  // the arcColor callback (uses arc.opacity, animated by tickArcOpacity).
  world
    .arcsData([])
    .arcStartLat('startLat').arcStartLng('startLng')
    .arcEndLat('endLat').arcEndLng('endLng')
    .arcColor(d => [
      `rgba(255, 107, 53, 0)`,
      `rgba(255, 107, 53, ${0.55 * (d.opacity ?? 1)})`
    ])
    .arcStroke(0.2)
    .arcAltitudeAutoScale(0.5)
    .arcDashLength(0.4)
    .arcDashGap(0.6)
    .arcDashAnimateTime(ARC_LIFETIME_MS)
    .arcsTransitionDuration(0);

  function spawnArc() {
    const src = ARC_SOURCES[Math.floor(Math.random() * ARC_SOURCES.length)];
    const arc = {
      id: ++arcId,
      startLat:  src.lat,
      startLng:  src.lng,
      endLat:    CAMBODIA.lat,
      endLng:    CAMBODIA.lng,
      spawnTime: performance.now(),
      opacity:   0
    };
    activeArcs.push(arc);
    world.arcsData([...activeArcs]);

    setTimeout(() => {
      activeArcs = activeArcs.filter(a => a.id !== arc.id);
      world.arcsData([...activeArcs]);
    }, ARC_LIFETIME_MS);
  }

  // Per-frame opacity animator — fade-in at start, fade-out at end of lifetime
  function tickArcOpacity() {
    if (activeArcs.length > 0) {
      const now = performance.now();
      let dirty = false;
      for (const arc of activeArcs) {
        const age = now - arc.spawnTime;
        let target = 1;
        if (age < ARC_FADE_IN_MS) {
          target = age / ARC_FADE_IN_MS;
        } else if (age > ARC_LIFETIME_MS - ARC_FADE_OUT_MS) {
          target = Math.max(0, (ARC_LIFETIME_MS - age) / ARC_FADE_OUT_MS);
        }
        target = Math.max(0, Math.min(1, target));
        if (Math.abs(arc.opacity - target) > 0.025) {
          arc.opacity = target;
          dirty = true;
        }
      }
      if (dirty) {
        world.arcsData([...activeArcs]);
      }
    }
    requestAnimationFrame(tickArcOpacity);
  }
  tickArcOpacity();

  // Kick off the periodic spawning
  spawnArc();
  setInterval(spawnArc, ARC_SPAWN_MS);

  // Hex polygons for country surface
  const isCambodia = (props) => {
    const name = props.NAME || props.name || props.NAME_EN || props.ADMIN || '';
    return name === 'Cambodia';
  };

  fetch('https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@master/geojson/ne_110m_admin_0_countries.geojson')
    .then(r => r.json())
    .then(geo => {
      world
        .hexPolygonsData(geo.features)
        .hexPolygonResolution(4)                    // finer hexes, sharper country shapes
        .hexPolygonMargin(0.06)                     // tight packing — almost solid surface
        .hexPolygonAltitude(d => isCambodia(d.properties) ? 0.020 : 0.008)
        .hexPolygonColor(d => isCambodia(d.properties)
          ? '#FF6B35'
          : '#2A2D3A')
        .hexPolygonsTransitionDuration(0);
    })
    .catch(err => console.warn('Country GeoJSON failed', err));

  // Disable globe.gl's built-in camera controls — we drive it manually
  const ctrl = world.controls();
  ctrl.autoRotate = false;
  ctrl.enableZoom = false;
  ctrl.enablePan = false;
  ctrl.enableRotate = false;
  ctrl.enableDamping = false;

  // ── Lighting (fog disabled while we diagnose colour issue) ──
  const scene = world.scene();
  scene.fog = null;

  scene.traverse(obj => {
    if (obj.isAmbientLight) {
      obj.intensity = 0.8;
      obj.color.setHex(0xFFFFFF);
    }
    if (obj.isDirectionalLight) {
      obj.intensity = 0.6;
      obj.color.setHex(0xFFFFFF);
      obj.position.set(2, 1.4, 1.2);
    }
  });

  // Initial camera — open framed on Cambodia
  world.pointOfView({ lat: BASE_LAT, lng: BASE_LNG, altitude: ALTITUDE }, 0);

  // ── Cursor-driven camera ──
  let mouseX = 0, mouseY = 0;
  let currentLat = BASE_LAT;
  let currentLng = BASE_LNG;

  window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  const SMOOTHING = 0.06;
  const SETTLE_EPS = 0.01;
  function tick() {
    const targetLat = BASE_LAT - mouseY * CURSOR_LAT_RANGE;
    const targetLng = BASE_LNG + mouseX * CURSOR_LNG_RANGE;
    const dLat = targetLat - currentLat;
    const dLng = targetLng - currentLng;
    if (Math.abs(dLat) > SETTLE_EPS || Math.abs(dLng) > SETTLE_EPS) {
      currentLat += dLat * SMOOTHING;
      currentLng += dLng * SMOOTHING;
      world.pointOfView({
        lat: currentLat,
        lng: currentLng,
        altitude: ALTITUDE
      }, 0);
    }
    requestAnimationFrame(tick);
  }
  tick();

  // Resize
  function onResize() {
    world.width(container.clientWidth);
    world.height(container.clientHeight);
  }
  window.addEventListener('resize', onResize);
  requestAnimationFrame(onResize);
});
