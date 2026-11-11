// Tabla de diagnóstico (fuente × modelo) a partir de los JSON de tools/legibilidad.mjs (antes = main, después = rama).
// Uso: node tools/legibilidad-md.mjs antes.json despues.json > capturas/llavero/legibilidad-diagnostico.md
import { readFileSync } from 'node:fs';
const [, , fa, fd] = process.argv;
const antes = JSON.parse(readFileSync(fa, 'utf8')), despues = JSON.parse(readFileSync(fd, 'utf8'));
const MODELOS = [['letras', 'Solo letras'], ['fondo', 'Con fondo'], ['hueso', 'Huesito'], ['cuadros', 'Cuadritos']];
const familias = [...new Map(despues.map(r => [r.estilo, r.familia])).entries()];
const nombres = [...new Set(despues.map(r => r.nombre))];
const ini = n => n[0];
function resumen(rs) {
  const ok = rs.filter(r => r.cabe), noc = rs.filter(r => !r.cabe).map(r => r.nombre);
  if (!ok.length) return { engr: '—', cap: '—', apertura: '—', cerradas: '', hueco: '—', fundidas: '', noc };
  const engr = Math.max(...ok.map(r => r.engrosado)), caps = ok.map(r => `${ini(r.nombre)} ${r.mayuscula}`).join(', ');
  const ap = ok.flatMap(r => r.legibilidad.contrapunzones.map(c => ({ ...c, r })));
  const pa = ok.flatMap(r => r.legibilidad.pares.map(c => ({ ...c, r })));
  const min = ap.length ? Math.min(...ap.map(c => c.apertura)) : null, minH = pa.length ? Math.min(...pa.map(c => c.hueco)) : null;
  const cerradas = [...new Set(ap.filter(c => c.apertura < 1).map(c => [...c.r.nombre][c.letra]))].join(' ');
  const fundidas = [...new Set(pa.filter(c => c.hueco < 0.6).map(c => { const n = [...c.r.nombre]; return n[c.letra] + n[c.letra + 1]; }))].join(' ');
  return { engr, cap: caps, apertura: min == null ? '—' : min.toFixed(2), cerradas, hueco: minH == null ? '—' : minH.toFixed(2), fundidas, noc };
}
const out = [];
out.push('# Legibilidad del llavero por fuente y modelo', '');
out.push(`Nombres: ${nombres.map(n => '«' + n + '»').join(', ')}. Antes = main \`cfc5f36\`; después = rama \`fix/legibilidad-fuentes\`. Medido sobre la huella 2D real del STL (relieve de las letras) con \`tools/legibilidad.mjs\`.`, '');
out.push('- **Engrosado**: el mayor que aplicó `reforzar` en los 3 nombres (mm por lado).');
out.push('- **Panza mín.**: el ancho inscrito más chico de los contrapunzones del glifo original (e, a, o, g, d, p, A, B…) ya en el relieve; 0 = se cerró. Se exige ≥ 1 mm. Entre paréntesis, las letras que quedaban cerradas o de menos de 1 mm.');
out.push('- **Hueco mín.**: la separación más chica entre dos letras seguidas que no van unidas en la fuente; se exige ≥ 0.6 mm. Entre paréntesis, los pares fundidos o pegados. En Cuadritos cada letra va en su cuadro y no aplica.');
out.push('- **Mayúscula**: alto de mayúscula final en mm por nombre (A = Angel, M = Maximiliano, B = Begoña); «no cabe» = el nombre no entra en 150 mm con letras legibles y la página lo avisa.', '');
out.push('| Fuente | Modelo | Engrosado antes → después | Panza mín. antes → después (mm) | Hueco mín. antes → después (mm) | Mayúscula después (mm) |');
out.push('|---|---|---|---|---|---|');
let malA = 0, malD = 0, tot = 0;
for (const [id, fam] of familias) for (const [mo, tm] of MODELOS) {
  const a = resumen(antes.filter(r => r.estilo === id && r.modelo === mo)), d = resumen(despues.filter(r => r.estilo === id && r.modelo === mo));
  const fmt = (v, x) => `${v}${x ? ` (${x})` : ''}`;
  const noc = d.noc.length ? `; no cabe: ${d.noc.join(', ')}` : '';
  out.push(`| ${fam} | ${tm} | ${a.engr} → ${d.engr} | ${fmt(a.apertura, a.cerradas)} → **${fmt(d.apertura, d.cerradas)}** | ${fmt(a.hueco, a.fundidas)} → **${fmt(d.hueco, d.fundidas)}** | ${d.cap}${noc} |`);
}
for (const [arr, k] of [[antes, 'a'], [despues, 'd']]) for (const r of arr) if (r.cabe) {
  const L = r.legibilidad, mal = L.contrapunzones.some(c => c.apertura < 1) || L.pares.some(c => c.hueco < 0.6);
  if (k === 'a') { tot++; malA += mal; } else malD += mal;
}
out.push('', `Llaveros ilegibles (alguna panza < 1 mm o letras fundidas): **antes ${malA} de ${tot}**, **después ${malD} de ${despues.filter(r => r.cabe).length}**.`);
console.log(out.join('\n'));
