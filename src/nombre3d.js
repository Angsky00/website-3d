// Tu nombre en 3D (llavero): valida el nombre y arma un llavero de una sola pieza (letras en relieve sobre un
// respaldo redondeado que las une, con ojal para la argolla). Las uniones son booleanas reales (manifold-3d), así que
// el STL sale como un único sólido cerrado, en mm, con Z hacia arriba y la cara de abajo en z = 0.
import * as THREE from 'three';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';

export const MAX = 12;
const LETRA = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+$/;
// mm, pensadas para la K1C. mayuscula: alto de las mayúsculas (minimo: lo menos que se reduce para caber en anchoMax). contorno: cuánto sobresale el respaldo de las letras.
// cierre: además del contorno, cierra huecos de hasta 2 × (contorno + cierre) entre letras, puntos y tildes sin engordar el borde.
export const MEDIDAS = { mayuscula: 15, minimo: 10, respaldo: 3, relieve: 1.6, contorno: 2, cierre: 1.6, engrosar: 0.3, agujero: 4.6, pared: 2.4, anchoMax: 150, segmentos: 32 };

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

export const MODELOS = ['letras', 'fondo', 'hueso', 'cuadros'];
// slugs de archivo (Marketing): Angel-llavero-huesito-pacifico.stl
export const MODELO_ARCHIVO = { letras: 'letras', fondo: 'con-fondo', hueso: 'huesito', cuadros: 'cuadritos' };
export const ESTILO_ARCHIVO = { script: 'pacifico', retro: 'lobster', moderna: 'lobster-two', dulce: 'leckerli-one', pincel: 'kaushan-script', brocha: 'oleo-script', floreada: 'sansita-swashed', cursiva: 'courgette', vintage: 'grand-hotel', tarde: 'merienda' };

