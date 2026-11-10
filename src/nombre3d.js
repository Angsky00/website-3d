// Tu nombre en 3D (llavero): valida el nombre y arma un llavero de una sola pieza (letras en relieve sobre un
// respaldo redondeado que las une, con ojal para la argolla). Las uniones son booleanas reales (manifold-3d), así que
// el STL sale como un único sólido cerrado, en mm, con Z hacia arriba y la cara de abajo en z = 0.
import * as THREE from 'three';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';

export const MAX = 12;
const LETRA = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+$/;
// mm, pensadas para la K1C. mayuscula: alto de las mayúsculas. contorno: cuánto sobresale el respaldo de las letras.
// cierre: además del contorno, cierra huecos de hasta 2 × (contorno + cierre) entre letras, puntos y tildes sin engordar el borde.
export const MEDIDAS = { mayuscula: 15, respaldo: 3, relieve: 1.6, contorno: 2, cierre: 1.6, engrosar: 0.3, agujero: 4.6, pared: 2.4, anchoMax: 150, segmentos: 32 };

export function validarNombre(raw) {
  const s = (raw ?? '').normalize('NFC').trim();
  if (!s) return { ok: false, nombre: s, msg: 'Escribe tu nombre.' };
  if (/\s/.test(s)) return { ok: false, nombre: s, msg: 'Solo un nombre, sin espacios.' };
  if (/\d/.test(s)) return { ok: false, nombre: s, msg: 'Sin números: solo letras.' };
  if (!LETRA.test(s)) {
    // letras de otros idiomas (À, ç, ß…) tienen su propio aviso; el resto son números, emoji o signos
    const fuera = [...s].filter(ch => !LETRA.test(ch));
    const msg = fuera.every(ch => /\p{L}\p{M}*/u.test(ch)) ? 'Esa letra no está disponible. Usa letras del español.' : 'Sin símbolos: solo letras, con acentos y ñ.';
    return { ok: false, nombre: s, msg };
  }
  if ([...s].length > MAX) return { ok: false, nombre: s, msg: 'Máximo 12 letras. Prueba con tu apodo o solo el primer nombre.' };
  return { ok: true, nombre: s, msg: '' };
}


let wasmP = null;
// opciones: las de Emscripten (en el navegador, locateFile para encontrar manifold.wasm)
export function cargarManifold(opciones) {
  if (!wasmP) wasmP = import('manifold-3d').then(m => m.default(opciones)).then(w => { w.setup(); return w; });
  return wasmP;
}

function contornosNombre(fuente, nombre) {
  const out = []; let pen = 0, prev = '', primera = null;
  for (const ch of nombre) {
    const g = fuente.glyphs[ch]; if (!g) throw new Error('letra sin glifo: ' + ch);
    if (prev) pen += fuente.kern[prev + ch] || 0;
    const polys = g.c.map(c => { const p = []; for (let i = 0; i < c.length; i += 2) p.push([c[i] + pen, c[i + 1]]); return p; });
    if (!primera) primera = polys;
    out.push(...polys); pen += g.ha; prev = ch;
  }
  return { polys: out, primera };
}

