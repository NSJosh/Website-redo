import * as THREE from 'https://esm.sh/three@0.160.0';
import Globe from 'https://esm.sh/globe.gl@2.31.0';

window.addEventListener('load', () => {
  const container = document.getElementById('hero-globe');
  if (!container) return;

  // ── Cambodia ──
  const CAMBODIA = { lat: 11.5564, lng: 104.9282 };

  // Camera offset south-east of Cambodia so Cambodia lands in the visible
  // upper-left of the off-screen-cropped canvas.
  const BASE_LAT = CAMBODIA.lat - 7;   // ≈ 4.55
  const BASE_LNG = CAMBODIA.lng + 8;   // ≈ 112.93
  const ALTITUDE = 1.28;                // closer = bigger Cambodia, more detail

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

  // Hide the underlying globe sphere — surface is rendered via hex polygons
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
        .hexPolygonResolution(4)                    // higher resolution = more, smaller hexes = more detail
        .hexPolygonMargin(0.22)
        .hexPolygonAltitude(d => isCambodia(d.properties) ? 0.014 : 0.005)
        .hexPolygonColor(d => isCambodia(d.properties)
          ? 'rgba(255, 107, 53, 0.9)'
          : 'rgba(20, 20, 30, 0.42)')
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

  // ── Lighting + DEPTH FOG (gives the depth-blur futuristic feel) ──
  const scene = world.scene();

  // Slightly cool-tinted fog. Globe radius is 100 (three-globe default).
  // Camera at altitude 1.28 sits ~128 units from origin → front of globe
  // is ~28 units away, the limb (silhouette tangent) is ~128 units away.
  // Setting near=70 / far=145 fades the back hexes into haze.
  scene.fog = new THREE.Fog(0xF4F7FB, 70, 145);

  scene.traverse(obj => {
    if (obj.isAmbientLight) {
      obj.intensity = 1.25;
      obj.color.setHex(0xFFFFFF);
    }
    if (obj.isDirectionalLight) {
      obj.intensity = 0.45;
      obj.color.setHex(0xFFF2DE);
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
