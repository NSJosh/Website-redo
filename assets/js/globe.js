import Globe from 'https://esm.sh/globe.gl@2.31.0';

window.addEventListener('load', () => {
  const container = document.getElementById('hero-globe');
  if (!container) return;

  // ── Cambodia ──
  const CAMBODIA = { lat: 11.5564, lng: 104.9282 };

  // Camera offset so Cambodia lands in the visible upper-left of the off-screen canvas
  const BASE_LAT = CAMBODIA.lat - 9.5;   // ≈ 2.05
  const BASE_LNG = CAMBODIA.lng + 10.5;  // ≈ 115.43
  const ALTITUDE = 1.5;

  // Cursor parallax range
  const CURSOR_LNG_RANGE = 14;  // ±14° lng
  const CURSOR_LAT_RANGE = 9;   // ±9° lat

  // ── Init ──
  const world = Globe()(container)
    .backgroundColor('rgba(0,0,0,0)')
    .showGlobe(true)
    .showAtmosphere(true)
    .atmosphereColor('#FFD9B8')
    .atmosphereAltitude(0.16)
    .bumpImageUrl('https://unpkg.com/three-globe@2.31.0/example/img/earth-topology.png');

  // Single small Phnom Penh marker
  world
    .pointsData([{ ...CAMBODIA, size: 0.6, color: '#E55A2B' }])
    .pointAltitude(0.018)
    .pointRadius('size')
    .pointColor('color')
    .pointResolution(32)
    .pointsMerge(false);

  // Renderer quality
  const renderer = world.renderer();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  // Globe material — frosted white with topographic bump
  const mat = world.globeMaterial();
  mat.color.setHex(0xFFFFFF);
  mat.emissive.setHex(0xFFFFFF);
  mat.emissiveIntensity = 0.04;
  mat.shininess = 4;
  mat.bumpScale = 9;
  mat.needsUpdate = true;

  // Country borders + Cambodia highlight
  const isCambodia = (props) => {
    const name = props.NAME || props.name || props.NAME_EN || props.ADMIN || '';
    return name === 'Cambodia';
  };
  const applyPolygons = (features) => {
    world
      .polygonsData(features)
      .polygonCapColor(d => isCambodia(d.properties)
        ? 'rgba(255, 107, 53, 0.45)'
        : 'rgba(255, 255, 255, 0.0)')
      .polygonSideColor(() => 'rgba(0, 0, 0, 0)')
      .polygonStrokeColor(d => isCambodia(d.properties)
        ? 'rgba(229, 90, 43, 1.0)'
        : 'rgba(20, 20, 20, 0.42)')
      .polygonAltitude(d => isCambodia(d.properties) ? 0.011 : 0.005);
  };

  fetch('https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@master/geojson/ne_50m_admin_0_countries.geojson')
    .then(r => r.json())
    .then(geo => applyPolygons(geo.features))
    .catch(() => fetch('https://unpkg.com/three-globe@2.31.0/example/datasets/ne_110m_admin_0_countries.geojson')
      .then(r => r.json())
      .then(geo => applyPolygons(geo.features))
    );

  // Disable globe.gl's built-in camera controls — we drive it manually
  const ctrl = world.controls();
  ctrl.autoRotate = false;
  ctrl.enableZoom = false;
  ctrl.enablePan = false;
  ctrl.enableRotate = false;
  ctrl.enableDamping = false;

  // Lighting tuned for soft frosted look + visible terrain
  const scene = world.scene();
  scene.traverse(obj => {
    if (obj.isAmbientLight) {
      obj.intensity = 1.05;
      obj.color.setHex(0xFFFFFF);
    }
    if (obj.isDirectionalLight) {
      obj.intensity = 0.85;
      obj.color.setHex(0xFFF2DE);
      obj.position.set(2, 1.6, 1.4);
    }
  });

  // Initial camera — open on Cambodia
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
  function tick() {
    const targetLat = BASE_LAT - mouseY * CURSOR_LAT_RANGE;
    const targetLng = BASE_LNG + mouseX * CURSOR_LNG_RANGE;

    currentLat += (targetLat - currentLat) * SMOOTHING;
    currentLng += (targetLng - currentLng) * SMOOTHING;

    world.pointOfView({
      lat: currentLat,
      lng: currentLng,
      altitude: ALTITUDE
    }, 0);

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