// Devuelve { geometria (THREE.BufferGeometry indexada), medidas, cuerpos, resistencia… } y libera la memoria de wasm.
// modelo: 'letras' (solo letras fundidas entre sí, sin base), 'fondo' (letras sobre base redondeada),
// 'hueso' (letras sobre un hueso) o 'cuadros' (cada letra en su cuadro con marco en relieve).
// Todos se arman igual: una huella «base» (z 0 → respaldo) y un «relieve» encima que cae dentro de la base,
// fundidos con una unión booleana real ⇒ un único sólido cerrado.
export function construirLlavero(w, fuente, nombre, modelo = 'fondo', m = MEDIDAS) {
  if (!MODELOS.includes(modelo)) throw new Error('modelo desconocido: ' + modelo);
  // si no cabe en anchoMax se reduce todo menos el grosor y el ojal, pero nunca por debajo de minimo (mm de mayúscula):
  // si ni así cabe, se devuelve { cabe: false } sin geometría y la interfaz bloquea la descarga
  // en «cuadros» cada letra se ajusta a su cuadro: lo que debe medir al menos minimo es el interior del cuadro
  const interior = e => modelo === 'cuadros' ? 21 * e - 2 * (1.6 + 1.2) : m.mayuscula * e;
  // en cuadros el alto de cada letra (no solo el interior del cuadro) debe llegar a minimo; una M ancha
  // fija el piso: el cuadro tiene que caber esa letra a 10 mm de alto
  let piso = modelo === 'cuadros' ? (m.minimo + 2 * (1.6 + 1.2)) / 21 : m.minimo / m.mayuscula;
  if (modelo === 'cuadros') {
    let rel = 1;
    for (const ch of nombre) {
      const g = fuente.glyphs[ch]; if (!g) continue;
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      for (const c of g.c) for (let i = 0; i < c.length; i += 2) { const x = c[i], y = c[i + 1]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      if (y1 > y0) rel = Math.max(rel, (x1 - x0) / (y1 - y0));
    }
    piso = Math.max(piso, (m.minimo * rel + 1.2 + 2 * (1.6 + 1.2)) / 21);
  }
  // estimación rápida del ancho (sin booleanas) con cotas por abajo de lo que suman ojal, contorno o bolas:
  // descarta de inmediato lo que no cabe ni al mínimo y arranca cerca de la escala buena
  const ri = m.agujero / 2, R = ri + m.pared, ojal = ri + 2 + R;
  const n = [...nombre].length, { polys } = contornosNombre(fuente, nombre);
  let x0 = Infinity, x1 = -Infinity; for (const pl of polys) for (const [x] of pl) { if (x < x0) x0 = x; if (x > x1) x1 = x; }
  const crudo = (x1 - x0) * m.mayuscula / fuente.capHeight;
  const extra = { letras: ojal, fondo: ojal + 2 * m.contorno, hueso: 6 + 2 * 1.3 * (R + 1.2), cuadros: ojal }[modelo];
  const estimar = e => modelo === 'cuadros' ? n * (21 * e - 1.6) + 1.6 + extra : crudo * e + extra;
  if (estimar(piso) > m.anchoMax + 1) return { cabe: false, modelo, medidas: { ancho: Math.round(estimar(piso) * 10) / 10 } };
  let escala = Math.max(piso, Math.min(1, estimar(1) > m.anchoMax ? (modelo === 'cuadros' ? ((m.anchoMax - extra - 1.6) / n + 1.6) / 21 : (m.anchoMax - extra) / crudo) : 1)), r = null;
  for (let i = 0; i < 5; i++) {
    r = armar(w, fuente, nombre, modelo, m, escala);
    const altoOk = (r.altoLetraMin ?? interior(escala)) >= m.minimo - 1e-6;
    if (r.medidas.ancho <= m.anchoMax && altoOk) return { ...r, cabe: true, mayuscula: Math.round(interior(escala) * 10) / 10 };
    r.geometria.dispose();
    if (r.medidas.ancho <= m.anchoMax && !altoOk) {
      if (escala >= 1 - 1e-9) break;
      escala = Math.min(1, escala * 1.06); continue;
    }
    if (escala <= piso) break;
    const sobra = r.ojalAncho; escala = Math.max(piso, escala * ((m.anchoMax - sobra) / (r.medidas.ancho - sobra)) * 0.995);
  }
  return { cabe: false, modelo, medidas: r.medidas };
}

const areaFirmada = p => { let a = 0; for (let i = 0, j = p.length - 1; i < p.length; j = i++) a += (p[j][0] - p[i][0]) * (p[j][1] + p[i][1]); return a / 2; };

function armar(w, fuente, nombre, modelo, m, escala) {
  const { CrossSection, Manifold } = w, basura = [], G = x => (basura.push(x), x);
  const seg = m.segmentos, circulo = (rad, c) => G(CrossSection.circle(rad, seg).translate(c));
  const abrir = c => G(G(c.offset(-0.6, 'Round', 2, seg)).offset(0.6, 'Round', 2, seg));
  // engrosado (estilo «burbuja») y apertura de 0.6 mm: las letras quedan como unión de discos de 1.2 mm, así que ningún
  // trazo, tilde o virgulilla mide menos de 1.2 mm. Se engrosa de 0.1 en 0.1 mm hasta que la apertura casi no recorte
  // (< 2 % del área): una fuente que necesite más de 0.6 mm no aguanta y no se usa (lo revisa stlqa).
  let engrosado = m.engrosar, perdida = 0;
  // el cierre de 0.8 mm se aplica por componente: si se aplicara al nombre entero, tildes y puntos
  // (ñ, i, Í) se funden con el cuerpo en un blob. La base (o un puente de 1.2 mm) es lo que los une.
  const reforzar = L0 => {
    L0 = G(L0.simplify(0.02)); // las curvas de la fuente traen vértices de sobra: las booleanas se vuelven lentas
    const partes = L0.decompose().map(G).filter(c => c.area() > 1e-4);
    let areaG = 0, areaAbierta = 0, engrMax = m.engrosar;
    const una = P0 => {
      let L;
      for (let engr = m.engrosar; ; engr = Math.round((engr + 0.1) * 10) / 10) {
        const g = G(P0.offset(engr, 'Round', 2, seg)); L = abrir(g); const perd = 1 - L.area() / g.area();
        if (perd < 0.02 || engr >= 0.8) {
          // cierre de 0.8 mm y otra apertura de 0.6, solo dentro de esta pieza
          L = G(sinCuellos(abrir(G(G(L.offset(0.8, 'Round', 2, seg)).offset(-0.8, 'Round', 2, seg)))).simplify(0.01));
          areaG += g.area(); areaAbierta += (1 - perd) * g.area(); engrMax = Math.max(engrMax, engr);
          return L;
        }
      }
    };
    const piezas = partes.map(una);
    piezas.sort((a, b) => b.area() - a.area());
    let L = piezas[0];
    for (let i = 1; i < piezas.length; i++) {
      // si el engrosado hizo solapar un acento con el cuerpo, se recorta para dejar un hueco visible
      let p = piezas[i];
      if (G(p.intersect(L)).area() > 1e-4) p = G(p.subtract(G(L.offset(0.25, 'Round', 2, seg))));
      if (p.area() > 1e-3) L = G(CrossSection.union([L, p]));
    }
    engrosado = engrMax; perdida = areaG ? 1 - areaAbierta / areaG : 0;
    return L;
  };
  // cuellos: donde dos discos de 1.2 mm apenas se tocan, el núcleo (erosión de 0.6) de una misma pieza se parte;
  // se unen esos núcleos con una cápsula de 1.2 mm de ancho, así el cuello más angosto mide al menos 1.2 mm
  const sinCuellos = L => {
    for (let vuelta = 0; vuelta < 40; vuelta++) {
      const caps = [];
      for (const c of L.decompose().map(G)) {
        const E = G(c.offset(-0.6, 'Round', 2, seg)).decompose().map(G).filter(e => e.area() > 1e-3);
        if (E.length < 2) continue;
        E.sort((a, b) => b.area() - a.area());
        const pts = E.map(e => G(e.simplify(0.05)).toPolygons().flat());
        for (let i = 1; i < pts.length; i++) {
          let best = null;
          for (const p of pts[i]) for (let j = 0; j < i; j++) for (const q of pts[j]) { const d = Math.hypot(p[0] - q[0], p[1] - q[1]); if (!best || d < best.d) best = { d, p, q }; }
          caps.push(G(CrossSection.hull([circulo(0.62, best.p), circulo(0.62, best.q)])));
        }
      }
      if (!caps.length) return L;
      L = G(CrossSection.union([L, ...caps]));
    }
    return L;
  };
  // une lo que haya quedado suelto con un puente redondeado al punto más cercano de la pieza mayor
  let puentes = 0;
  const unir = (B, radio) => {
    let partes = B.decompose(); partes.forEach(G);
    while (partes.length > 1 && puentes < 30) {
      partes.sort((a, b) => b.area() - a.area());
      const pts = partes.map(c => c.toPolygons().flat());
      let best = null;
      for (let i = 1; i < pts.length; i++) for (const p of pts[i]) for (const q of pts[0]) { const d = Math.hypot(p[0] - q[0], p[1] - q[1]); if (!best || d < best.d) best = { d, p, q }; }
      const puente = G(CrossSection.hull([circulo(radio, best.p), circulo(radio, best.q)]));
      B = G(CrossSection.union([B, puente])); partes = B.decompose(); partes.forEach(G); puentes++;
    }
    return B;
  };
  try {
    const s = escala * m.mayuscula / fuente.capHeight, ri = m.agujero / 2, R = ri + m.pared;
    let base, relieve, ojal, L, minAltoLetra = m.mayuscula * escala, componentesGlifo = 1;
    if (modelo === 'cuadros') {
      // cuadros iguales en fila, solapados un ancho de marco para que el marco compartido sea uno solo
      const marco = 1.6, holgura = 1.2, n = [...nombre].length;
      const lado = escala * 21, paso = lado - marco, interior = lado - 2 * (marco + holgura);
      const letras = [], cuadros = [], marcos = [];
      let minAltoLetra = Infinity;
      [...nombre].forEach((ch, i) => {
        const g = fuente.glyphs[ch]; if (!g) throw new Error('letra sin glifo: ' + ch);
        // se ajusta al cuadro ANTES de engrosar, para no adelgazar trazos al reducir
        const crudo = k => G(new CrossSection(g.c.map(c => { const p = []; for (let j = 0; j < c.length; j += 2) p.push([c[j] * k, c[j + 1] * k]); return p; }), 'NonZero'));
        const b0 = crudo(s).bounds(), alto0 = Math.max(1e-6, b0.max[1] - b0.min[1]);
        // por el alto de la letra (no por max(ancho, alto)): una M ancha no queda por debajo de 10 mm
        let f = Math.min(1, interior / alto0);
        if (alto0 * f < m.minimo) f = m.minimo / alto0;
        let Lc = reforzar(crudo(s * f)), b = Lc.bounds();
        if (b.max[1] - b.min[1] < m.minimo - 1e-3) { const k = m.minimo / (b.max[1] - b.min[1]); Lc = G(Lc.scale(k)); b = Lc.bounds(); }
        minAltoLetra = Math.min(minAltoLetra, b.max[1] - b.min[1]);
        const cx = i * paso + lado / 2;
        letras.push(G(Lc.translate([cx - (b.min[0] + b.max[0]) / 2, -(b.min[1] + b.max[1]) / 2])));
        const q = G(G(CrossSection.square([lado, lado], true)).translate([cx, 0]));
        const qr = G(G(G(q.offset(-2, 'Round', 2, seg)).offset(2, 'Round', 2, seg)));
        // el marco queda 0.4 mm adentro del borde: sin paredes coplanares con la base
        const qi = G(qr.offset(-0.4, 'Round', 2, seg));
        cuadros.push(qr); marcos.push(G(qi.subtract(G(qi.offset(-marco, 'Round', 2, seg)))));
        void n;
      });
      L = G(CrossSection.union(letras));
      componentesGlifo = L.decompose().map(G).filter(c => c.area() > 1e-4).length;
      const cuerpo = G(CrossSection.union(cuadros));
      ojal = { cx: -(ri + 2), cy: 0 };
      // si una letra ancha (W, M) se acerca al ojal, se aleja el aro para dejar 2 mm
      const lq = L.bounds();
      if (ojal.cx + ri + 2 > lq.min[0]) ojal.cx = lq.min[0] - ri - 2;
      const cuello = G(CrossSection.hull([circulo(R, [ojal.cx, 0]), circulo(lado * 0.3, [lado * 0.3, 0])]));
      base = G(CrossSection.union([cuerpo, cuello]));
      relieve = G(CrossSection.union([L, G(CrossSection.union(marcos))]));
    } else {
      const { polys, primera } = contornosNombre(fuente, nombre);
      const esc = ps => ps.map(p => p.map(([x, y]) => [x * s, y * s]));
      const Lcrudo = G(new CrossSection(esc(polys), 'NonZero'));
      componentesGlifo = Lcrudo.decompose().map(G).filter(c => c.area() > 1e-4).length;
      L = reforzar(Lcrudo);
      const lb = L.bounds(), P = esc(primera).flat();
      let izq = P[0]; for (const p of P) if (p[0] < izq[0]) izq = p;
      if (modelo === 'hueso') {
        // hueso: barra con margen alrededor del nombre y dos bolas en cada punta; el ojal va en la bola de arriba a la izquierda
        const mg = 3, x0 = lb.min[0] - mg, x1 = lb.max[0] + mg, y0 = lb.min[1] - mg, y1 = lb.max[1] + mg, h = y1 - y0, yc = (y0 + y1) / 2;
        const rb = Math.max(R + 1.2, h * 0.36), dy = h * 0.36, kx0 = x0 - rb * 0.3, kx1 = x1 + rb * 0.3;
        // la barra cubre tildes, virgulillas y descendentes con 1.6 mm de margen: el 80 % del alto
        // no alcanza cuando el nombre es alto (p. ej. Íñigo con g), y un recorte fino deja triángulos degenerados
        const cubre = 1.6;
        const by0 = Math.min(yc - h * 0.4, lb.min[1] - cubre), by1 = Math.max(yc + h * 0.4, lb.max[1] + cubre);
        const barra = G(G(CrossSection.square([x1 - x0, by1 - by0])).translate([x0, by0]));
        base = G(CrossSection.union([barra, circulo(rb, [kx0, yc + dy]), circulo(rb, [kx0, yc - dy]), circulo(rb, [kx1, yc + dy]), circulo(rb, [kx1, yc - dy])]));
        base = G(G(base.offset(1, 'Round', 2, seg)).offset(-1, 'Round', 2, seg)); // redondea la unión barra–bolas
        ojal = { cx: kx0 - rb * 0.15, cy: yc + dy + rb * 0.1 };
        // el agujero no debe tocar las letras: si quedara a menos de 2 mm, se aleja hacia afuera
        const dist = Math.hypot(ojal.cx - izq[0], ojal.cy - izq[1]);
        if (ojal.cx + ri + 2 > lb.min[0]) ojal.cx = lb.min[0] - ri - 2;
        void dist;
        base = G(CrossSection.union([base, circulo(R, [ojal.cx, ojal.cy])]));
      } else {
        // 'fondo': contorno de 2 mm + cierre; 'letras': solo el cierre y un filo de 0.4 mm (sin paredes coplanares con las letras) y lo que une
        // letras, puntos y tildes queda más bajo que las letras para que se lean
        const contorno = modelo === 'fondo' ? m.contorno : 0.4, cierre = modelo === 'fondo' ? m.cierre : 2.4;
        base = unir(G(G(G(G(L.simplify(0.05)).offset(contorno + cierre, 'Round', 2, seg)).simplify(0.02)).offset(-cierre, 'Round', 2, seg)), modelo === 'fondo' ? m.contorno * 0.9 : 1.1);
        const cy = Math.min(Math.max(izq[1], lb.min[1] + R * 0.6), lb.max[1] - R * 0.6);
        ojal = { cx: lb.min[0] - (ri + 2), cy };
        // cuello macizo entre el aro y la primera letra (no solo un punto de contacto)
        const cuello = G(CrossSection.hull([circulo(R, [ojal.cx, ojal.cy]), circulo(1.6, [izq[0] + 1.2, izq[1]])]));
        base = G(CrossSection.union([base, cuello]));
      }
      relieve = L;
    }
    // con fondo, hueso y cuadros la base es maciza: solo su contorno exterior, sin huecos encerrados (C, entre I y T…)
    let contadores = 0;
    if (modelo !== 'letras') base = G(new CrossSection(base.toPolygons().filter(p => areaFirmada(p) > 0), 'NonZero'));
    else {
      // en «solo letras» se conservan solo los huecos que caen dentro del contrapunzón de una letra (O, A, a…);
      // los que abre el cierre de 2.4 mm (boca de la C, entre I y T, entre eles) se rellenan
      const pos = p => areaFirmada(p) > 0 ? p : [...p].reverse();
      const huecosL = L.toPolygons().filter(p => areaFirmada(p) < 0);
      const counters = huecosL.length ? G(new CrossSection(huecosL.map(pos), 'NonZero')) : null;
      const kept = [];
      for (const p of base.toPolygons()) {
        if (areaFirmada(p) > 0) { kept.push(p); continue; }
        if (!counters) continue;
        const h = G(new CrossSection([pos(p)], 'NonZero'));
        if (G(h.intersect(counters)).area() > h.area() * 0.5) { kept.push(p); contadores++; }
      }
      base = G(new CrossSection(kept, 'NonZero'));
    }
    // agujero del ojal y cierre fino (+0.15/−0.15) que elimina puntos donde dos lóbulos solo se tocan en un vértice
    base = G(G(G(G(base.subtract(circulo(ri, [ojal.cx, ojal.cy]))).offset(0.15, 'Round', 2, seg)).offset(-0.15, 'Round', 2, seg)).simplify(0.01));
    // componentes y separación de acentos se miden en las letras (L), independientes de la base
    const compsL = L.decompose().map(G).filter(c => c.area() > 1e-4);
    const componentes = compsL.length;
    let separacionAcentos = componentes <= 1 ? Infinity : Infinity;
    if (compsL.length > 1) {
      const pts = compsL.map(c => G(c.simplify(0.12)).toPolygons().flat());
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
        for (const p of pts[i]) for (const q of pts[j]) {
          const d = Math.hypot(p[0] - q[0], p[1] - q[1]); if (d < separacionAcentos) separacionAcentos = d;
        }
      }
    }
    relieve = G(G(relieve.intersect(base)).simplify(0.01));
    const hundido = 0.6; // el relieve arranca dentro de la base: sin caras coplanares en la unión
    const solido = G(Manifold.union(G(base.extrude(m.respaldo)), G(G(relieve.extrude(m.relieve + hundido)).translate([0, 0, m.respaldo - hundido]))));
    const bb = solido.boundingBox(), dx = -(bb.min[0] + bb.max[0]) / 2, dy = -(bb.min[1] + bb.max[1]) / 2;
    let final = G(solido.translate([dx, dy, 0]));
    if (final.simplify) final = G(final.simplify(0.02)); // quita aristas diminutas que dejan las booleanas
    const cuerpos = final.decompose(); cuerpos.forEach(G);
    const mesh = final.getMesh();
    const np = mesh.numProp, pos = new Float32Array(mesh.vertProperties.length / np * 3);
    for (let i = 0, j = 0; i < mesh.vertProperties.length; i += np, j += 3) { pos[j] = mesh.vertProperties[i]; pos[j + 1] = mesh.vertProperties[i + 1]; pos[j + 2] = mesh.vertProperties[i + 2]; }
    const geometria = new THREE.BufferGeometry();
    geometria.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geometria.setIndex(new THREE.BufferAttribute(new Uint32Array(mesh.triVerts), 1));
    geometria.computeVertexNormals();
    // resistencia (2D): trazos de las letras ≥ 1.2 mm (ya son su propia apertura); la base erosionada 0.6 mm sigue
    // en una pieza (puentes ≥ 1.2 mm); erosionada 1 mm deja el aro del ojal cerrado (pared ≥ 2 mm alrededor del agujero)
    const trazo = abrir(L).area() / L.area();
    const eB = G(base.offset(-0.6, 'Round', 2, seg)).decompose(); eB.forEach(G);
    const anillo = G(G(base.offset(-1, 'Round', 2, seg)).intersect(circulo(R + 0.5, [ojal.cx, ojal.cy])));
    const dLetras = G(L.intersect(circulo(ri + 2, [ojal.cx, ojal.cy]))).area();
    // cuellos: erosionar 0.55 mm cada pieza del relieve no debe partirla (sin uniones de menos de ~1.2 mm)
    const piezas = c => { const d = c.decompose(); d.forEach(G); return d.length; };
    const cuellos = piezas(relieve) === piezas(G(relieve.offset(-0.55, 'Round', 2, seg)));
    const resistencia = { cuellos, trazos: trazo > 0.995, puentes: eB.length === 1, ojal: anillo.decompose().map(G).length === 1 && anillo.toPolygons().length === 2 && dLetras === 0, agujero: m.agujero, pared: m.pared };
    const r1 = v => Math.round(v * 10) / 10;
    const generoEsperado = modelo === 'letras' ? 1 + contadores : 1;
    return {
      geometria, modelo, respaldo: m.respaldo, engrosado, perdida, cuerpos: cuerpos.length, volumen: final.volume(), resistencia, estado: final.status(), genero: final.genus(), puentes,
      contadores, generoEsperado, altoLetraMin: r1(minAltoLetra), componentes, componentesGlifo, separacionAcentos: componentes <= 1 ? null : Math.round(separacionAcentos * 100) / 100,
      ojalAncho: 2 * R + 2, medidas: { ancho: r1(bb.max[0] - bb.min[0]), alto: r1(bb.max[1] - bb.min[1]), grueso: r1(bb.max[2] - bb.min[2]) },
    };
  } finally { for (const o of basura) try { o.delete(); } catch {} }
}

// STL binario en mm (un único sólido)
export function exportarSTL(modelo) {
  return new STLExporter().parse(new THREE.Mesh(modelo.geometria), { binary: true });
}

// Marketing: Angel-llavero-huesito-pacifico.stl (capitalización del nombre, sin acentos; modelo y estilo en minúsculas)
export function archivoNombre(n, modelo = 'letras', estilo = 'script') {
  const nombre = n.normalize('NFC').normalize('NFD').replace(/\p{M}/gu, '');
  return `${nombre}-llavero-${MODELO_ARCHIVO[modelo] || modelo}-${ESTILO_ARCHIVO[estilo] || estilo}.stl`;
}
