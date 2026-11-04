import { chromium } from 'playwright';
const url = 'http://localhost:4173/';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
for (const [name, vp, mobile] of [['escritorio', { width: 1440, height: 900 }, false], ['celular', { width: 390, height: 844 }, true]]) {
  const p = await b.newPage({ viewport: vp, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
  p.on('pageerror', e => console.log('ERR', e.message));
  p.on('console', m => { if (m.type()==='error') console.log('CONSOLE', m.text()); });
  await p.goto(url, { waitUntil: 'networkidle' }); await p.waitForTimeout(1500);
  const { start, end } = await p.evaluate(() => ({ start: __hero.start, end: __hero.end }));
  for (const [tag, y] of [['1_arriba', 0], ['2_media', start + (end - start) * 0.5], ['3_final', end - 2]]) {
    await p.evaluate(y => { __lenis.scrollTo(y, { immediate: true }); }, y);
    await p.waitForTimeout(2500);
    await p.screenshot({ path: `capturas/${name}_${tag}.png` });
  }
  const extras = name === 'escritorio' ? [['extra_impresion', '#impresion'], ['extra_carpinteria', '#carpinteria'], ['extra_artesanias', '#artesanias'], ['extra_nosotros', '#nosotros'], ['extra_contacto', '#contacto']] : [['extra_carpinteria', '#carpinteria'], ['extra_impresion', '#impresion'], ['extra_impresion_b', '#impresion', 400], ['extra_artesanias', '#artesanias'], ['extra_nosotros', '#nosotros'], ['extra_contacto', '#contacto'], ['extra_contacto_b', '#contacto', 350]];
  for (const [tag, sel, dy = 0] of extras) {
    const y = dy + await p.evaluate(s => document.querySelector(s).getBoundingClientRect().top + scrollY, sel);
    await p.evaluate(y => { __lenis.scrollTo(y, { immediate: true }); }, y); await p.waitForTimeout(2500);
    await p.screenshot({ path: `capturas/${name}_${tag}.png` });
  }
  if (mobile) { await p.evaluate(y => __lenis.scrollTo(y, { immediate: true }), start + (end - start) * 0.797); await p.waitForTimeout(2500); await p.screenshot({ path: 'capturas/celular_extra_capa105.png' }); }
  // pie alcanzable sin saltos
  await p.evaluate(() => __lenis.scrollTo(document.documentElement.scrollHeight, { immediate: true })); await p.waitForTimeout(2000);
  console.log(name, 'pie', await p.evaluate(() => ({ footerBottom: Math.round(document.querySelector('footer').getBoundingClientRect().bottom), vh: innerHeight, y: Math.round(scrollY) })));
  await p.screenshot({ path: `capturas/${name}_pie.png` });
  // menú directo a cada sección
  if (!mobile) for (const h of ['#impresion', '#carpinteria', '#artesanias', '#nosotros', '#contacto']) {
    await p.evaluate(() => __lenis.scrollTo(0, { immediate: true })); await p.waitForTimeout(300);
    await p.click(`.nav a[href="${h}"]`); await p.waitForTimeout(2200);
    console.log('menu', h, 'top', await p.evaluate(h => Math.round(document.querySelector(h).getBoundingClientRect().top), h));
  }
  await p.close();
}
{ const p = await b.newPage({ viewport: { width: 360, height: 780 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  p.on('pageerror', e => console.log('ERR', e.message)); p.on('console', m => { if (m.type()==='error') console.log('CONSOLE', m.text()); });
  await p.goto(url, { waitUntil: 'networkidle' }); await p.waitForTimeout(2500);
  await p.screenshot({ path: 'capturas/celular360_capa0.png' }); await p.close(); }
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, reducedMotion: 'reduce' });
p.on('pageerror', e => console.log('ERR', e.message)); p.on('console', m => { if (m.type()==='error') console.log('CONSOLE', m.text()); });
await p.goto(url, { waitUntil: 'networkidle' }); await p.waitForTimeout(1500);
await p.screenshot({ path: 'capturas/celular_reduced_motion.png' });
for (const sel of ['#nosotros', '#contacto']) { await p.evaluate(s => document.querySelector(s).scrollIntoView(), sel); await p.waitForTimeout(1400); await p.screenshot({ path: `capturas/celular_reduced_${sel.slice(1)}.png` }); }
await b.close();
