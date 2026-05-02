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
