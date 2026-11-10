// QA del generador de nombres: validación, STL binario válido, cuerpos cerrados (cada arista en 2 caras) y medidas en mm.
import { createServer } from 'vite';
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
const m = await vite.ssrLoadModule('/src/nombre3d.js');
let fallas = 0; const ok = (c, t) => { if (!c) { fallas++; console.log('FALLA', t); } };
for (const s of ['Ana', 'José', 'Begoña', 'MARÍA', 'Güero', 'Xochitl', 'Maximilianoo']) ok(m.validarNombre(s).ok, 'acepta ' + s);
for (const s of ['', '  ', 'Ana2', 'R2D2', 'Ana!', 'Jo-sé', 'Ana María', 'José❤', '<b>', 'Maximilianooo', "O'Neil", '@ana', 'ana.']) ok(!m.validarNombre(s).ok, 'rechaza ' + JSON.stringify(s));
ok(m.validarNombre('Jose\u0301').ok && m.validarNombre('Jose\u0301').nombre === 'José', 'normaliza acento combinado');

function revisar(nombre) {
  const mod = m.construirModelo(nombre);
  const dv = m.exportarSTL(mod), n = dv.getUint32(80, true);
  ok(dv.byteLength === 84 + n * 50, nombre + ': tamaño binario coherente');
  // aristas: cada cuerpo cerrado ⇒ toda arista no dirigida aparece exactamente 2 veces (con sentidos opuestos)
  const key = (o) => [dv.getFloat32(o, true), dv.getFloat32(o + 4, true), dv.getFloat32(o + 8, true)].map(v => Math.round(v * 1e4)).join(',');
  const edges = new Map(); let minZ = Infinity, maxZ = -Infinity, minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, degenerados = 0;
  for (let i = 0; i < n; i++) {
    const o = 84 + i * 50 + 12, v = [key(o), key(o + 12), key(o + 24)];
    if (v[0] === v[1] || v[1] === v[2] || v[0] === v[2]) { degenerados++; continue; }
    for (let k = 0; k < 3; k++) { const a = v[k], b = v[(k + 1) % 3]; const id = a < b ? a + '|' + b : b + '|' + a; const e = edges.get(id) || { n: 0, d: 0 }; e.n++; e.d += a < b ? 1 : -1; edges.set(id, e); }
    for (let k = 0; k < 3; k++) { const p = o + k * 12, x = dv.getFloat32(p, true), y = dv.getFloat32(p + 4, true), z = dv.getFloat32(p + 8, true); minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z); }
  }
  let abiertas = 0, malOrientadas = 0; for (const e of edges.values()) { if (e.n % 2) abiertas++; else if (e.d !== 0) malOrientadas++; }
  const W = maxX - minX, H = maxY - minY, Z = maxZ - minZ;
  console.log(nombre.padEnd(14), `${n} triángulos · ${W.toFixed(1)} × ${H.toFixed(1)} × ${Z.toFixed(1)} mm · aristas abiertas ${abiertas} · mal orientadas ${malOrientadas} · degenerados ${degenerados}`);
  ok(abiertas === 0, nombre + ': cerrado'); ok(malOrientadas === 0, nombre + ': normales consistentes');
  ok(Math.abs(minZ) < 1e-3, nombre + ': apoya en z = 0'); ok(Math.abs(Z - mod.medidas.grueso) < 0.05, nombre + ': grueso en mm');
  ok(W <= 180.01 && W >= 30 && H >= 15 && H <= 40, nombre + ': medidas razonables en mm');
}
for (const s of ['Ana', 'José', 'Begoña', 'MARÍA', 'Güero', 'Ñ', 'i', 'Maximilianoo', 'WWWWWWWWWWWW']) revisar(s);

// tildes, diéresis y virgulilla: cada pieza suelta de las letras debe apoyarse en la placa (hundida en ella) y caer dentro de su contorno
function piezas(nombre) {
  const mod = m.construirModelo(nombre), g = mod.texto.index ? mod.texto.toNonIndexed() : mod.texto, p = g.attributes.position, par = [];
  const id = new Map(), k = i => [p.getX(i), p.getY(i), p.getZ(i)].map(v => Math.round(v * 1e4)).join(',');
  const f = x => { while (par[x] !== x) x = par[x] = par[par[x]]; return x; };
  const v = i => { const s = k(i); if (!id.has(s)) { id.set(s, par.length); par.push(par.length); } return id.get(s); };
  for (let i = 0; i < p.count; i += 3) { const a = f(v(i)), b = f(v(i + 1)), c = f(v(i + 2)); par[b] = a; par[f(c)] = a; }
  const comp = new Map(); for (let i = 0; i < p.count; i++) { const r = f(id.get(k(i))); const c = comp.get(r) || { z: Infinity, x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity }; c.z = Math.min(c.z, p.getZ(i)); c.x0 = Math.min(c.x0, p.getX(i)); c.x1 = Math.max(c.x1, p.getX(i)); c.y0 = Math.min(c.y0, p.getY(i)); c.y1 = Math.max(c.y1, p.getY(i)); comp.set(r, c); }
  mod.base.computeBoundingBox(); const B = mod.base.boundingBox;
  let sueltas = 0; for (const c of comp.values()) if (!(c.z < B.max.z - 0.1 && c.x0 > B.min.x && c.x1 < B.max.x && c.y0 > B.min.y && c.y1 < B.max.y)) sueltas++;
  console.log(nombre.padEnd(14), `${comp.size} piezas de letra · sin apoyo en la placa ${sueltas}`);
  ok(sueltas === 0, nombre + ': tildes y ñ unidas a la placa');
}
for (const s of ['Begoña', 'ÑANDÚ', 'Güero', 'José', 'Íñigo']) piezas(s);
await vite.close();
console.log(fallas ? `${fallas} fallas` : 'stlqa OK'); process.exit(fallas ? 1 : 0);
