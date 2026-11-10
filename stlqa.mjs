// QA del llavero «Tu nombre en 3D»: validación, fuentes y licencias, y STL binario de una sola pieza cerrada con ojal, en mm.
import { createServer } from 'vite';
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
const m = await vite.ssrLoadModule('/src/nombre3d.js');
let fallas = 0; const ok = (c, t) => { if (!c) { fallas++; console.log('FALLA', t); } };
for (const s of ['Ana', 'José', 'Begoña', 'MARÍA', 'Güero', 'Xochitl', 'Maximilianoo']) ok(m.validarNombre(s).ok, 'acepta ' + s);
for (const s of ['', '  ', 'Ana2', 'R2D2', 'Ana!', 'Jo-sé', 'Ana María', 'José❤', '<b>', 'Maximilianooo', "O'Neil", '@ana', 'ana.']) ok(!m.validarNombre(s).ok, 'rechaza ' + JSON.stringify(s));
ok(m.validarNombre('Jose\u0301').ok && m.validarNombre('Jose\u0301').nombre === 'José', 'normaliza acento combinado');

import { readFileSync } from 'node:fs';
const w = await m.cargarManifold();
const FUENTES = ['script', 'redonda', 'suave'];
const fuentes = Object.fromEntries(FUENTES.map(id => [id, JSON.parse(readFileSync(`src/fuentes-llavero/${id}.json`, 'utf8'))]));
const ALFABETO = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÁÉÍÓÚÜÑáéíóúüñ'];
for (const id of FUENTES) {
  const f = fuentes[id], falta = ALFABETO.filter(ch => !f.glyphs[ch]);
  ok(!falta.length, id + ': tiene todas las letras permitidas ' + falta.join(''));
  ok(f.copyright && /Open Font License/.test(f.licencia) && readFileSync(`public/licencias/llavero-${id}-OFL.txt`, 'utf8').includes('SIL OPEN FONT LICENSE'), id + ': créditos y OFL');
}

// STL binario → cerrado (cada arista no dirigida exactamente en 2 caras, sentidos opuestos), UNA sola pieza conectada
// por aristas (no basta tocarse en un vértice), apoyada en z = 0, con el agujero del ojal (género ≥ 1) y medidas en mm
function revisar(fid, nombre, verbose) {
  const mod = m.construirLlavero(w, fuentes[fid], nombre);
  const dv = m.exportarSTL(mod), n = dv.getUint32(80, true);
  ok(dv.byteLength === 84 + n * 50, `${fid} ${nombre}: tamaño binario coherente`);
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
  if (verbose || abiertas || degenerados) console.log(`${fid.padEnd(8)}${nombre.padEnd(14)}${String(n).padStart(6)} tri · ${W.toFixed(1)} × ${H.toFixed(1)} × ${Z.toFixed(1)} mm · piezas ${piezas.size} · género ${genero} · abiertas ${abiertas} · mal orientadas ${malOrientadas} · degenerados ${degenerados} · cuerpos ${mod.cuerpos}`);
  const t = `${fid} ${nombre}: `;
  ok(piezas.size === 1 && mod.cuerpos === 1, t + 'una sola pieza conectada');
  ok(abiertas === 0 && degenerados === 0, t + 'cerrado'); ok(malOrientadas === 0, t + 'normales consistentes');
  ok(mod.estado === 'NoError' && genero >= 1, t + 'sólido válido con ojal');
  ok(mod.volumen > 0, t + 'volumen positivo');
  const r = mod.resistencia; ok(r.trazos, t + 'trazos ≥ 1.2 mm'); ok(r.puentes, t + 'puentes ≥ 1.2 mm'); ok(r.ojal && r.agujero >= 4 && r.pared >= 2, t + 'ojal ≥ 4 mm con pared ≥ 2 mm');
  ok(Math.abs(minZ) < 1e-3, t + 'apoya en z = 0'); ok(Math.abs(Z - mod.medidas.grueso) < 0.06 && Math.abs(Z - 4.6) < 1e-3, t + 'grueso 4.6 mm');
  ok(W <= m.MEDIDAS.anchoMax + 0.01 && W >= 12 && H >= 10 && H <= 45, t + 'medidas razonables en mm');
  return { W, H };
}
// 1 a 12 letras: mayúsculas, acentos, ñ, ü, i, j, letras sueltas y casos extremos
const NOMBRES = ['Angel', 'Ángel', 'Nicole', 'Sofía', 'Andrea', 'Ginevra', 'Tommaso', 'Calkiní', 'Begoña', 'Íñigo', 'Iñigo', 'Lluvia', 'Ílce', 'Jazmín', 'Güero', 'Pingüino', 'ÑANDÚ', 'JUJÚ',
  'MARÍA', 'José', 'Jimena', 'Iji', 'jijiji', 'Lili', 'Itzel', 'Ximena', 'Zoé', 'Úrsula', 'Óscar', 'Élmer', 'Raúl', 'Ana', 'Bo', 'Ty',
  'i', 'j', 'l', 't', 'I', 'J', 'L', 'T', 'Ñ', 'ñ', 'ü', 'í', 'É', 'o', 'W', 'lt', 'tl', 'ij', 'ii', 'iiiiiiiiiiii', 'llllllllllll', 'tttttttttttt',
  'Maximilianoo', 'WWWWWWWWWWWW', 'MMMMMMMMMMMM', 'ÑÑÑÑÑÑÑÑÑÑÑÑ', 'ÁÉÍÓÚÜÑáéíóú', 'Guadalupeñaz'];
for (const fid of FUENTES) for (const s of NOMBRES) { ok(m.validarNombre(s).ok, 'nombre de prueba válido ' + s); revisar(fid, s, ['Angel', 'Íñigo', 'i', 'WWWWWWWWWWWW', 'ÑANDÚ'].includes(s)); }
console.log(`revisados ${FUENTES.length * NOMBRES.length} llaveros (${NOMBRES.length} nombres × ${FUENTES.length} fuentes)`);

// avisos específicos y nombres de archivo
const msg = s => m.validarNombre(s).msg;
ok(msg('Maximilianooo').startsWith('Máximo 12 letras. Prueba con tu apodo'), 'aviso de más de 12');
ok(m.validarNombre('JoséMaríaLuz'.normalize('NFD')).ok, '12 letras con acentos combinados no cuentan doble');
for (const s of ['François', 'Weiß', 'Àlex', 'Øyvind']) ok(msg(s) === 'Esa letra no está disponible. Usa letras del español.', 'letra no disponible: ' + s);
for (const s of ['Ana!', 'José❤', '@ana']) ok(msg(s).startsWith('Sin símbolos'), 'símbolo: ' + s);
const arch = ['I', 'i', 'Ñ', 'ñ', 'N', 'n', 'José', 'Jose'].map(m.archivoNombre);
ok(new Set(arch).size === arch.length, 'nombres de archivo distintos: ' + arch.join(' '));
ok(m.archivoNombre('Begon\u0303a') === 'camino-digital-Begoña.stl', 'archivo en NFC');
await vite.close();
console.log(fallas ? `${fallas} fallas` : 'stlqa OK'); process.exit(fallas ? 1 : 0);
