// Hoja antes/después de legibilidad: vista superior de la huella real del STL (base en terracota, relieve de las letras en
// arena con borde oscuro), a escala fija en px/mm, para «Angel», «Maximiliano» y «Begoña» en las 10 fuentes × 4 modelos.
// Debajo de cada llavero: engrosado, contrapunzón más chico y hueco más chico entre letras (en rojo si no pasa).
// Uso: node tools/legibilidad.mjs antes.json (en main) · node tools/legibilidad.mjs despues.json (en la rama) ·
//      node tools/hoja-legibilidad.mjs antes.json despues.json capturas/llavero
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const [, , fa, fd, dir] = process.argv;
const antes = JSON.parse(readFileSync(fa, 'utf8')), despues = JSON.parse(readFileSync(fd, 'utf8'));
const MODELOS = [['letras', 'Solo letras'], ['fondo', 'Con fondo'], ['hueso', 'Huesito'], ['cuadros', 'Cuadritos']];
const familias = [...new Map(despues.map(r => [r.estilo, r.familia])).entries()];
const nombres = [...new Set(despues.map(r => r.nombre))];
const APERTURA = 1, HUECO = 0.6;
const path = polys => polys.map(p => 'M' + p.map(([x, y]) => `${x},${-y}`).join('L') + 'Z').join('');
function celda(r, px, W, H) {
  if (!r || !r.cabe) return `<div class="c no" style="width:${W}px;height:${H}px"><span>No cabe a 10 mm${r ? ` (${r.medidas.ancho} mm)` : ''}:<br>se avisa y se bloquea la descarga</span></div>`;
  const L = r.legibilidad, d = r.dibujo;
  const malC = L.contrapunzones.filter(c => c.apertura < APERTURA), malP = L.pares.filter(c => c.hueco < HUECO);
  const ok = !malC.length && !malP.length;
  const vb = `${-W / 2 / px} ${-(H - 34) / 2 / px} ${W / px} ${(H - 34) / px}`;
  const n = [...r.nombre];
  const det = [
    `engr. ${r.engrosado} mm · ${r.mayuscula} mm · ${r.medidas.ancho}×${r.medidas.alto}`,
    `panza mín <b class="${malC.length ? 'm' : ''}">${L.minApertura ?? '—'}</b>${malC.length ? ' cerradas: ' + [...new Set(malC.map(c => n[c.letra]))].join(' ') : ''} · hueco mín <b class="${malP.length ? 'm' : ''}">${L.minHueco ?? '—'}</b>${malP.length ? ' fundidas: ' + malP.map(c => n[c.letra] + n[c.letra + 1]).join(' ') : ''}`,
  ];
  return `<div class="c ${ok ? 'ok' : 'mal'}" style="width:${W}px;height:${H}px"><svg width="${W}" height="${H - 34}" viewBox="${vb}">
<path d="${path(d.base)}" fill="#B2442E" fill-rule="nonzero"/><path d="${path(d.relieve)}" fill="#EFE3CC" stroke="#3a2416" stroke-width="${0.9 / px}" fill-rule="nonzero"/></svg>
<div class="d">${det.join('<br>')}</div></div>`;
}
async function hoja(lista, px, archivo, titulo) {
  // cada hoja a la escala más grande que deja el llavero más ancho en ~470 px (máximo 7 px/mm)
  const todos = [...antes, ...despues].filter(r => lista.includes(r.nombre) && r.cabe);
  const maxW = Math.max(...todos.map(r => r.medidas.ancho)), maxH = Math.max(...todos.map(r => r.medidas.alto));
  px = px || Math.min(7, Math.floor(470 / maxW * 10) / 10);
  const W = Math.round((maxW + 4) * px) + 8, H = Math.round((maxH + 4) * px) + 34;
  let html = `<html><head><style>body{margin:0;background:#f6efe4;font:12px system-ui,sans-serif;color:#2b211b}
h1{font-size:20px;margin:10px 14px 2px} p.s{margin:0 14px 8px;color:#6b5a4c}
table{border-collapse:separate;border-spacing:4px;margin:0 8px 14px} th{font-weight:600;padding:2px 4px} th.f{text-align:right;white-space:nowrap}
.c{position:relative;background:#fffaf2;border:2px solid #ddd;border-radius:6px;overflow:hidden}.c.ok{border-color:#7fb27f}.c.mal{border-color:#d0463b}
.c.no{display:flex;align-items:center;justify-content:center;color:#8a7a6c;text-align:center;border-style:dashed}
.d{position:absolute;bottom:2px;left:6px;right:4px;font-size:10.5px;line-height:1.25;color:#4b3c31}.d b.m{color:#c0291c}
.g{background:#efe5d6}</style></head><body>`;
  for (const nombre of lista) {
    html += `<h1>${titulo} «${nombre}»</h1><p class="s">Vista superior de la geometría real del STL a ${px} px/mm (terracota = base, arena = relieve de las letras). Verde: todas las panzas abiertas ≥ ${APERTURA} mm y letras no unidas por diseño separadas ≥ ${HUECO} mm. Rojo: no pasa. Antes = main cfc5f36.</p><table><tr><th></th>`;
    for (const [, t] of MODELOS) html += `<th colspan="2">${t}</th>`;
    html += '</tr><tr><th></th>' + MODELOS.map(() => '<th>Antes</th><th class="g">Después</th>').join('') + '</tr>';
    for (const [id, fam] of familias) {
      html += `<tr><th class="f">${fam}</th>`;
      for (const [mo] of MODELOS) {
        const a = antes.find(r => r.nombre === nombre && r.estilo === id && r.modelo === mo), b = despues.find(r => r.nombre === nombre && r.estilo === id && r.modelo === mo);
        html += `<td>${celda(a, px, W, H)}</td><td class="g">${celda(b, px, W, H)}</td>`;
      }
      html += '</tr>';
    }
    html += '</table>';
  }
  html += '</body></html>';
  const b = await chromium.launch({ channel: 'chrome' });
  const p = await b.newPage({ viewport: { width: 400, height: 400 } });
  await p.setContent(html);
  const sz = await p.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.scrollHeight]);
  await p.setViewportSize({ width: sz[0], height: Math.min(sz[1], 16000) });
  await p.screenshot({ path: archivo, fullPage: true });
  await b.close();
  console.log(archivo, sz.join('×'));
}
for (const n of nombres) await hoja([n], 0, `${dir}/legibilidad-${n}.png`, 'Legibilidad antes / después:');
await hoja(nombres, 2, `${dir}/legibilidad-antes-despues.png`, 'Legibilidad antes / después:');
