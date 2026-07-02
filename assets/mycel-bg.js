/*
 * Mein Rezeptbuch · Landingpage — Partikel-/Netz-Hintergrund (echtes three.js).
 * Sanfte Punkt-Wolke mit Funkel-Shader + verbindenden Linien, AdditiveBlending.
 * Die Farben werden LIVE aus den CSS-Variablen des aktiven Themes gelesen
 * (--accent / --accent2 / --gold / --bg), damit der Hintergrund zu jedem der
 * Rezeptbuch-Themen passt. Aufruf: window.MycelBg.setTheme().
 */
import * as THREE from 'three';

const canvas = document.getElementById('bg');
if (canvas) {
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = matchMedia('(max-width: 900px)').matches;
  const MAX_DPR = (window.matchMedia && matchMedia('(pointer: coarse)').matches) ? 1.5 : 2;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_DPR));

  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); canvas.style.visibility = 'hidden'; }, false);
  canvas.addEventListener('webglcontextrestored', () => { canvas.style.visibility = ''; }, false);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0, 6);

  function resize() {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  const grp = new THREE.Group();
  scene.add(grp);

  const PARTICLE_COUNT = isMobile ? 8000 : 18000;
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const seeds = new Float32Array(PARTICLE_COUNT);
  const sizes = new Float32Array(PARTICLE_COUNT);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const r = Math.pow(Math.random(), 0.7) * 14;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    positions[i * 3]     = Math.sin(ph) * Math.cos(th) * r;
    positions[i * 3 + 1] = Math.cos(ph) * r * 0.35 - 1.2;
    positions[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * r * 0.6;
    seeds[i] = Math.random();
    sizes[i] = 0.45 + Math.random() * 1.7;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime:      { value: 0 },
      uColorWarm: { value: new THREE.Color(0xb85535) },
      uColorCool: { value: new THREE.Color(0x7a5840) },
      uColorMid:  { value: new THREE.Color(0xa8841e) },
      uAlpha:     { value: 0.5 },
      uMouse:     { value: new THREE.Vector2(2, 2) },
      uPxRatio:   { value: renderer.getPixelRatio() }
    },
    vertexShader: /* glsl */`
      uniform float uTime; uniform float uPxRatio; uniform vec2 uMouse;
      attribute float aSeed; attribute float aSize;
      varying float vMix; varying float vAlpha;
      void main() {
        vec3 p = position;
        float t = uTime * 0.18 + aSeed * 6.283;
        p.x += sin(t * 0.7 + p.y * 0.4) * 0.35;
        p.y += cos(t * 0.9 + p.z * 0.3) * 0.22;
        p.z += sin(t * 0.5 + p.x * 0.5) * 0.28;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float breath = 0.85 + 0.25 * sin(t * 1.4);
        gl_Position = projectionMatrix * mv;
        vec2 ndc = gl_Position.xy / gl_Position.w;
        float nearC = smoothstep(0.5, 0.0, distance(ndc, uMouse));
        gl_PointSize = aSize * breath * (220.0 / -mv.z) * uPxRatio * (1.0 + nearC * 0.9);
        vMix = aSeed;
        float pulse = sin(t * 2.4 + aSeed * 31.4159);
        vAlpha = 0.10 + 0.55 * pow(max(pulse, 0.0), 4.0) + nearC * 0.75;
      }
    `,
    fragmentShader: /* glsl */`
      uniform vec3 uColorWarm; uniform vec3 uColorCool; uniform vec3 uColorMid;
      uniform float uAlpha;
      varying float vMix; varying float vAlpha;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        float d = length(c);
        if (d > 0.5) discard;
        vec3 col = mix(uColorCool, uColorWarm, vMix);
        col = mix(col, uColorMid, 0.30);
        float core = smoothstep(0.45, 0.0, d);
        float vRay = smoothstep(0.5, 0.0, abs(c.x) * 7.5) * smoothstep(0.5, 0.0, abs(c.y) * 1.4);
        float hRay = smoothstep(0.5, 0.0, abs(c.y) * 7.5) * smoothstep(0.5, 0.0, abs(c.x) * 1.4);
        float star = core + (vRay + hRay) * vAlpha * 0.9;
        gl_FragColor = vec4(col, star * vAlpha * uAlpha);
      }
    `,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
  });
  const points = new THREE.Points(geo, mat);
  grp.add(points);

  const LINK_COUNT = isMobile ? 200 : 520;
  const linkPos = new Float32Array(LINK_COUNT * 2 * 3);
  for (let i = 0; i < LINK_COUNT; i++) {
    const a = Math.floor(Math.random() * PARTICLE_COUNT);
    let b = a + 1 + Math.floor(Math.random() * 200);
    if (b >= PARTICLE_COUNT) b = PARTICLE_COUNT - 1;
    for (let k = 0; k < 3; k++) {
      linkPos[i * 6 + k]     = positions[a * 3 + k];
      linkPos[i * 6 + 3 + k] = positions[b * 3 + k];
    }
  }
  const linkGeo = new THREE.BufferGeometry();
  linkGeo.setAttribute('position', new THREE.BufferAttribute(linkPos, 3));
  const linkMat = new THREE.LineBasicMaterial({ color: 0x7a5840, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false });
  const links = new THREE.LineSegments(linkGeo, linkMat);
  grp.add(links);

  // Farbe aus CSS-Variable lesen → passt zu jedem aktiven Theme
  function cssColor(name, fallback) {
    try {
      const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      if (v) { const c = new THREE.Color(); c.set(v); return c; }
    } catch (_e) {}
    return new THREE.Color(fallback);
  }
  function luminance(c) { return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b; }

  function setTheme() {
    const warm = cssColor('--accent2', '#b85535');
    const cool = cssColor('--accent', '#7a5840');
    const mid  = cssColor('--gold', '#a8841e');
    const bg   = cssColor('--bg', '#f9f4ec');
    const dark = luminance(bg) < 0.4;                 // dunkles Theme?
    mat.uniforms.uColorWarm.value.copy(warm);
    mat.uniforms.uColorCool.value.copy(cool);
    mat.uniforms.uColorMid.value.copy(mid);
    mat.uniforms.uAlpha.value = dark ? 0.55 : 0.42;
    mat.blending = dark ? THREE.AdditiveBlending : THREE.NormalBlending;
    mat.needsUpdate = true;
    linkMat.color.copy(cool);
    linkMat.opacity = dark ? 0.20 : 0.12;
    linkMat.blending = dark ? THREE.AdditiveBlending : THREE.NormalBlending;
    linkMat.needsUpdate = true;
    if (reduce) renderOnce();
  }
  window.MycelBg = { setTheme };
  setTheme();

  let scrollY = window.scrollY || 0;
  window.addEventListener('scroll', () => { scrollY = window.scrollY || 0; if (reduce) requestAnimationFrame(renderOnce); }, { passive: true });

  window.addEventListener('pointermove', (e) => {
    mat.uniforms.uMouse.value.set((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
    if (reduce) requestAnimationFrame(renderOnce);
  }, { passive: true });
  window.addEventListener('pointerleave', () => { mat.uniforms.uMouse.value.set(2, 2); if (reduce) requestAnimationFrame(renderOnce); }, { passive: true });

  let curScale = 1;
  function applyScroll() {
    const aim = 1 + Math.min(scrollY, 2200) / 2600;
    curScale += (aim - curScale) * 0.06;
    grp.scale.setScalar(curScale);
  }
  function renderOnce() { applyScroll(); renderer.render(scene, camera); }

  let last = performance.now();
  function tick() {
    const now = performance.now();
    const dt = (now - last) / 1000; last = now;
    mat.uniforms.uTime.value = now / 1000;
    grp.rotation.y += dt * 0.02;
    applyScroll();
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  if (reduce) renderOnce(); else requestAnimationFrame(tick);
}
