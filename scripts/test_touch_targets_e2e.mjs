import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';

// Bootstrap script injected into client head
const bootstrap = `
  window.__yemDeferredInstall = { prompt: async () => {}, userChoice: Promise.resolve({ outcome: 'dismissed' }) };
  localStorage.setItem('yemunnai-intro-seen', 'true');
  sessionStorage.setItem('yem-install-dismissed', '1');
`;

// Exercise function executed inside headless Chromium context
const exercise = `
(async function() {
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const results = [];

  function record(target, width, height, minWidth, minHeight) {
    const passed = width >= minWidth && height >= minHeight;
    results.push({
      target,
      measured: Math.round(width) + 'px × ' + Math.round(height) + 'px',
      required: minWidth + 'px × ' + minHeight + 'px',
      status: passed ? 'PASS' : 'FAIL'
    });
    if (!passed) {
      throw new Error('WCAG target size failure on ' + target + ': got ' + width + 'x' + height + ', expected >=' + minWidth + 'x' + minHeight);
    }
  }

  try {
    // Wait for discovery feed to mount
    let attempts = 0;
    while (!document.querySelector('#buyer-tab-discover') && attempts < 100) {
      await wait(50);
      attempts++;
    }

    // 1. Audit BuyerTabBar 3-Tab Touch Bounding Boxes
    const tabs = ['discover', 'saved', 'profile'];
    for (const tab of tabs) {
      const el = document.querySelector('#buyer-tab-' + tab);
      if (!el) throw new Error('Missing tab #buyer-tab-' + tab);
      const rect = el.getBoundingClientRect();
      record('BuyerTabBar Tab [' + tab + ']', rect.width, rect.height, 44, 44);
    }

    // 2. Open VendorLoginModal and Audit
    const brandBtn = document.querySelector('.discovery-brand') || document.querySelector('button[aria-label="Open business portal"]');
    if (brandBtn) {
      brandBtn.click();
      let modalAttempts = 0;
      while (!document.querySelector('[role="dialog"][aria-labelledby="vendor-login-title"]') && modalAttempts < 50) {
        await wait(50);
        modalAttempts++;
      }
    }

    const modal = document.querySelector('[role="dialog"][aria-labelledby="vendor-login-title"]');
    if (modal) {
      // Close button
      const closeBtn = modal.querySelector('button[aria-label*="Close login"], button[aria-label*="మూసివేయండి"]');
      if (closeBtn) {
        const rect = closeBtn.getBoundingClientRect();
        record('VendorLoginModal Close Button', rect.width, rect.height, 44, 44);
      }

      // Terminal Store Code Input
      const codeInput = modal.querySelector('#store-code-input');
      if (codeInput) {
        const rect = codeInput.getBoundingClientRect();
        record('VendorLoginModal Store Code Input', rect.width, rect.height, 100, 44);
      }

      // Unlock button
      const unlockBtn = modal.querySelector('button[type="submit"]');
      if (unlockBtn) {
        const rect = unlockBtn.getBoundingClientRect();
        record('VendorLoginModal Unlock CTA Button', rect.width, rect.height, 100, 44);
      }

      // Advance to PIN deck via quick pick chip
      const quickChips = Array.from(modal.querySelectorAll('button')).filter(b => b.textContent && b.textContent.includes('MITS'));
      if (quickChips.length > 0) {
        quickChips[0].click();
        await wait(300);
      } else if (codeInput) {
        codeInput.value = 'MITS';
        codeInput.dispatchEvent(new Event('input', { bubbles: true }));
        await wait(300);
      }

      // Check PIN digit inputs
      const pinInputs = modal.querySelectorAll('input[type="password"]');
      pinInputs.forEach((pinEl, idx) => {
        const rect = pinEl.getBoundingClientRect();
        record('VendorLoginModal PIN Digit [' + (idx + 1) + ']', rect.width, rect.height, 44, 44);
      });

      // Check on-screen Keypad buttons
      const keypadButtons = modal.querySelectorAll('.tactile-numpad button, .grid button');
      keypadButtons.forEach((btn, idx) => {
        const rect = btn.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          record('VendorLoginModal Keypad Key [' + (btn.textContent?.trim() || idx) + ']', rect.width, rect.height, 44, 44);
        }
      });
    }

    // Report success with detailed measurements
    await fetch('/__result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ result: 'pass', tests: results })
    });
  } catch (err) {
    await fetch('/__result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ result: 'fail', error: err.message, tests: results })
    });
  }
})();
`;

async function runE2ETouchTargetAudit() {
  const chrome = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  const dist = path.resolve('dist');

  console.log('\n[E2E AUDITOR] Launching Headless Chromium Touch Target Verification...');
  console.log('[E2E AUDITOR] Serving bundle from:', dist);

  let result = null;
  const server = createServer(async (req, res) => {
    if (req.url === '/__result' && req.method === 'POST') {
      let body = '';
      for await (const chunk of req) body += chunk;
      result = JSON.parse(body);
      res.end('ok');
      return;
    }

    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const filePath = path.resolve(dist, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!filePath.startsWith(dist + path.sep)) {
      res.writeHead(403).end();
      return;
    }

    try {
      let content = await fs.readFile(filePath);
      const ext = path.extname(filePath);
      const mimeTypes = {
        '.html': 'text/html; charset=utf-8',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.png': 'image/png',
        '.svg': 'image/svg+xml',
        '.webp': 'image/webp'
      };
      res.setHeader('Content-Type', mimeTypes[ext] ?? 'application/octet-stream');

      if (ext === '.html') {
        content = content.toString()
          .replace('<head>', `<head><script>${bootstrap}</script>`)
          .replace('</body>', `<script>${exercise}</script></body>`);
      }
      res.end(content);
    } catch {
      res.writeHead(404).end();
    }
  });

  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const url = `http://127.0.0.1:${port}`;

  console.log(`[E2E AUDITOR] Test server listening on ${url}`);

  const profileDir = path.resolve('.tmp/touch-target-chrome-profile');
  await fs.mkdir(profileDir, { recursive: true });

  const chromeProc = spawn(chrome, [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--disable-extensions',
    '--window-size=375,812',
    `--user-data-dir=${profileDir}`,
    url
  ], { windowsHide: true, stdio: 'ignore' });

  const deadline = Date.now() + 30000;
  while (!result && Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 200));
  }

  chromeProc.kill();
  await new Promise(resolve => server.close(resolve));

  if (!result) {
    throw new Error('E2E Audit timed out after 30s without client report.');
  }

  console.log('\n======================================================================');
  console.log('       WCAG 2.5.5 / 2.2 TOUCH TARGET BOUNDING BOX AUDIT REPORT        ');
  console.log('======================================================================');
  console.table(result.tests);

  if (result.result === 'pass') {
    console.log('\n✅ ALL TOUCH TARGETS MEET OR EXCEED 44px × 44px (100% PASS)\n');
  } else {
    console.error('\n❌ AUDIT FAILED:', result.error, '\n');
    process.exit(1);
  }
}

runE2ETouchTargetAudit().catch(err => {
  console.error('[E2E AUDITOR ERROR]', err);
  process.exit(1);
});
