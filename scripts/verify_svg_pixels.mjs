import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { build } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import sharp from 'sharp';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';

const root = path.resolve(import.meta.dirname, '..');
// Verification exports can be rendered separately from the approved artwork.
const output = path.resolve(root, '.tmp/pixel-audit');
if (!output.startsWith(root + path.sep)) throw new Error('SVG output must be inside the project');
const bundle = path.join(root, '.tmp', 'svg-export-bundle');
const chrome = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const pages = [
  ['01_home_discovery_feed', 'home', 'Home discovery'],
  ['02_quick_order_modal', 'checkout', 'Pickup checkout'],
  ['03_feedback_popup', 'feedback', 'Feedback'],
  ['04_business_dashboard', 'dashboard', 'Business dashboard'],
  ['05_add_edit_food_item', 'add', 'Add / edit food item'],
  ['06_walk_in_map_modal', 'map', 'Walk-in map'],
  ['08_splash_onboarding', 'onboarding', 'Splash & onboarding'],
  ['09_location_permission', 'location', 'Location permission'],
  ['10_food_item_detail', 'detail', 'Food item detail'],
  ['11_menu_stock_management', 'stock', 'Menu & stock management'],
  ['12_access_login', 'login', 'Vendor login'],
  ['13_buyer_orders', 'orders', 'Buyer orders & history'],
  ['14_saved_items', 'saved', 'Saved items'],
  ['15_brand_intro', 'intro', 'Brand intro (video frame)'],
  ['16_error_404', 'error', '404 error'],
  ['17_screen_gallery', 'gallery', 'Screen gallery'],
  ['18_design_deliverables', 'artifacts', 'Design deliverables'],
  ['19_component_showcase', 'components', 'Component showcase'],
  ['20_collection_confirmation', 'collection', 'Collection confirmation'],
  ['21_help_requests', 'support', 'Help requests'],
];

