import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { build } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '..');
// Verification exports can be rendered separately from the approved artwork.
const output = path.resolve(root, process.env.SVG_OUTPUT_DIR || 'page_svgs');
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
const manifest = [];
try {
  for (const [filename, screen, label] of pages) {
    if (process.env.SVG_RESUME && process.env.SVG_REFRESH !== screen && await fs.access(path.join(output, filename + '.svg')).then(() => true, () => false) && await fs.access(path.join(output, 'previews', filename + '.png')).then(() => true, () => false)) {
      const svg = await fs.readFile(path.join(output, filename + '.svg'), 'utf8');
      const dimensions = svg.match(/<svg[^>]*width="(\d+)" height="(\d+)"/);
      manifest.push({ file: filename + '.svg', preview: `previews/${filename}.png`, label, width: Number(dimensions[1]), height: Number(dimensions[2]), bytes: Buffer.byteLength(svg) });
      console.log(`REUSED ${filename}.svg`); continue;
    }
    const profileRoot = path.join(root, '.tmp');
    const profile = await fs.mkdtemp(path.join(profileRoot, 'yemunnai-svg-'));
    const wide = ['gallery', 'artifacts', 'components', 'error'].includes(screen);
    const portal = ['gallery', 'artifacts', 'components'].includes(screen) ? `&portal=${screen}` : '';
    const address = `http://127.0.0.1:${server.address().port}/scripts/svg-export/index.html?screen=${screen}${portal}`;
    const child = spawn(chrome, ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-crash-reporter', '--no-first-run', '--no-default-browser-check', '--force-prefers-reduced-motion', '--hide-scrollbars', '--force-device-scale-factor=1', `--window-size=${wide ? 1280 : 400},899`, `--user-data-dir=${profile}`, address], { windowsHide: true, stdio: 'ignore' });
    try {
      let launchError, exitCode;
      child.on('error', error => { launchError = error; }); child.on('exit', code => { exitCode = code; });
      const deadline = Date.now() + 45000;
      while (!results.has(screen) && Date.now() < deadline) {
        if (launchError) throw launchError;
        if (exitCode !== undefined) throw Error(`Chrome exited (${exitCode}) on ${screen}`);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      const result = results.get(screen);
      if (!result) throw Error(`Timed out rendering ${screen}. Requests: ${requests.join(', ')}`);
      if (result.error) throw Error(result.error);
      if (!result.svg.includes('<text') && screen !== 'intro') throw Error(`No text rendered for ${screen}`);
      if (result.svg.includes('<foreignObject') || /(?:href|src)="https?:/.test(result.svg)) throw Error(`Nonportable content in ${screen}`);
      await fs.writeFile(path.join(output, filename + '.svg'), result.svg);
      // Thumbnail render omits expensive blur filters; the original SVG retains them.
      const thumbnail = result.svg.replace(/filter="url\(#[^)]*\)"/g, '').replaceAll('<text ', '<text style="font-family: Segoe UI, Arial, sans-serif" ');
      await sharp(Buffer.from(thumbnail)).resize({ width: wide ? 640 : 400 }).png().toFile(path.join(output, 'previews', filename + '.png'));
      manifest.push({ file: filename + '.svg', preview: `previews/${filename}.png`, label, width: result.width, height: result.height, bytes: Buffer.byteLength(result.svg) });
      console.log(`EXPORTED ${filename}.svg (${result.width} × ${result.height})`);
    } finally {
      child.kill();
      await new Promise(resolve => setTimeout(resolve, 400));
      // Only remove this run's uniquely named temporary browser profile.
      if (path.dirname(profile) !== profileRoot || !path.basename(profile).startsWith('yemunnai-svg-')) throw Error('Unsafe browser profile cleanup');
      await fs.rm(profile, { recursive: true, force: true, maxRetries: 3 }).catch(() => {});
    }
  }
  await fs.copyFile(path.join(root, 'figma_svgs/07_mascot_logo.svg'), path.join(output, '07_mascot_logo.svg'));
  const logoSource = await fs.readFile(path.join(output, '07_mascot_logo.svg'), 'utf8');
  const logoDimensions = logoSource.match(/<svg[^>]*width="(\d+)" height="(\d+)"/);
  await sharp(Buffer.from(logoSource.replaceAll('<text ', '<text style="font-family: Segoe UI, Arial, sans-serif" '))).resize({ width: 400 }).png().toFile(path.join(output, 'previews/07_mascot_logo.png'));
  manifest.push({ file: '07_mascot_logo.svg', preview: 'previews/07_mascot_logo.png', label: 'Mascot logo (existing asset)', width: Number(logoDimensions[1]), height: Number(logoDimensions[2]), bytes: Buffer.byteLength(logoSource) });
  manifest.sort((a, b) => a.file.localeCompare(b.file));
  await fs.writeFile(path.join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  const tiles = [];
  for (let i = 0; i < manifest.length; i++) {
    const item = manifest[i];
    const thumb = await sharp(path.join(output, item.preview)).resize({ width: 160 }).toBuffer();
    const info = await sharp(thumb).metadata();
    const tile = await sharp(thumb).extract({ left: 0, top: 0, width: 160, height: Math.min(240, info.height) }).extend({ bottom: Math.max(0, 240 - info.height), background: '#fff' }).png().toBuffer();
    tiles.push({ input: tile, left: 20 + (i % 7) * 180, top: 20 + Math.floor(i / 7) * 280 });
    const label = item.label.replaceAll('&', '&amp;').replaceAll('<', '&lt;');
    tiles.push({ input: Buffer.from(`<svg width="160" height="30"><text x="80" y="18" text-anchor="middle" font-family="Arial,sans-serif" font-size="9" fill="#1F140A">${item.file.slice(0, 2)}. ${label}</text></svg>`), left: 20 + (i % 7) * 180, top: 260 + Math.floor(i / 7) * 280 });
  }
  await sharp({ create: { width: 1280, height: 860, channels: 4, background: '#E8ECEF' } }).composite(tiles).png().toFile(path.join(output, 'preview.png'));
  const cards = manifest.map(x => `<article><a href="${x.file}"><img loading="lazy" src="${x.preview}" alt="${x.label}"></a><h2>${x.label}</h2><p>${x.width} × ${x.height}</p><a href="${x.file}" download>Download SVG</a></article>`).join('\n');
  await fs.writeFile(path.join(output, 'index.html'), `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>YEMUNNAI — all page SVGs</title><style>body{margin:0;padding:32px;background:#E8ECEF;color:#1F140A;font:16px system-ui}h1{margin-top:0}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:24px}article{padding:18px;background:white;border-radius:20px}img{width:100%;height:360px;object-fit:contain;object-position:top}h2{font-size:18px}p{color:#7A6658}a{color:#9b3b00}</style><h1>YEMUNNAI — all page SVGs</h1><p>21 static SVG files. Click a preview to open the original; use Download SVG to save it.</p><main>${cards}</main></html>\n`);
  await fs.copyFile(path.join(root, 'figma_svgs/FONT-LICENSE.txt'), path.join(output, 'FONT-LICENSE.txt')).catch(() => {});
  await fs.writeFile(path.join(output, 'README.md'), `# YEMUNNAI page SVGs\n\n21 self-contained SVG files covering the current screens, modal views, and internal gallery pages. Open [index.html](index.html) for previews and download links. Individual PNG previews are in previews/; manifest.json lists dimensions.\n\nGenerated from the actual React components on 2026-10-03 using local sample food, vendor and order data. No live backend is contacted. Phone exports are 400 pixels wide; long screens include their full rendered content. Internal galleries and the error page are 1280 pixels wide. Modal exports show an 812-pixel-tall viewport. The onboarding screen remains included even though discovery is the default entry point.\n\nLayouts, icons, borders, gradients and labels are SVG vectors and editable text. Photos and the logo illustration are embedded raster images. The brand intro represents one frame of its video. The mascot is copied from the existing design pack. Fonts are embedded where supplied by the original pack; editors that ignore SVG web fonts may need Plus Jakarta Sans installed.\n\nThese are static exports, not interactive pages. Browser layout is preserved, but complex CSS effects (inset shadows, backdrop blur, pseudo-elements, and some stacking details) can differ. Each screen captures its default view; tabs, expanded disclosures and every possible order state are not separate pages. Existing files in figma_svgs/ and public/svgs/ are preserved.\n\nRegenerate from the project root with:\n\n\`\`\`powershell\nnode scripts/export_page_svgs.mjs\n\`\`\`\n\nRequires installed project dependencies and Chrome (override CHROME_PATH if needed). The export harness and isolated bundle are separate from the production app.\n`);
  await fs.appendFile(path.join(output, 'README.md'), '\nPNG thumbnails use system sans-serif fonts and omit blur filters for fast previews. The SVG originals retain the embedded fonts and shadow filters.\n');
  console.log(`DONE: ${manifest.length} SVG assets in ${output}`);
} finally {
  await new Promise(resolve => server.close(resolve));
}
