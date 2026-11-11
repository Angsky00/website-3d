// QA del llavero «Tu nombre en 3D»: validación, fuentes y licencias, y STL binario de una sola pieza cerrada con ojal, en mm.
// Cada caso corre en un worker_threads (manifold se carga una vez). Si se pasa de TOPE_MS (30 s por defecto), se mata el worker, se anota la falla y se sigue.
import { createServer } from 'vite';
import { Worker } from 'node:worker_threads';
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
const m = await vite.ssrLoadModule('/src/nombre3d.js');
let fallas = 0; const ok = (c, t) => { if (!c) { fallas++; console.log('FALLA', t); } };
for (const s of ['Ana', 'José', 'Begoña', 'MARÍA', 'Güero', 'Xochitl', 'Maximilianoo']) ok(m.validarNombre(s).ok, 'acepta ' + s);
for (const s of ['', '  ', 'Ana2', 'R2D2', 'Ana!', 'Jo-sé', 'Ana María', 'José❤', '<b>', 'Maximilianooo', "O'Neil", '@ana', 'ana.']) ok(!m.validarNombre(s).ok, 'rechaza ' + JSON.stringify(s));
ok(m.validarNombre('Jose\u0301').ok && m.validarNombre('Jose\u0301').nombre === 'José', 'normaliza acento combinado');

