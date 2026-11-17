/**
 * Headless render driver for the Meko Visual Engine 2 prototype.
 *
 * 1. Starts the vite dev server (Motion Canvas plugin).
 * 2. Opens render.html in headless Chrome and waits for the frame export.
 * 3. Assembles the exported JPEG frames into an MP4 with FFmpeg.
 * 4. Samples peak memory of the Chrome + FFmpeg processes.
 *
 * Usage: node scripts/render.mjs [output.mp4]
 * Env:   CHROME_PATH (default: puppeteer cache chrome), FPS=30
 */
import {createServer} from 'vite';
import puppeteer from 'puppeteer-core';
import {spawn as procSpawn} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const FPS = Number(process.env.FPS ?? 30);
const PORT = 9123;
const FRAMES_DIR = path.resolve('output/chocolate-preview');
const MP4 = path.resolve(process.argv[2] ?? 'output/meko-visual-engine-2-preview.mp4');
const CHROME =
  process.env.CHROME_PATH ??
  '/home/z/.cache/puppeteer/chrome/linux-157.0.8103.50/chrome-linux64/chrome';

const t0 = Date.now();

function fail(msg) {
  console.error(`\n[render] FAILED: ${msg}`);
  process.exitCode = 1;
}

/** Sum RSS (KB) of every process whose cmdline matches the pattern. */
function sampleRss(pattern) {
  let total = 0;
  for (const pid of fs.readdirSync('/proc')) {
    if (!/^\d+$/.test(pid)) continue;
    try {
      const cmd = fs.readFileSync(`/proc/${pid}/cmdline`, 'utf8');
      if (!pattern.test(cmd)) continue;
      const status = fs.readFileSync(`/proc/${pid}/status`, 'utf8');
      const m = /VmRSS:\s+(\d+) kB/.exec(status);
      if (m) total += Number(m[1]);
    } catch {
      /* process vanished */
    }
  }
  return total;
}

// ---------------------------------------------------------------------------
// 1) vite dev server
// ---------------------------------------------------------------------------
const server = await createServer({
  root: process.cwd(),
  server: {port: PORT, strictPort: true},
  logLevel: 'error',
});
await server.listen();
console.log(`[render] vite dev server on :${PORT}`);

// ---------------------------------------------------------------------------
// 2) headless Chrome
// ---------------------------------------------------------------------------
const browser = await puppeteer.launch({
  executablePath: fs.existsSync(CHROME) ? CHROME : undefined,
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--force-color-profile=srgb',
    '--hide-scrollbars',
  ],
});
const page = await browser.newPage();
page.on('pageerror', e => console.error('[pageerror]', e.message));
page.on('console', m => {
  if (m.type() === 'error') console.error('[console.error]', m.text());
});

await page.goto(`http://localhost:${PORT}/render.html`, {waitUntil: 'domcontentloaded'});
console.log('[render] harness page loaded, rendering frames...');

let maxRss = 0;
const sampler = setInterval(() => {
  maxRss = Math.max(maxRss, sampleRss(/chrome|ffmpeg/));
}, 1000);

let state;
const renderStart = Date.now();
const BOOT_TIMEOUT_MS = 120_000;
for (;;) {
  await new Promise(r => setTimeout(r, 1500));
  state = await page.evaluate(() => window.__MC_RENDER_STATE ?? {status: 'boot'});
  const secs = Math.round((Date.now() - renderStart) / 1000);
  process.stdout.write(`\r[render] ${state.status} (${secs}s)   `);
  if (state.status === 'done' || state.status === 'error') break;
  if (
    state.status === 'boot' &&
    Date.now() - renderStart > BOOT_TIMEOUT_MS
  ) {
    state = {status: 'error', error: 'harness stuck in boot (module error?)'};
    break;
  }
}
console.log();
clearInterval(sampler);

const renderSecs = (Date.now() - renderStart) / 1000;
await browser.close();
server.close().catch(() => {});

if (state.status !== 'done') {
  fail(state.error ?? 'unknown harness error');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 3) count frames + FFmpeg assembly
// ---------------------------------------------------------------------------
const frames = fs
  .readdirSync(FRAMES_DIR)
  .filter(f => f.endsWith('.jpeg') || f.endsWith('.jpg'))
  .sort();
if (frames.length === 0) {
  fail('no frames were exported');
  process.exit(1);
}
console.log(`[render] ${frames.length} frames exported in ${renderSecs.toFixed(1)}s`);

const frameEncodeStart = Date.now();
const ffmpeg = procSpawn('ffmpeg', [
  '-y',
  '-hide_banner',
  '-loglevel',
  'error',
  '-framerate',
  String(FPS),
  '-i',
  path.join(FRAMES_DIR, '%06d.jpeg'),
  '-c:v',
  'libx264',
  '-crf',
  '18',
  '-preset',
  'veryfast',
  '-pix_fmt',
  'yuv420p',
  '-movflags',
  '+faststart',
  MP4,
]);
let ffRss = 0;
const ffSampler = setInterval(() => {
  ffRss = Math.max(ffRss, sampleRss(/ffmpeg/));
}, 500);
ffmpeg.stderr.on('data', d => process.stderr.write(d));
const ffCode = await new Promise(resolve => ffmpeg.on('close', resolve));
clearInterval(ffSampler);
const encodeSecs = (Date.now() - frameEncodeStart) / 1000;
if (ffCode !== 0) {
  fail(`ffmpeg exited with code ${ffCode}`);
  process.exit(1);
}

const sizeMB = fs.statSync(MP4).size / 1e6;
const totalSecs = (Date.now() - t0) / 1000;
const report = {
  frames: frames.length,
  fps: FPS,
  durationSec: +(frames.length / FPS).toFixed(2),
  renderPhaseSec: +renderSecs.toFixed(1),
  encodePhaseSec: +encodeSecs.toFixed(1),
  totalWallSec: +totalSecs.toFixed(1),
  peakChromeRssMB: +(maxRss / 1024).toFixed(1),
  ffmpegRssMB: +(ffRss / 1024).toFixed(1),
  mp4SizeMB: +sizeMB.toFixed(2),
  mp4: MP4,
};
fs.writeFileSync(path.resolve('output/render-stats.json'), JSON.stringify(report, null, 2));
console.log('\n[render] stats:\n' + JSON.stringify(report, null, 2));
