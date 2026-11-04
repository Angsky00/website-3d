// QA: ningún objeto flotante tapa los textos del despiece (.dcol li/h2/…) durante el pin, a 390 y 1280
import { chromium } from 'playwright';
const url = process.env.QA_URL || 'http://localhost:4173/website-3d/';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
let fails = 0;
for (const [w, h, mob] of [[390, 844, true], [1280, 800, false]]) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: mob ? 2 : 1, isMobile: mob, hasTouch: mob });
  await p.goto(url, { waitUntil: 'networkidle' }); await p.waitForTimeout(2500);
  const [s, e] = await p.evaluate(() => [__despiece.start, __despiece.end]);
  // recorre antes, durante y justo después del pin (incluye el final, donde QA lo vio)
  for (let k = -2; k <= 12; k++) {
    const y = s + (e - s) * k / 10; await p.evaluate(y => __lenis.scrollTo(y, { immediate: true, force: true }), y); await p.waitForTimeout(1500); // estado estable tras el salto instantáneo
    const hits = await p.evaluate(() => { const items = [...document.querySelectorAll('.dcol .ri, .dcol h2, .dcol li')].map(el => [el, el.getBoundingClientRect()]).filter(([el, r]) => r.width && r.bottom > 0 && r.top < innerHeight && +getComputedStyle(el).opacity > 0.1);
      const fl = __floaters.debugRects(); const out = [];
      for (const c of fl) for (const [el, r] of items) if (c.x + c.rad > r.left && c.x - c.rad < r.right && c.y + c.rad > r.top && c.y - c.rad < r.bottom) out.push([el.textContent.slice(0, 20), c]);
      return out; });
    if (hits.length) { fails++; console.log(w, 'paso', k, 'FALLA', JSON.stringify(hits)); }
  }
  console.log(w, 'revisado'); await p.close();
}
await b.close(); console.log(fails ? `flotantes sobre texto: ${fails} FALLA` : 'flotantes sin tapar texto OK'); if (fails) process.exit(1);
