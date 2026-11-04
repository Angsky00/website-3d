// Despiece del extrusor (procedural, sin descargas). setProgress(p): 0 armado → piezas se separan una a una → p≥0.82 se rearma.
import * as THREE from 'three';
const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

export function createDespiece(canvas, labelsEl, { reduced }) {
  const C = { terracota: css('--terracota'), jade: css('--jade'), arena: css('--arena'), carbon: css('--carbon'), crema: css('--crema') };
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
  scene.add(new THREE.HemisphereLight(0xfff5e6, 0x3a2e28, 2.0));
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(4, 6, 8); scene.add(key);
  const rim = new THREE.DirectionalLight(new THREE.Color(C.jade), 1.0); rim.position.set(-6, 2, -4); scene.add(rim);
  const root = new THREE.Group(); scene.add(root);
  const mat = c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.5, metalness: 0.35, flatShading: false });
  const mesh = (geo, m, x = 0, y = 0, z = 0, g) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); g.add(o); return o; };
  const parts = [];
  // base: [clave, etiqueta, color base, constructor, desplazamiento local al despiezar]
  const add = (label, base, build, off) => { const g = new THREE.Group(); const m = mat(base); m.userData.base = new THREE.Color(base); build(g, m); root.add(g); parts.push({ label, g, m, off: new THREE.Vector3(...off), rot: (parts.length % 2 ? 1 : -1) * 0.35 }); };
  const A = C.arena, K = C.carbon, gearShape = (r, n) => { const s = new THREE.Shape(); for (let i = 0; i <= n * 2; i++) { const a = i / (n * 2) * Math.PI * 2, rr = i % 2 ? r : r * 0.82; s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } const h = new THREE.Path(); h.absarc(0, 0, r * 0.25, 0, Math.PI * 2, true); s.holes.push(h); return s; };
  add('ventilador', K, (g, m) => { mesh(new THREE.BoxGeometry(0.9, 0.9, 0.16), m, 0, 0, 0, g); const hub = mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.2, 16), mat(A), 0, 0, 0.02, g); hub.rotation.x = Math.PI / 2;
    for (let i = 0; i < 7; i++) { const b = mesh(new THREE.BoxGeometry(0.34, 0.1, 0.03), mat(A), 0, 0, 0.06, g); b.position.set(Math.cos(i * 0.9) * 0.24, Math.sin(i * 0.9) * 0.24, 0.06); b.rotation.set(0.4, 0, i * 0.9); } g.position.set(0, 0.2, 0.62); }, [0, 0, 1.5]);
  add('ducto', A, (g, m) => { mesh(new THREE.BoxGeometry(1.0, 0.35, 0.5), m, 0, 0, 0, g); mesh(new THREE.BoxGeometry(0.7, 0.12, 0.3), m, 0, -0.22, 0.12, g); g.position.set(0, -0.62, 0.55); }, [0, -0.5, 1.3]);
  add('tubo PTFE', '#efe6d6', (g, m) => { m.transparent = true; m.opacity = 0.85; mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.5, 16), m, 0, 0, 0, g);
    mesh(new THREE.CylinderGeometry(0.022, 0.022, 2.6, 8), new THREE.MeshStandardMaterial({ color: C.jade, emissive: new THREE.Color(C.jade), emissiveIntensity: 0.25 }), 0, 0.55, 0, g); g.position.set(0, 2.15, 0); }, [0, 2.4, 0]);
  add('motor', K, (g, m) => { mesh(new THREE.BoxGeometry(0.85, 0.85, 0.7), m, 0, 0, 0, g); mesh(new THREE.BoxGeometry(0.87, 0.06, 0.72), mat(A), 0, 0.2, 0, g); mesh(new THREE.BoxGeometry(0.87, 0.06, 0.72), mat(A), 0, -0.2, 0, g); g.position.set(-0.75, 1.25, -0.1); }, [-1.5, 0.7, 0]);
  add('engranes de tracción', A, (g, m) => { const geo = new THREE.ExtrudeGeometry(gearShape(0.26, 14), { depth: 0.14, bevelEnabled: false }); mesh(geo, m, -0.29, 0, 0, g); mesh(geo, m, 0.29, 0, 0, g); g.position.set(0, 1.25, 0); }, [0, 1.5, 0.5]);
  add('cartucho calefactor', K, (g, m) => { const c = mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.9, 16), m, 0, 0, 0, g); c.rotation.z = Math.PI / 2; g.position.set(0.05, -0.62, 0.1); }, [1.5, -0.4, 0]);
  add('termistor', A, (g, m) => { const c = mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.6, 12), m, 0, 0, 0, g); c.rotation.z = Math.PI / 2; mesh(new THREE.SphereGeometry(0.06, 10, 8), mat(K), -0.3, 0, 0, g); g.position.set(0.05, -0.8, -0.12); }, [-1.4, -0.9, 0]);
  add('bloque calentador', A, (g, m) => { mesh(new THREE.BoxGeometry(0.75, 0.5, 0.5), m, 0, 0, 0, g); g.position.set(0, -0.7, 0); }, [0, -1.6, 0]);
  add('boquilla', K, (g, m) => { mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.14, 6), m, 0, 0.05, 0, g); mesh(new THREE.ConeGeometry(0.13, 0.25, 16), m, 0, -0.14, 0, g).rotation.x = Math.PI; g.position.set(0, -1.08, 0); }, [0, -2.9, 0]);
  add('disipador', A, (g, m) => { for (let i = 0; i < 8; i++) mesh(new THREE.BoxGeometry(0.8, 0.05, 0.8), m, 0, -0.18 + i * 0.1, 0, g); mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.9, 16), mat(K), 0, 0.12, 0, g); mesh(new THREE.BoxGeometry(0.85, 0.12, 0.85), mat(K), 0, 0.62, 0, g); g.position.set(0, 0.2, 0); }, [0, 0, 0]);
  parts.forEach(p => { p.home = p.g.position.clone(); });
  const N = parts.length, hot = new THREE.Color(C.terracota);
  labelsEl.innerHTML = parts.map((p, i) => `<span class="dl"><b>${String(i + 1).padStart(2, '0')}</b> ${p.label}</span>`).join('');
  const labels = [...labelsEl.children];
  let W = 1, H = 1, mobile = false, last = -1;
  function layout() {
    const r = canvas.getBoundingClientRect(); W = r.width || 1; H = r.height || 1; mobile = W < 820;
    renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 1.75)); renderer.setSize(W, H, false);
    camera.aspect = W / H;
    // escritorio: eje del extrusor horizontal; celular: vertical
    root.rotation.set(0.25, mobile ? -0.35 : 0, 0); if (!mobile) root.rotateZ(-Math.PI / 2), root.rotateX(0.35);
    // encuadre automático del estado abierto
    parts.forEach(q => q.g.position.copy(q.home).add(q.off)); root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root), c = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3());
    const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), padW = mobile ? 1.9 : 1.35, padH = mobile ? 1.3 : 1.45;
    const d = Math.max(sz.y * padH / 2 / t, sz.x * padW / 2 / (t * camera.aspect)) + sz.z / 2;
    camera.position.set(c.x, c.y + (mobile ? 0.25 : 0.2) * sz.y * 0.1, c.z + d); camera.lookAt(c.x, c.y, c.z); camera.updateProjectionMatrix();
    last = -1; draw(cur);
  }
  const sm = t => t * t * (3 - 2 * t), cl = (a, b, v) => Math.min(b, Math.max(a, v));
  let cur = reduced ? 0.78 : 0;
  const v = new THREE.Vector3();
  function draw(p) {
    // separación: 0.04–0.70 una por una; 0.70–0.82 abierto; 0.82–0.98 rearmado (todas juntas, en orden inverso)
    const back = sm(cl(0, 1, (p - 0.82) / 0.16));
    let active = -1;
    parts.forEach((q, i) => {
      const a = 0.04 + i * (0.66 / N), s = sm(cl(0, 1, (p - a) / (0.66 / N))) * (1 - back);
      if (p >= a && p < a + 0.66 / N && !reduced) active = i;
      q.g.position.copy(q.home).addScaledVector(q.off, s);
      q.g.rotation.set(0, q.rot * s, q.rot * 0.5 * s);
      q.s = s;
    });
    if (p > 0.82 && p < 0.98 && !reduced) active = N - 1 - Math.min(N - 1, Math.floor((p - 0.82) / 0.16 * N));
    parts.forEach((q, i) => q.m.color.copy(i === active ? hot : q.m.userData.base));
    root.updateMatrixWorld(); renderer.render(scene, camera);
    const cx = W / 2, L = [];
    parts.forEach((q, i) => {
      const el = labels[i]; q.g.getWorldPosition(v).project(camera);
      const x = (v.x + 1) / 2 * W, y = (1 - v.y) / 2 * H, show = q.s > 0.6 || reduced;
      el.style.opacity = show ? 1 : 0; el.classList.toggle('on', i === active);
      // celular: columnas izquierda/derecha según el lado de la pieza; escritorio: arriba/abajo alternado
      const right = mobile ? x >= cx : i % 2 === 0;
      L.push({ el, x, y: mobile ? y : y + (right ? 50 : -50), right, w: el.offsetWidth, h: el.offsetHeight, show });
    });
    if (mobile) for (const side of [true, false]) { // evita solapes: separa en vertical dentro de cada columna
      const col = L.filter(l => l.show && l.right === side).sort((a, b) => a.y - b.y);
      for (let k = 1; k < col.length; k++) col[k].y = Math.max(col[k].y, col[k - 1].y + col[k - 1].h + 6);
    }
    if (!mobile) { const vis = L.filter(l => l.show).sort((a, b) => a.y - b.y); // escritorio: empuja hacia abajo la que choque
      vis.forEach((l, k) => { for (let j = 0; j < k; j++) { const o = vis[j]; if (Math.abs(l.x - o.x) < (l.w + o.w) / 2 + 6 && l.y < o.y + (l.h + o.h) / 2 + 4) l.y = o.y + (l.h + o.h) / 2 + 4; } }); }
    L.forEach(l => {
      let lx = mobile ? (l.right ? W - 8 - l.w : 8) : l.x - l.w / 2;
      lx = Math.max(6, Math.min(W - 6 - l.w, lx));
      const ly = Math.max(H * 0.12, Math.min(H - l.h - 8, l.y - l.h / 2));
      l.el.style.transform = `translate(${lx}px,${ly}px)`;
    });
  }
  addEventListener('resize', layout); requestAnimationFrame(layout);
  return { setProgress(p) { cur = p; if (Math.abs(p - last) > 1e-4) { last = p; draw(p); } }, layout };
}