await fs.access(chrome);
await fs.mkdir(path.join(output, 'previews'), { recursive: true });
// An isolated build with a reserved, intercepted hostname never uses .env credentials.
if (!process.env.SVG_SKIP_BUILD) await build({
  configFile: false, root, envDir: false,
  plugins: [react(), tailwindcss()],
  define: { 'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('https://svg-preview.invalid'), 'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify('svg-export-local-fixture') },
  resolve: { alias: { '@': path.join(root, 'src'), '@hugeicons/core-free-icons': path.join(root, 'src/lib/hugeicons-shim.tsx'), '@hugeicons/react': path.join(root, 'src/lib/hugeicons-shim.tsx'), 'motion/react': path.join(root, 'src/lib/motion-shim.tsx'), motion: path.join(root, 'src/lib/motion-shim.tsx') } },
  build: { outDir: bundle, emptyOutDir: true, copyPublicDir: false, rollupOptions: { input: path.join(root, 'scripts/svg-export/index.html') } },
});
const sample = await fs.readFile(path.join(root, 'figma_svgs/02_quick_order_modal.svg'), 'utf8');
const fonts = (sample.match(/<style>([\s\S]*?)<\/style>/)?.[1] || '').replace(/text\{[^}]*\}/g, '');
const results = new Map();
const requests = [];
const server = createServer(async (request, response) => {
  requests.push(request.url);
  try {
    const url = new URL(request.url, 'http://localhost');
    if (url.pathname.startsWith('/__reference/')) {
      const name = path.basename(url.pathname, '.html');
      if (!pages.some(page => page[0] === name) && name !== '07_mascot_logo') throw Error('Unknown reference');
      const svg = (await fs.readFile(path.join(root, 'page_svgs', name + '.svg'), 'utf8')).replace(/<\?xml[^>]*>/, '');
      response.setHeader('Content-Type', 'text/html; charset=utf-8');
      response.end(`<!doctype html><meta charset="utf-8"><style>html,body{margin:0;padding:0}svg{display:block}</style>${svg}`); return;
    }
    if (url.pathname === '/__logo.html') {
      response.setHeader('Content-Type','text/html; charset=utf-8');
      response.end('<!doctype html><style>html,body{margin:0;padding:0}img{display:block;width:546px;height:330px}</style><img src="/svgs/07_mascot_logo.svg">'); return;
    }
    if (url.pathname === '/__svg-fonts') { response.setHeader('Content-Type', 'text/plain'); response.end(fonts); return; }
    if (url.pathname === '/__svg-result' && request.method === 'POST') {
      let body = ''; for await (const part of request) body += part;
      const result = JSON.parse(body); results.set(result.screen, result); response.end('ok'); return;
    }
    const pathname = decodeURIComponent(url.pathname);
    const safeFile = base => {
      const candidate = path.resolve(base, '.' + pathname);
      if (!candidate.startsWith(base + path.sep)) throw Error('Path outside export roots');
      return candidate;
    };
    let data;
    try { data = await fs.readFile(safeFile(bundle)); }
    catch { data = await fs.readFile(safeFile(path.join(root, 'public'))); }
    if (pathname.endsWith('.html')) {
      data = data.toString().replace('<head>', `<head><style>${fonts}</style><script>
        localStorage.clear(); sessionStorage.clear();
        localStorage.setItem('yemunnai-intro-seen','true');
        localStorage.setItem('yemunnai-language','en');
        const owner='10000000-0000-4000-8000-000000000002';
        const buyer='10000000-0000-4000-8000-000000000001';
        const session=id=>({access_token:btoa(JSON.stringify({alg:'HS256',typ:'JWT'}))+'.'+btoa(JSON.stringify({sub:id,role:'authenticated',exp:Math.floor(Date.now()/1000)+86400}))+'.fixture',refresh_token:'fixture',expires_at:Math.floor(Date.now()/1000)+86400,expires_in:86400,token_type:'bearer',user:{id,aud:'authenticated',role:'authenticated',is_anonymous:id===buyer}});
        localStorage.setItem('yemunnai-vendor-auth',JSON.stringify(session(owner)));
        localStorage.setItem('yemunnai-buyer-auth',JSON.stringify(session(buyer)));
        const saved=['b0000000-0000-4000-8000-000000000003'];
        localStorage.setItem('yemunnai_saved_items',JSON.stringify(saved));
        localStorage.setItem('yemunnai-saved-'+buyer,JSON.stringify(saved));
        window.addEventListener('error',e=>fetch('/__svg-result',{method:'POST',body:JSON.stringify({screen:new URLSearchParams(location.search).get('screen'),error:e.message})}));
        window.addEventListener('unhandledrejection',e=>fetch('/__svg-result',{method:'POST',body:JSON.stringify({screen:new URLSearchParams(location.search).get('screen'),error:String(e.reason)})}));
      </script>`);
    }
    const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.mp4': 'video/mp4' };
    response.setHeader('Content-Type', mime[path.extname(pathname)] || 'application/octet-stream');
    response.end(data);
  } catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
// Browser screenshots are the evidence here, not re-serialized DOM SVGs.
const records = [];
await fs.mkdir(path.join(output, 'reference'), { recursive: true });
await fs.mkdir(path.join(output, 'actual'), { recursive: true });
await fs.mkdir(path.join(output, 'diff'), { recursive: true });
const flags = ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-crash-reporter', '--no-first-run', '--no-default-browser-check', '--force-prefers-reduced-motion', '--hide-scrollbars', '--force-device-scale-factor=1', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-features=PaintHolding', '--run-all-compositor-stages-before-draw'];
async function screenshot(address, file, width, height) {
  const profileRoot = path.join(root, '.tmp');
  const profile = await fs.mkdtemp(path.join(profileRoot, 'pixel-audit-'));
  const child = spawn(chrome, [...flags, `--window-size=${width},${height}`, '--timeout=20000', '--virtual-time-budget=12000', `--screenshot=${file}`, `--user-data-dir=${profile}`, address], { windowsHide: true, stdio: ['ignore','ignore','pipe'] });
  let diagnostics = '';
  child.stderr.on('data', chunk => { diagnostics = (diagnostics + chunk).slice(-2000); });
  try {
    await Promise.race([
      new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', resolve); }),
      new Promise((_, reject) => { const timer = setTimeout(() => reject(Error('Screenshot timeout: ' + address + ' ' + diagnostics)), 45000); timer.unref(); }),
    ]);
    if (!await fs.access(file).then(() => true, () => false)) throw Error('Screenshot missing: ' + diagnostics);
    const meta = await sharp(file).metadata();
    if (meta.width !== width || meta.height !== height) throw Error(`Screenshot dimensions ${meta.width}x${meta.height} differ from ${width}x${height}`);
  } finally {
    child.kill();
    await new Promise(resolve => setTimeout(resolve, 300));
    if (path.dirname(profile) !== profileRoot || !path.basename(profile).startsWith('pixel-audit-')) throw Error('Unsafe profile cleanup');
    await fs.rm(profile, { recursive: true, force: true, maxRetries: 3 }).catch(() => {});
  }
}
try {
  const selected=process.env.SVG_AUDIT_ONLY?.split(',');
  const cases = [...pages, ['07_mascot_logo', 'logo', 'Mascot logo']].filter(page=>!selected||selected.includes(page[1])).sort((a,b) => a[0].localeCompare(b[0]));
  for (const [name, screen, label] of cases) {
    const svg = await fs.readFile(path.join(root, 'page_svgs', name + '.svg'), 'utf8');
    const dimensions = svg.match(/<svg[^>]*width="([\d.]+)" height="([\d.]+)"/);
    const width = Number(dimensions[1]), height = Number(dimensions[2]);
    const reference = path.join(output, 'reference', name + '.png');
    const actual = path.join(output, 'actual', name + '.png');
    // Same rasterizer, font engine, device scale, and viewport on both sides.
    await screenshot(pathToFileURL(path.join(root,'page_svgs',name+'.svg')).href, reference, width, height);
    const portal = ['gallery','artifacts','components'].includes(screen) ? `&portal=${screen}` : '';
    await screenshot(`http://127.0.0.1:${server.address().port}/${screen === 'logo' ? '__logo.html' : `scripts/svg-export/index.html?screen=${screen}&pixelAudit=1${portal}`}`, actual, width, height);
    const a = await sharp(reference).ensureAlpha().raw().toBuffer();
    const b = await sharp(actual).ensureAlpha().raw().toBuffer();
    const diff = Buffer.alloc(a.length);
    let exact = 0, meaningful = 0, error = 0;
    for (let i = 0; i < a.length; i += 4) {
      let maximum = 0;
      for (let channel = 0; channel < 4; channel++) { const delta = Math.abs(a[i+channel]-b[i+channel]); maximum = Math.max(maximum,delta); error += delta; }
      if (maximum) exact++;
      if (maximum > 16) meaningful++;
      diff[i] = maximum > 16 ? 240 : Math.round(a[i]*.2+255*.8);
      diff[i+1] = maximum > 16 ? 0 : Math.round(a[i+1]*.2+255*.8);
      diff[i+2] = maximum > 16 ? 120 : Math.round(a[i+2]*.2+255*.8);
      diff[i+3] = 255;
    }
    await sharp(diff, { raw: { width, height, channels: 4 } }).png().toFile(path.join(output, 'diff', name + '.png'));
    const pixels = width * height;
    const record = { name, label, width, height, status: exact === 0 ? 'EXACT MATCH' : 'MISMATCH', differentPixels: exact, differentPercent: +(exact/pixels*100).toFixed(2), significantPercent: +(meaningful/pixels*100).toFixed(2), meanChannelError: +(error/a.length).toFixed(2), renderedContentHeight: results.get(screen)?.height ?? null };
    record.referenceSha256 = createHash('sha256').update(svg).digest('hex');
    record.actualScreenshotSha256 = createHash('sha256').update(await fs.readFile(actual)).digest('hex');
    records.push(record); console.log(`${record.status}: ${name} — ${record.differentPercent}% different pixels`);
    await fs.writeFile(path.join(output,'report.json'), JSON.stringify(records,null,2));
  }
  const rows = records.map(r => `<tr><td>${r.label}</td><td>${r.width} × ${r.height}</td><td>${r.status}</td><td>${r.differentPercent}%</td><td><a href="#${r.name}">Compare</a></td></tr>`).join('');
  const pairs = records.map(r => `<section id="${r.name}"><h2>${r.label}: ${r.status}</h2><p>${r.differentPercent}% pixels differ; ${r.significantPercent}% differ by more than 16 channel values.</p><div class="pair"><figure><figcaption>Reference SVG</figcaption><img loading="lazy" src="reference/${r.name}.png"></figure><figure><figcaption>Actual browser rendering</figcaption><img loading="lazy" src="actual/${r.name}.png"></figure><figure><figcaption>Differences (pink)</figcaption><img loading="lazy" src="diff/${r.name}.png"></figure></div></section>`).join('');
  await fs.writeFile(path.join(output,'index.html'), `<!doctype html><meta charset="utf-8"><title>SVG pixel audit</title><style>body{font:14px system-ui;background:#e8ecef;color:#1f140a;margin:24px}table{border-collapse:collapse;background:white}td,th{padding:12px;border:1px solid #d6dce2}.pair{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}figure{margin:0}img{width:100%;height:auto}section{margin:40px 0;padding:20px;background:white;border-radius:16px}figcaption{padding:12px;font-weight:bold}</style><h1>YEMUNNAI — all 21 SVG pixel comparisons</h1><p>Actual Chromium screenshots at each SVG's dimensions, device scale 1, English, reduced motion, deterministic local fixture data. Approved SVGs remain unchanged. Any differing pixel fails the exact-match check. Pink highlights differences above 16 channel values; text antialiasing and SVG export artifacts also count as differences.</p><table><tr><th>Screen</th><th>Dimensions</th><th>Result</th><th>Different pixels</th><th>Evidence</th></tr>${rows}</table>${pairs}`);
} finally { await new Promise(resolve => server.close(resolve)); }
