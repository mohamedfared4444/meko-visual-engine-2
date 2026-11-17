import {createServer} from 'vite';
import puppeteer from 'puppeteer-core';
const server = await createServer({root: process.cwd(), server: {port: 9124, strictPort: true}, logLevel: 'error'});
await server.listen();
const browser = await puppeteer.launch({executablePath: '/home/z/.cache/puppeteer/chrome/linux-157.0.8103.50/chrome-linux64/chrome', headless: true, args: ['--no-sandbox','--disable-dev-shm-usage']});
const page = await browser.newPage();
page.on('requestfailed', r => console.log('FAILED:', r.url()));
page.on('response', r => { if (r.status() >= 400) console.log('HTTP', r.status(), r.url()); });
await page.goto('http://localhost:9124/render.html', {waitUntil: 'networkidle2', timeout: 30000}).catch(e => console.log('goto:', e.message));
await page.evaluate(() => document.fonts.load('800 60px "Baloo 2"').catch(()=>{}));
await new Promise(r => setTimeout(r, 3000));
const probe = await page.evaluate(async () => {
  const loaded = [...document.fonts].map(f => `${f.family} ${f.weight} ${f.status}`);
  const checks = {
    baloo800: document.fonts.check('800 60px "Baloo 2"'),
    nunito900: document.fonts.check('900 40px "Nunito"'),
  };
  return {loaded, checks};
});
console.log(JSON.stringify(probe, null, 1));
await browser.close();
server.close().catch(()=>{});
process.exit(0);