import { readFileSync, readdirSync } from 'node:fs';
const FUENTES = readdirSync('src/fuentes-llavero').map(f => f.replace('.json', '')).sort();
const fuentesChk = Object.fromEntries(FUENTES.map(id => [id, JSON.parse(readFileSync(`src/fuentes-llavero/${id}.json`, 'utf8'))]));
const ALFABETO = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÁÉÍÓÚÜÑáéíóúüñ'];
for (const id of FUENTES) {
  const f = fuentesChk[id], falta = ALFABETO.filter(ch => !f.glyphs[ch]);
  ok(!falta.length, id + ': tiene todas las letras permitidas ' + falta.join(''));
  const lic = readFileSync(`public/licencias/llavero-${id}-OFL.txt`, 'utf8');
  ok(f.copyright && /Open Font License/.test(f.licencia) && lic.includes('SIL OPEN FONT LICENSE'), id + ': créditos y OFL');
  ok(lic.includes(f.copyright.slice(0, 40)), id + ': el copyright del JSON sale del OFL original');
  const corte = lic.search(/This Font Software is licensed/i);
  const cabeza = (corte < 0 ? lic : lic.slice(0, corte)).replace(/[ \t]*\n[ \t]*/g, ' ');
  const rfn = [];
  for (const m of cabeza.matchAll(/Reserved Font Names?\s+([^\n]+)/gi)) {
    const q = [...m[1].matchAll(/["“«]([^"”»]+)["”»]/g)].map(x => x[1].trim());
    if (q.length) rfn.push(...q); else { const u = m[1].replace(/^[, ]+/, '').replace(/\.$/, '').trim(); if (u) rfn.push(u); }
  }
  ok(rfn.every(n => !f.nombre.toLowerCase().includes(n.toLowerCase())), id + ': el subconjunto no usa nombre reservado ' + rfn.join(', '));
}

const TOPE_MS = +(process.env.TOPE_MS || 30000);
let worker = null, listo = null;

function arrancar() {
  const w = new Worker(new URL('./stlqa-worker.mjs', import.meta.url));
  worker = w;
  listo = new Promise((resolve, reject) => {
    const on = msg => { if (msg.t === 'listo') { w.off('message', on); resolve(); } };
    w.on('message', on);
    w.once('error', reject);
  });
  return listo;
}

async function pedir(fid, nombre, modelo, verbose) {
  if (!worker) await arrancar();
  else await listo;
  return new Promise(resolve => {
    let hecho = false;
    const tope = setTimeout(() => {
      if (hecho) return;
      hecho = true;
      const w = worker; worker = null; listo = null;
      w.terminate();
      fallas++;
      console.log('FALLA', `tiempo excedido ${modelo} ${fid} ${nombre} >${TOPE_MS / 1000} s`);
      resolve(null);
    }, TOPE_MS);
    const onMsg = msg => {
      if (hecho || msg.t !== 'res') return;
      hecho = true; clearTimeout(tope); worker.off('message', onMsg);
      resolve(msg);
    };
    const onErr = err => {
      if (hecho) return;
      hecho = true; clearTimeout(tope);
      const w = worker; worker = null; listo = null;
      try { w.terminate(); } catch {}
      fallas++;
      console.log('FALLA', `${modelo} ${fid} ${nombre}: worker ${err && err.message || err}`);
      resolve(null);
    };
    worker.on('message', onMsg);
    worker.once('error', onErr);
    worker.postMessage({ fid, nombre, modelo, verbose, lento: process.env.LENTO });
  });
}

// STL binario → cerrado (cada arista no dirigida exactamente en 2 caras, sentidos opuestos), UNA sola pieza conectada
// por aristas (no basta tocarse en un vértice), apoyada en z = 0, con el agujero del ojal (género ≥ 1) y medidas en mm
const maxEngr = {}, noCaben = [], leg = { contrapunzones: 0, pares: 0, minApertura: Infinity, minHueco: Infinity };
async function revisar(fid, nombre, verbose, modelo = 'letras') {
  const res = await pedir(fid, nombre, modelo, verbose);
  if (!res) return null;
  if (res.error) { ok(false, `${modelo} ${fid} ${nombre}: ${res.error}`); return null; }
  ok(res.modelo === modelo, `${modelo} ${fid} ${nombre}: modelo pedido`);
  if (!res.cabe) { // no cabe con letras de 10 mm: debe ser de verdad más ancho que la cama, y no trae geometría
    ok(res.medidas.ancho > m.MEDIDAS.anchoMax && !res.stl, `${modelo} ${fid} ${nombre}: no cabe a 10 mm (${res.medidas.ancho} mm) y se bloquea`);
    noCaben.push(`${modelo}/${fid}/${nombre}`); return null;
  }
  ok(res.mayuscula >= m.MEDIDAS.minimo - 1e-6, `${modelo} ${fid} ${nombre}: letras de al menos 10 mm (${res.mayuscula})`);
  const dv = new DataView(res.stl), n = dv.getUint32(80, true);
  ok(dv.byteLength === 84 + n * 50, `${modelo} ${fid} ${nombre}: tamaño binario coherente`);
  const key = o => [dv.getFloat32(o, true), dv.getFloat32(o + 4, true), dv.getFloat32(o + 8, true)].map(v => Math.round(v * 1e4)).join(',');
  const edges = new Map(), verts = new Set(), par = [...Array(n).keys()];
  const f = x => { while (par[x] !== x) x = par[x] = par[par[x]]; return x; };
  let minZ = Infinity, maxZ = -Infinity, minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, degenerados = 0;
  for (let i = 0; i < n; i++) {
    const o = 84 + i * 50 + 12, v = [key(o), key(o + 12), key(o + 24)];
    if (v[0] === v[1] || v[1] === v[2] || v[0] === v[2]) { degenerados++; continue; }
    v.forEach(x => verts.add(x));
    for (let k = 0; k < 3; k++) {
      const a = v[k], b = v[(k + 1) % 3], id = a < b ? a + '|' + b : b + '|' + a;
      const e = edges.get(id) || { n: 0, d: 0, t: i }; e.n++; e.d += a < b ? 1 : -1; edges.set(id, e);
      par[f(i)] = f(e.t);
    }
    for (let k = 0; k < 3; k++) { const q = o + k * 12, x = dv.getFloat32(q, true), y = dv.getFloat32(q + 4, true), z = dv.getFloat32(q + 8, true); minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z); }
  }
  let abiertas = 0, malOrientadas = 0; for (const e of edges.values()) { if (e.n !== 2) abiertas++; else if (e.d !== 0) malOrientadas++; }
  const piezas = new Set(); for (let i = 0; i < n; i++) piezas.add(f(i));
  const F = n - degenerados, genero = (2 - (verts.size - edges.size + F)) / 2;
  const W = maxX - minX, H = maxY - minY, Z = maxZ - minZ;
  if (verbose || abiertas || degenerados) console.log(`${fid.padEnd(8)}${nombre.padEnd(14)}${String(n).padStart(6)} tri · ${W.toFixed(1)} × ${H.toFixed(1)} × ${Z.toFixed(1)} mm · piezas ${piezas.size} · género ${genero} · abiertas ${abiertas} · mal orientadas ${malOrientadas} · degenerados ${degenerados} · cuerpos ${res.cuerpos}`);
  const t = `${modelo} ${fid} ${nombre}: `;
  ok(piezas.size === 1 && res.cuerpos === 1, t + 'una sola pieza conectada');
  ok(abiertas === 0 && degenerados === 0, t + 'cerrado'); ok(malOrientadas === 0, t + 'normales consistentes');
  const esperado = res.generoEsperado ?? (modelo === 'letras' ? 1 + (res.contadores || 0) : 1);
  ok(res.estado === 'NoError' && genero === esperado && res.genero === esperado, t + `género exacto ${esperado} (stl ${genero}, manifold ${res.genero}, contadores de letra ${res.contadores || 0})`);
  ok(res.altoLetraMin >= m.MEDIDAS.minimo - 1e-6, t + `alto de letra ≥ 10 mm (${res.altoLetraMin})`);
  ok(res.resistencia.cuellos, t + 'sin cuellos de menos de 1.2 mm entre letras');
  if (nombre === 'Íñigo') {
    ok(res.componentes >= res.componentesGlifo, t + `acentos distintos (${res.componentes} piezas tras reforzar, ${res.componentesGlifo} en el glifo)`);
    if (res.componentesGlifo > 1) ok(res.separacionAcentos == null || res.separacionAcentos > 0.15, t + `la tilde o el punto no se funde con el cuerpo (hueco ${res.separacionAcentos} mm)`);
  }
  ok(res.volumen > 0, t + 'volumen positivo');
  // legibilidad: cada contrapunzón del glifo original (e, a, o, g, d, p…) sigue abierto en el relieve con ≥ APERTURA_MIN mm de
  // ancho inscrito, y dos letras seguidas que no se tocan en la fuente quedan separadas por ≥ SEPARACION_MIN mm
  const Lg = res.legibilidad, letra = i => [...nombre][i];
  for (const c of Lg.contrapunzones) ok(c.apertura >= m.APERTURA_MIN, t + `contrapunzón de «${letra(c.letra)}» abierto ≥ ${m.APERTURA_MIN} mm (${c.apertura} mm; en la fuente ${c.fuente} mm)`);
  for (const p of Lg.pares) ok(p.hueco >= m.SEPARACION_MIN, t + `«${letra(p.letra)}${letra(p.letra + 1)}» separadas ≥ ${m.SEPARACION_MIN} mm (${p.hueco} mm)`);
  leg.contrapunzones += Lg.contrapunzones.length; leg.pares += Lg.pares.length;
  if (Lg.minApertura != null) leg.minApertura = Math.min(leg.minApertura, Lg.minApertura);
  if (Lg.minHueco != null) leg.minHueco = Math.min(leg.minHueco, Lg.minHueco);
  ok(res.engrosado <= 0.6 && res.perdida < 0.02, `${t}la fuente aguanta 1.2 mm sin recortes (engrosado ${res.engrosado}, recorte ${(res.perdida * 100).toFixed(1)} %)`);
  maxEngr[fid] = Math.max(maxEngr[fid] || 0, res.engrosado);
  const r = res.resistencia; ok(r.trazos, t + 'trazos ≥ 1.2 mm'); ok(r.puentes, t + 'puentes ≥ 1.2 mm'); ok(r.ojal && r.agujero >= 4 && r.pared >= 2, t + 'ojal ≥ 4 mm con pared ≥ 2 mm');
  ok(Math.abs(minZ) < 1e-3, t + 'apoya en z = 0'); ok(Math.abs(Z - res.medidas.grueso) < 0.06 && Math.abs(Z - 4.6) < 1e-3, t + 'grueso 4.6 mm');
  ok(W <= m.MEDIDAS.anchoMax + 0.01 && W >= 12 && H >= 8 && H <= 55, t + 'medidas razonables en mm');
  return { W, H };
}
// 1 a 12 letras: mayúsculas, acentos, ñ, ü, i, j, letras sueltas y casos extremos
const NOMBRES = ['Angel', 'Ángel', 'Nicole', 'Sofía', 'Andrea', 'Ginevra', 'Tommaso', 'Calkiní', 'Begoña', 'Íñigo', 'Iñigo', 'Lluvia', 'Ílce', 'Jazmín', 'Güero', 'Pingüino', 'ÑANDÚ', 'JUJÚ',
  'MARÍA', 'José', 'Jimena', 'Iji', 'jijiji', 'Lili', 'Itzel', 'Ximena', 'Zoé', 'Úrsula', 'Óscar', 'Élmer', 'Raúl', 'Ana', 'Bo', 'Ty',
  'i', 'j', 'l', 't', 'I', 'J', 'L', 'T', 'Ñ', 'ñ', 'ü', 'í', 'É', 'o', 'W', 'lt', 'tl', 'ij', 'ii', 'iiiiiiiiiiii', 'llllllllllll', 'tttttttttttt',
  'Maximilianoo', 'WWWWWWWWWWWW', 'MMMMMMMMMMMM', 'LLLLLLLLLLLL', 'ÑÑÑÑÑÑÑÑÑÑÑÑ', 'ÁÉÍÓÚÜÑáéíóú', 'Guadalupeñaz', 'NICOLE', 'ITZEL', 'ÓSCAR', 'BEGOÑA', 'MÜLLER'];
// los 4 modelos: todos los nombres con la fuente por defecto (Pacifico) y los casos difíciles con las 10 fuentes
// legibilidad (fix/legibilidad-fuentes): los nombres de la hoja y otros con muchas panzas (b d e g o p q)
const DIFICILES = ['Angel', 'Maximiliano', 'Begoña', 'Gabriela', 'Diego', 'Pepe', 'Bob', 'Quique', 'NICOLE', 'ITZEL', 'Calkiní', 'ÓSCAR', 'BEGOÑA', 'MÜLLER', 'Íñigo', 'Iñigo', 'Lluvia', 'Itzel', 'Jazmín', 'ÑANDÚ', 'i', 'j', 'l', 'I', 'J', 'Í', 'Ñ', 'iiiiiiiiiiii', 'WWWWWWWWWWWW', 'MMMMMMMMMMMM', 'LLLLLLLLLLLL', 'Guadalupeñaz'];
let revisados = 0;
for (const modelo of m.MODELOS) for (const fid of FUENTES) for (const s of (fid === 'script' ? NOMBRES : DIFICILES)) {
  ok(m.validarNombre(s).ok, 'nombre de prueba válido ' + s); await revisar(fid, s, fid === 'script' && ['Angel', 'Íñigo', 'i', 'WWWWWWWWWWWW', 'ÑANDÚ'].includes(s), modelo); revisados++;
}
for (const mo of m.MODELOS) for (const fid of FUENTES) {
  const r = await pedir(fid, 'Angel', mo, false);
  ok(r && r.cabe, `«Angel» cabe en ${mo} con ${fid}`);
}
console.log(`no caben a 10 mm (aviso y descarga bloqueada): ${noCaben.length}`, noCaben.filter(x => x.includes('/script/')).join(' '));
console.log('engrosado máximo por fuente (mm)', JSON.stringify(maxEngr));
console.log(`legibilidad: ${leg.contrapunzones} contrapunzones (el más chico ${leg.minApertura} mm, mínimo ${m.APERTURA_MIN}) · ${leg.pares} pares de letras no unidas (hueco más chico ${leg.minHueco} mm, mínimo ${m.SEPARACION_MIN})`);
console.log(`revisados ${revisados} llaveros: ${m.MODELOS.length} modelos × (${NOMBRES.length} nombres con Pacifico + ${DIFICILES.length} difíciles × ${FUENTES.length - 1} fuentes)`);

// avisos específicos y nombres de archivo
const msg = s => m.validarNombre(s).msg;
ok(msg('Maximilianooo').startsWith('Máximo 12 letras. Prueba con tu apodo'), 'aviso de más de 12');
ok(m.validarNombre('JoséMaríaLuz'.normalize('NFD')).ok, '12 letras con acentos combinados no cuentan doble');
for (const s of ['François', 'Weiß', 'Àlex', 'Øyvind']) ok(msg(s) === 'Esa letra no está disponible. Usa letras del español.', 'letra no disponible: ' + s);
for (const s of ['Ana!', 'José❤', '@ana']) ok(msg(s).startsWith('Sin símbolos'), 'símbolo: ' + s);
ok(m.archivoNombre('Angel', 'hueso', 'script') === 'Angel-llavero-huesito-pacifico.stl', 'archivo Marketing: Angel + huesito + pacifico');
ok(m.archivoNombre('Begoña', 'hueso', 'script') === 'Begoña-llavero-huesito-pacifico.stl', 'archivo Marketing: Begoña conserva acento y ñ');
ok(m.archivoNombre('Begoña', 'hueso', 'script') !== m.archivoNombre('Begona', 'hueso', 'script'), 'Begoña y Begona no chocan (regresión PR #3)');
ok(m.archivoNombre('Begon\u0303a', 'letras', 'script') === 'Begoña-llavero-letras-pacifico.stl', 'entrada NFD sale en NFC');
ok(m.archivoNombre('José', 'fondo', 'moderna') === 'José-llavero-con-fondo-lobster-two.stl', 'archivo conserva el acento, con-fondo y lobster-two');
ok(m.archivoNombre('Íñigo', 'cuadros', 'tarde') === 'Íñigo-llavero-cuadritos-merienda.stl', 'archivo cuadritos + merienda, con acentos y ñ');
ok(m.archivoNombre('I', 'letras', 'script') !== m.archivoNombre('i', 'letras', 'script'), 'I e i no chocan');
if (worker) { const w = worker; worker = null; await w.terminate(); }
await vite.close();
console.log(fallas ? `${fallas} fallas` : 'stlqa OK'); process.exit(fallas ? 1 : 0);
