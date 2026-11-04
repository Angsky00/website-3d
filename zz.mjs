import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({viewport:{width:390,height:844},isMobile:true,deviceScaleFactor:2});
await p.goto('http://localhost:4173/'); await p.waitForTimeout(1500);
const y = await p.evaluate(()=>document.querySelector('#carpinteria').getBoundingClientRect().top+scrollY);
await p.evaluate(y=>__lenis.scrollTo(y,{immediate:true}),y); await p.waitForTimeout(2500);
console.log(JSON.stringify(await p.evaluate(()=>__fl())));
await b.close();
