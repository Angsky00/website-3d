// Interfaz de «Tu nombre en 3D» (llavero): vista previa (solo cuando la sección está cerca de la vista) y descarga.
// El motor geométrico (manifold-3d, wasm) y la fuente se cargan solo al acercarse a la sección.
import * as THREE from 'three';
import { validarNombre, construirLlavero, cargarManifold, exportarSTL, archivoNombre } from './nombre3d.js';
import wasmUrl from 'manifold-3d/manifold.wasm?url';

// fuentes candidatas (Slowbro elige con el usuario); ?fuente=script|redonda|suave solo para comparar
const FUENTES = import.meta.glob('./fuentes-llavero/*.json', { import: 'default' });
export const FUENTE_POR_DEFECTO = 'script';
const idFuente = () => { const q = new URLSearchParams(location.search).get('fuente'); return q && FUENTES[`./fuentes-llavero/${q}.json`] ? q : FUENTE_POR_DEFECTO; };
let motorP = null;
const motor = () => motorP ??= Promise.all([cargarManifold({ locateFile: () => wasmUrl }), FUENTES[`./fuentes-llavero/${idFuente()}.json`]()]).then(([w, fuente]) => ({ w, fuente }));

const C = { arena: 0xE7D9C1, terracota: 0xB2442E, carbon: 0x1F1B18 };

export function crearNombre3D(root, { reduced, inicial = 'Calkiní', textos = {} } = {}) {
  const form = root.querySelector('form'), input = form.querySelector('input'), msg = root.querySelector('.n3d-msg');
  const medidas = root.querySelector('.n3d-medidas'), cv = root.querySelector('canvas'), boton = form.querySelector('button[type=submit]');
  let renderer = null, scene, cam, grupo, visible = false, modelo = null, raf = 0, t0 = performance.now();

  const iniciar = () => {
    if (renderer) return;
    renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    scene = new THREE.Scene();
    cam = new THREE.PerspectiveCamera(32, 1, 1, 2000);
    scene.add(new THREE.HemisphereLight(0xfff6ea, 0x3a302a, 1.4));
    const d = new THREE.DirectionalLight(0xffffff, 1.6); d.position.set(60, 120, 160); scene.add(d);
    grupo = new THREE.Group(); grupo.rotation.x = -Math.PI / 6; scene.add(grupo);
    redimensionar(); dibujarModelo();
  };
  const redimensionar = () => { if (!renderer) return; const w = cv.clientWidth, h = cv.clientHeight; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); encuadrar(); render(); };
  const encuadrar = () => {
    if (!modelo) return; const { ancho, alto } = modelo.medidas;
    const r = Math.hypot(ancho, alto) / 2, fit = r / Math.sin(THREE.MathUtils.degToRad(cam.fov / 2)) / Math.min(1, cam.aspect);
    cam.position.set(0, 0, fit * 0.85); cam.lookAt(0, 0, 0);
  };
  const dibujarModelo = () => {
    if (!renderer || !modelo) return;
    grupo.children.forEach(o => o.geometry.dispose()); grupo.clear();
    const mat = (color, rough) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0.05 });
    // un solo sólido; solo en la vista previa, las letras (todo lo que sube del respaldo) van en otro tono para que se lean
    const g = modelo.geometria.toNonIndexed(), z = g.attributes.position, tope = modelo.respaldo + 0.01, letras = [], fondo = [];
    for (let i = 0; i < z.count; i += 3) (Math.max(z.getZ(i), z.getZ(i + 1), z.getZ(i + 2)) > tope ? letras : fondo).push(i);
    const pos = new Float32Array(z.count * 3); let k = 0;
    for (const i of [...fondo, ...letras]) for (let j = 0; j < 3; j++, k += 3) { pos[k] = z.getX(i + j); pos[k + 1] = z.getY(i + j); pos[k + 2] = z.getZ(i + j); }
    const o = new THREE.BufferGeometry(); o.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    o.addGroup(0, fondo.length * 3, 0); o.addGroup(fondo.length * 3, letras.length * 3, 1);
    o.computeVertexNormals(); o.translate(0, 0, -modelo.medidas.grueso / 2); g.dispose();
    grupo.add(new THREE.Mesh(o, [mat(C.terracota, 0.7), mat(C.arena, 0.55)])); encuadrar(); render();
  };
  const limpiar = () => { if (!renderer) return; grupo.children.forEach(o => o.geometry.dispose()); grupo.clear(); render(); };
  const render = () => { if (renderer) renderer.render(scene, cam); };
  const loop = now => {
    raf = 0; if (!visible || reduced || !renderer) return;
    grupo.rotation.z = Math.sin((now - t0) / 2600) * 0.32; render(); raf = requestAnimationFrame(loop);
  };
  const arrancar = () => { if (!raf && visible && !reduced) raf = requestAnimationFrame(loop); };

  let turno = 0;
  const actualizar = async () => {
    const yo = ++turno;
    const v = validarNombre(input.value);
    const vacio = !input.value.trim();
    input.setAttribute('aria-invalid', v.ok || vacio ? 'false' : 'true');
    if (!v.ok) {
      // campo vacío: invitación en gris, no error
      msg.classList.remove('ok'); msg.classList.toggle('pista', vacio); msg.textContent = vacio ? textos.vacio : v.msg;
      modelo = null; medidas.textContent = ''; boton.disabled = true; limpiar(); return null;
    }
    msg.textContent = ''; msg.classList.remove('ok', 'pista');
    boton.disabled = true; root.classList.add('n3d-cargando');
    const { w, fuente } = await motor();
    if (yo !== turno) return null; // llegó otra tecla mientras tanto
    const nuevo = construirLlavero(w, fuente, v.nombre);
    if (modelo) modelo.geometria.dispose();
    modelo = nuevo; root.classList.remove('n3d-cargando'); boton.disabled = false;
    const { ancho, alto, grueso } = modelo.medidas;
    medidas.textContent = `${ancho} × ${alto} × ${grueso} mm · STL`;
    dibujarModelo();
    return v;
  };
  let pend = 0, listo = false;
  input.addEventListener('input', () => { clearTimeout(pend); pend = setTimeout(actualizar, 200); });
  form.addEventListener('submit', async e => {
    e.preventDefault(); clearTimeout(pend);
    const v0 = validarNombre(input.value);
    if (!v0.ok) { actualizar(); msg.textContent = v0.msg; input.focus(); return; }
    const v = await actualizar(); if (!v || !modelo) return;
    const blob = new Blob([exportarSTL(modelo)], { type: 'model/stl' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = archivoNombre(v.nombre);
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    msg.textContent = 'Listo: tu archivo se descargó.'; msg.classList.remove('pista'); msg.classList.add('ok');
  });
  input.maxLength = 40; // tope amplio solo contra pegados enormes; el límite de 12 lo avisa validarNombre
  input.value = inicial; boton.disabled = true;
  // el primer cálculo (y la descarga del motor) espera a que la sección esté cerca
  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) { iniciar(); render(); arrancar(); if (!listo) { listo = true; actualizar(); } } }, { rootMargin: '600px 0px' }).observe(cv);
  input.addEventListener('focus', () => { if (!listo) { listo = true; actualizar(); } });
  addEventListener('resize', redimensionar);
  return { actualizar, get modelo() { return modelo; } };
}
