import { chromium } from 'playwright';
const url = 'http://localhost:4173/';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
const go = (p, y) => p.evaluate(y => __lenis.scrollTo(y, { immediate: true, force: true }), y);
const ids = ['impresion', 'carpinteria', 'artesanias', 'nosotros', 'contacto'];
for (const [name, vp, mobile] of [['escritorio', { width: 1440, height: 900 }, false], ['celular', { width: 390, height: 844 }, true]]) {
  const p = await b.newPage({ viewport: vp, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
  p.on('pageerror', e => console.log('ERR', e.message)); p.on('console', m => { if (m.type()==='error') console.log('CONSOLE', m.text()); });
  await p.goto(url, { waitUntil: 'networkidle' }); await p.waitForTimeout(2500);
  const { start, end } = await p.evaluate(() => ({ start: __hero.start, end: __hero.end }));
  const pins = await p.evaluate(() => Object.fromEntries(Object.entries(__pins).map(([k, s]) => [k, [s.start, s.end]])));
  for (const [tag, y] of [['1_arriba', 0], ['2_media', start + (end - start) * 0.5], ['3_final', end - 2]]) { await go(p, y); await p.waitForTimeout(2200); await p.screenshot({ path: `capturas/${name}_${tag}.png` }); }
  for (const [id, f] of [['impresion', 0.3], ['nosotros', 0.35]]) { const [s, e] = pins[id]; await go(p, s + (e - s) * f); await p.waitForTimeout(1500); await p.screenshot({ path: `capturas/${name}_acercamiento_${id}.png` }); }
  for (const id of ids) { await go(p, pins[id][1] + 5); await p.waitForTimeout(1800); await p.screenshot({ path: `capturas/${name}_fondo_${id}.png` }); }
  if (mobile) { await go(p, pins.contacto[1] + 400); await p.waitForTimeout(1500); await p.screenshot({ path: `capturas/${name}_fondo_contacto_b.png` }); }
  const cloneAbs = await p.evaluate(() => document.querySelector('.hero-clone').getBoundingClientRect().top + scrollY);
  await go(p, cloneAbs - vp.height); await p.waitForTimeout(1800); await p.screenshot({ path: `capturas/${name}_pie.png` });
  console.log(name, 'pie', await p.evaluate(() => ({ footerBottom: Math.round(document.querySelector('footer').getBoundingClientRect().bottom), y: Math.round(scrollY) })));
  // foco en el formulario: no debe saltar
  await p.focus('input[name=nombre]'); await go(p, cloneAbs); await p.waitForTimeout(800);
  console.log(name, 'con foco en form, scrollY', await p.evaluate(() => Math.round(scrollY)), 'clon', Math.round(cloneAbs));
  await p.evaluate(() => document.activeElement.blur()); await p.waitForTimeout(400);
  console.log(name, 'tras blur, scrollY', await p.evaluate(() => Math.round(scrollY)));
  await go(p, cloneAbs - vp.height); await p.waitForTimeout(600);
  // bajar con rueda/arrastre más allá del pie → loop
  if (!mobile) for (let i = 0; i < 30; i++) { await p.mouse.wheel(0, 120); await p.waitForTimeout(100); if (await p.evaluate(() => scrollY < 300)) break; } else { await go(p, cloneAbs); for (let i = 0; i < 20 && await p.evaluate(() => scrollY > 300); i++) await p.waitForTimeout(50); }
  await p.waitForTimeout(400); await p.screenshot({ path: `capturas/${name}_justo_tras_loop.png` });
  console.log(name, 'tras loop, scrollY', await p.evaluate(() => Math.round(scrollY)), 'capa', await p.evaluate(() => document.querySelector('#capa').textContent));
  if (!mobile) for (const id of ids) { await go(p, 0); await p.waitForTimeout(300); await p.click(`.nav a[href="#${id}"]`); await p.waitForTimeout(1500); await p.waitForFunction(() => !__lenis.isScrolling, null, { timeout: 15000 }); await p.waitForTimeout(600);
    console.log('menu', id, await p.evaluate(id => ({ y: Math.round(scrollY), pinEnd: Math.round(__pins[id].end) }), id)); }
  await p.close();
}
{ const p = await b.newPage({ viewport: { width: 360, height: 780 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  p.on('pageerror', e => console.log('ERR', e.message)); p.on('console', m => { if (m.type()==='error') console.log('CONSOLE', m.text()); });
  await p.goto(url, { waitUntil: 'networkidle' }); await p.waitForTimeout(2500); await p.screenshot({ path: 'capturas/celular360_capa0.png' }); await p.close(); }
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, reducedMotion: 'reduce' });
p.on('pageerror', e => console.log('ERR', e.message)); p.on('console', m => { if (m.type()==='error') console.log('CONSOLE', m.text()); });
await p.goto(url, { waitUntil: 'networkidle' }); await p.waitForTimeout(1500);
await p.screenshot({ path: 'capturas/celular_reduced_motion.png' });
for (const sel of ['#impresion', '#nosotros', '#contacto']) { await p.evaluate(s => document.querySelector(s).scrollIntoView(), sel); await p.waitForTimeout(1400); await p.screenshot({ path: `capturas/celular_reduced_${sel.slice(1)}.png` }); }
await p.evaluate(() => scrollTo(0, 1e6)); await p.waitForTimeout(800);
console.log('reduced fondo: clon?', await p.evaluate(() => !!document.querySelector('.hero-clone')), 'scrollY', await p.evaluate(() => Math.round(scrollY)));
await b.close();
