// Captura del aviso «no cabe» (Maximilianoo en Cuadritos, 390 px). Uso: node tools/captura-no-cabe.mjs
import { chromium } from 'playwright';
const b = await chromium.launch({ channel: 'chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 390, height: 900 } });
await p.goto('http://127.0.0.1:4178/website-3d/', { waitUntil: 'networkidle' }); await p.addStyleTag({ content: 'header,.nav,nav{visibility:hidden!important}' });
for (let k = 0; k < 2; k++) { await p.evaluate(() => { const y = document.querySelector('#nombre3d').getBoundingClientRect().top + scrollY - 40; window.__lenis ? __lenis.scrollTo(y, { immediate: true, force: true }) : scrollTo(0, y); }); await p.waitForTimeout(700); }
await p.click('.n3d-modelo:has(input[value=cuadros])'); await p.fill('#nombre3d input', 'Maximilianoo');
await p.waitForFunction(() => document.querySelector('#nombre3d .n3d-sugerido'), null, { timeout: 60000 }); await p.waitForTimeout(300);
console.log(await p.evaluate(() => ({ msg: document.querySelector('#n3d-msg').textContent, clase: document.querySelector('#n3d-msg').className, boton: document.querySelector('#nombre3d button[type=submit]').disabled, sugeridos: [...document.querySelectorAll('.n3d-sugerido input')].map(i => i.value) })));
await p.locator('#nombre3d').screenshot({ path: '/workspace/camino_digital_qa/llavero/m/no-cabe-390.png' });
await b.close();