// Devuelve { geometria (THREE.BufferGeometry indexada), medidas, cuerpos } y libera la memoria de wasm
export function construirLlavero(w, fuente, nombre, m = MEDIDAS) {
  const { CrossSection, Manifold } = w, basura = [], G = x => (basura.push(x), x);
  try {
    const { polys, primera } = contornosNombre(fuente, nombre);
    let s = m.mayuscula / fuente.capHeight;
    const esc = ps => ps.map(p => p.map(([x, y]) => [x * s, y * s]));
    let L = G(new CrossSection(esc(polys), 'NonZero'));
    // si no cabe, se reduce la escala (sin bajar el grosor del respaldo ni el ojal)
    const ojalAncho = m.agujero + 2 * m.pared;
    const b0 = L.bounds(), ancho0 = b0.max[0] - b0.min[0] + 2 * m.contorno + ojalAncho;
    if (ancho0 > m.anchoMax) { s *= (m.anchoMax - 2 * m.contorno - ojalAncho) / (b0.max[0] - b0.min[0]); L = G(new CrossSection(esc(polys), 'NonZero')); }
    // engrosado (estilo «burbuja») y apertura morfológica de 0.6 mm: lo que queda de las letras es unión de discos
    // de 1.2 mm, así que ningún trazo, tilde o virgulilla mide menos de 1.2 mm. Se engrosa de 0.1 en 0.1 mm hasta que
    // la apertura casi no recorte (< 2 % del área), para no perder detalle de la letra.
    const seg = m.segmentos, abrir = c => G(G(c.offset(-0.6, 'Round', 2, seg)).offset(0.6, 'Round', 2, seg));
    const L0 = L; let engrosado = m.engrosar;
    for (;;) {
      const g = G(L0.offset(engrosado, 'Round', 2, seg)); L = abrir(g);
      if (L.area() >= g.area() * 0.98 || engrosado >= 0.8) break;
      engrosado = Math.round((engrosado + 0.1) * 10) / 10;
    }
    // respaldo: contorno + cierre morfológico (ensancha y vuelve a encoger) para unir letras, puntos y tildes
    let B = G(G(L.offset(m.contorno + m.cierre, 'Round', 2, seg)).offset(-m.cierre, 'Round', 2, seg));
    let partes = B.decompose(); partes.forEach(G);
    // respaldo de seguridad: si algo quedó suelto, puente redondeado al punto más cercano del resto
    let puentes = 0;
    while (partes.length > 1 && puentes < 20) {
      const pts = partes.map(c => c.toPolygons().flat());
      partes.sort((a, b) => b.area() - a.area());
      const ptsOrden = partes.map(c => c.toPolygons().flat());
      let best = null;
      for (let i = 1; i < ptsOrden.length; i++) for (const p of ptsOrden[i]) for (const q of ptsOrden[0]) { const d = Math.hypot(p[0] - q[0], p[1] - q[1]); if (!best || d < best.d) best = { d, p, q }; }
      const r = m.contorno * 0.9;
      const puente = G(CrossSection.hull([G(CrossSection.circle(r, seg).translate(best.p)), G(CrossSection.circle(r, seg).translate(best.q))]));
      B = G(CrossSection.union([B, puente])); partes = B.decompose(); partes.forEach(G); puentes++;
      void pts;
    }
    // ojal a la izquierda de la primera letra, a la altura de su punto más a la izquierda
    const P = esc(primera).flat(); let izq = P[0]; for (const p of P) if (p[0] < izq[0]) izq = p;
    const lb = L.bounds(), ri = m.agujero / 2, R = ri + m.pared;
    const cy = Math.min(Math.max(izq[1], lb.min[1] + R * 0.6), lb.max[1] - R * 0.6);
    const cx = lb.min[0] - (ri + m.pared);
    const aro = G(CrossSection.circle(R, seg).translate([cx, cy])), hueco = G(CrossSection.circle(ri, seg).translate([cx, cy]));
    // el cierre fino (+0.15/−0.15) elimina puntos donde dos lóbulos solo se tocan en un vértice
    const base = G(G(G(G(G(CrossSection.union([B, aro])).subtract(hueco)).offset(0.15, 'Round', 2, seg)).offset(-0.15, 'Round', 2, seg)).simplify(0.01));
    L = G(L.simplify(0.01));
    // sólido: respaldo + letras encima (las letras están dentro del contorno del respaldo; la unión las funde en una pieza)
    const hundido = 0.6; // las letras arrancan dentro del respaldo: sin caras coplanares en la unión
    const solido = G(Manifold.union(G(base.extrude(m.respaldo)), G(G(L.extrude(m.relieve + hundido)).translate([0, 0, m.respaldo - hundido]))));
    const bb = solido.boundingBox(), dx = -(bb.min[0] + bb.max[0]) / 2, dy = -(bb.min[1] + bb.max[1]) / 2;
    let final = G(solido.translate([dx, dy, 0]));
    // quita aristas diminutas que dejan las booleanas (triángulos casi degenerados en el STL)
    if (final.simplify) final = G(final.simplify(0.02));
    const cuerpos = final.decompose(); cuerpos.forEach(G);
    const mesh = final.getMesh();
    const np = mesh.numProp, pos = new Float32Array(mesh.vertProperties.length / np * 3);
    for (let i = 0, j = 0; i < mesh.vertProperties.length; i += np, j += 3) { pos[j] = mesh.vertProperties[i]; pos[j + 1] = mesh.vertProperties[i + 1]; pos[j + 2] = mesh.vertProperties[i + 2]; }
    const geometria = new THREE.BufferGeometry();
    geometria.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geometria.setIndex(new THREE.BufferAttribute(new Uint32Array(mesh.triVerts), 1));
    geometria.computeVertexNormals();
    // resistencia (en 2D): las letras ya son su propia apertura de 0.6 mm (trazo ≥ 1.2 mm); erosionar 0.6 mm el
    // respaldo no debe partirlo (puentes ≥ 1.2 mm); erosionar 1 mm debe dejar el aro del ojal cerrado (pared ≥ 2 mm)
    const trazo = abrir(L).area() / L.area();
    const eB = G(base.offset(-0.6, 'Round', 2, seg)).decompose(); eB.forEach(G);
    const anillo = G(G(base.offset(-1, 'Round', 2, seg)).intersect(G(CrossSection.circle(R + 0.5, seg).translate([cx, cy]))));
    const resistencia = { trazos: trazo > 0.995, puentes: eB.length === 1, ojal: anillo.decompose().map(G).length === 1 && anillo.toPolygons().length === 2, agujero: m.agujero, pared: m.pared };
    const r1 = v => Math.round(v * 10) / 10;
    return {
      geometria, respaldo: m.respaldo, engrosado, cuerpos: cuerpos.length, volumen: final.volume(), resistencia, estado: final.status(), genero: final.genus(), puentes,
      medidas: { ancho: r1(bb.max[0] - bb.min[0]), alto: r1(bb.max[1] - bb.min[1]), grueso: r1(bb.max[2] - bb.min[2]) },
    };
  } finally { for (const o of basura) try { o.delete(); } catch {} }
}

// STL binario en mm (un único sólido)
export function exportarSTL(modelo) {
  return new STLExporter().parse(new THREE.Mesh(modelo.geometria), { binary: true });
}

// conserva mayúsculas, acentos y ñ para que «I» e «i» o «Ñ» y «n» no choquen
export const archivoNombre = n => 'camino-digital-' + n.normalize('NFC') + '.stl';
