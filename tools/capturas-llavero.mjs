// Capturas del llavero (vite preview en :4178). Uso: node tools/capturas-llavero.mjs <salida> <ancho> [todas]
import { chromium } from 'playwright';
const [, , salida, ancho, todas] = process.argv;
const b = await chromium.launch({ channel: 'chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: +ancho, height: 900 } });
const errores = []; p.on('pageerror', e => errores.push(e.message)); p.on('console', m => m.type() === 'error' && errores.push(m.text()));
await p.addInitScript(() => { window.__lt = []; new PerformanceObserver(l => l.getEntries().forEach(e => window.__lt.push(e.duration))).observe({ type: 'longtask', buffered: true }); });
await p.goto('http://127.0.0.1:4178/website-3d/', { waitUntil: 'networkidle' }); await p.addStyleTag({ content: 'header,.nav,nav{visibility:hidden!important}' });
for (let k = 0; k < 2; k++) { await p.evaluate(() => { const y = document.querySelector('#nombre3d').getBoundingClientRect().top + scrollY - 40; window.__lenis ? __lenis.scrollTo(y, { immediate: true, force: true }) : scrollTo(0, y); }); await p.waitForTimeout(700); }
const esperar = async () => { await p.waitForTimeout(150); await p.waitForFunction(() => !document.querySelector('#nombre3d button[type=submit]').disabled && !document.querySelector('#nombre3d').classList.contains('n3d-cargando'), null, { timeout: 30000 }); await p.waitForTimeout(450); };
await p.fill('#nombre3d input', 'Angel'); await esperar();
const def = await p.evaluate(() => [document.querySelector('input[name=modelo]:checked').value, document.querySelector('input[name=estilo]:checked').value]);
console.log('por defecto', def);
const modelos = ['letras', 'fondo', 'hueso', 'cuadros'];
const estilos = todas ? await p.$$eval('input[name=estilo]', xs => xs.map(x => x.value)) : ['script'];
for (const e of estilos) {
  await p.click(`.n3d-estilo:has(input[value=${e}])`); await esperar();
  for (const mo of modelos) {
    await p.click(`.n3d-modelo:has(input[value=${mo}])`); await esperar();
    const med = await p.textContent('#nombre3d .n3d-medidas');
    if (todas) await p.locator('#nombre3d canvas').screenshot({ path: `${salida}/c-${mo}-${e}.png` });
    else await p.locator('#nombre3d').screenshot({ path: `${salida}/modelo-${mo}-${ancho}.png` });
    console.log(ancho, e, mo, med);
  }
}
await p.click('.n3d-modelo:has(input[value=letras])'); await p.click('.n3d-estilo:has(input[value=script])'); await esperar();
await p.evaluate(() => { window.__lt = []; });
await p.fill('#nombre3d input', 'Maximilianoo'); await esperar();
console.log('tarea larga máx (ms) al generar Maximilianoo', Math.max(0, ...await p.evaluate(() => window.__lt)).toFixed(0));
const scrollW = await p.evaluate(() => document.documentElement.scrollWidth); console.log('scrollWidth', scrollW);
console.log('errores', errores);
await b.close();
