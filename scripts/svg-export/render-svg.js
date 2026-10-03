/* Browser-side SVG serializer. HTML is converted into SVG geometry and text;
 * no foreignObject, screenshot wrapper, or external image dependencies. */
export function bootstrap(items, shops, item, screen) {
  const vendorId = item.vendorId;
  const owner = '10000000-0000-4000-8000-000000000002';
  const shop = { id: vendorId, owner_id: owner, name: 'MITS Canteen', is_active: true, is_online: true, is_on_campus: true, location_landmark: 'MITS Food Court', latitude: 13.55, longitude: 78.5, image_url: '/images/shop_mits_canteen.jpg' };
  const rows = items.map(x => ({ id: x.id, vendor_id: x.vendorId, name: x.name, price: x.price, category: x.category, action_type: x.actionType, image_url: x.image, in_stock: x.inStock, remaining_quantity: 25, is_vegetarian: x.isVeg ?? true, likes_count: x.likes, dislikes_count: x.dislikes, reviews_count: x.reviews, created_at: '2026-10-03T05:00:00Z', vendors: { ...shop, name: x.vendor }, reviews: [{ rating: x.rating ?? 4.8 }] }));
  const order = (status, n) => ({ id: `svg-order-${n}`, vendor_id: vendorId, food_item_id: item.id, item_name: item.name, unit_price: item.price, quantity: 2, total: item.price * 2, buyer_id: '10000000-0000-4000-8000-000000000001', attempt_id: `svg-attempt-${n}`, pickup_number: n, operating_date: '2026-10-03', shop_name: shop.name, pickup_location: shop.location_landmark, status, is_legacy: false, cancellation_requested: false, preparation_minutes: 5, vendors: shop, created_at: '2026-10-03T06:00:00Z', food_items: { image_url: item.image }, payment_method: status === 'collected' ? 'cash' : null });
  window.__svgOrders = [order('ready', 1001), order('preparing', 1002), order('collected', 1000)];
  const nativeFetch = window.fetch.bind(window);
  window.fetch = async (resource, options = {}) => {
    const address = typeof resource === 'string' ? resource : resource.url ?? String(resource);
    if (!address.startsWith('https://svg-preview.invalid/')) return nativeFetch(resource, options);
    const url = new URL(address);
    const reply = body => new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json', 'content-range': '0-2/3' } });
    if (url.pathname.includes('/auth/')) return reply({ id: owner, aud: 'authenticated', role: 'authenticated' });
    if (url.pathname.endsWith('/vendors')) {
      if (url.searchParams.has('owner_id')) return reply(shop);
      return reply(shops.map(x => ({ ...shop, id: x.id, name: x.name, image_url: x.image })));
    }
    if (url.pathname.endsWith('/food_items')) return reply(url.searchParams.has('vendor_id') ? rows.filter(x => x.vendor_id === vendorId) : rows);
    if (url.pathname.endsWith('/reviews')) return reply([{ rating: 4.8 }]);
    if (url.pathname.endsWith('/saved_items')) return reply([{ food_item_id: item.id }]);
    if (url.pathname.includes('/functions/v1/pickup')) {
      const body = JSON.parse(options.body ?? '{}');
      return reply(body.action === 'support_list' ? { requests: [] } : { orders: window.__svgOrders });
    }
    return reply([]);
  };
  window.WebSocket = class { close() {} send() {} addEventListener() {} removeEventListener() {} };
  const style = document.createElement('style');
  style.textContent = 'html,body{margin:0!important;width:400px!important;min-height:812px!important}#root{width:400px;min-height:812px}.pickup-sheet{max-height:776px!important}.pickup-overlay,.fixed.inset-0{width:400px!important;height:812px!important}*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}';
  if (['gallery', 'artifacts', 'components', 'error'].includes(screen)) style.textContent = style.textContent.replaceAll('400px', '1280px');
  document.head.append(style);
}

export async function capture(screen) {
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  try {
    await wait(1800);
    if (screen === 'collection') document.querySelector('button')?.click();
    await document.fonts.ready;
    for (const img of document.images) img.loading = 'eager';
    await Promise.race([Promise.all([...document.images].map(img => img.decode().catch(() => {}))), wait(8000)]);
    if (screen === 'intro') {
      const video = document.querySelector('video');
      if (video) {
        await Promise.race([new Promise(resolve => { video.onloadeddata = resolve; if (video.readyState >= 2) resolve(); }), wait(3000)]);
        video.pause();
        const seeked = new Promise(resolve => video.addEventListener('seeked', resolve, { once: true }));
        video.currentTime = Math.min(4, Math.max(0, (video.duration || 5) - .1));
        await Promise.race([seeked, wait(3000)]);
      }
    }
    await wait(400);
    const wide = ['gallery', 'artifacts', 'components', 'error'].includes(screen);
    const width = wide ? 1280 : 400;
    const hasModal = ['checkout', 'feedback', 'add', 'map', 'login', 'collection'].includes(screen);
    const height = hasModal || screen === 'intro' ? 812 : Math.max(812, Math.ceil(document.getElementById('root').getBoundingClientRect().height));
    const result = await serialize(document.body, width, height, screen);
    await fetch('/__svg-result', { method: 'POST', body: JSON.stringify({ screen, width, height, svg: result, text: document.body.innerText }) });
  } catch (error) {
    await fetch('/__svg-result', { method: 'POST', body: JSON.stringify({ screen, error: error.stack || String(error) }) });
  }
}

async function serialize(root, width, height, title) {
  const NS = 'http://www.w3.org/2000/svg';
  const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]);
  const num = value => Math.round(value * 100) / 100;
  const defs = [];
  let serial = 0;
  const id = prefix => `${prefix}-${++serial}`;
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const colorCache = new Map();
  function color(value) {
    if (!value || value === 'none') return 'none';
    if (colorCache.has(value)) return colorCache.get(value);
    ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = value; ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    const result = a === 255 ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${num(a / 255)})`;
    colorCache.set(value, result); return result;
  }
  function split(value) {
    let depth = 0, start = 0; const parts = [];
    for (let i = 0; i < value.length; i++) {
      if (value[i] === '(') depth++;
      if (value[i] === ')') depth--;
      if (value[i] === ',' && depth === 0) { parts.push(value.slice(start, i).trim()); start = i + 1; }
    }
    parts.push(value.slice(start).trim()); return parts;
  }
  function gradient(value) {
    if (!value.startsWith('linear-gradient(')) return null;
    const parts = split(value.slice(16, -1));
    let angle = 180;
    if (parts[0].includes('deg')) angle = parseFloat(parts.shift());
    else if (parts[0].startsWith('to ')) {
      const dir = parts.shift(); angle = dir.includes('right') ? 90 : dir.includes('left') ? 270 : dir.includes('top') ? 0 : 180;
    }
    const gid = id('gradient');
    const dx = Math.sin(angle * Math.PI / 180) / 2, dy = -Math.cos(angle * Math.PI / 180) / 2;
    const stops = parts.map((part, i) => {
      const match = part.match(/^(.*?)(?:\s+([\d.]+)%)?$/);
      return `<stop offset="${match[2] ?? num(i * 100 / Math.max(1, parts.length - 1))}%" stop-color="${color(match[1])}"/>`;
    }).join('');
    defs.push(`<linearGradient id="${gid}" x1="${50 - dx * 100}%" y1="${50 - dy * 100}%" x2="${50 + dx * 100}%" y2="${50 + dy * 100}%">${stops}</linearGradient>`);
    return `url(#${gid})`;
  }
  function rect(box, radius, fill, extra = '') {
    return `<rect x="${num(box.x)}" y="${num(box.y)}" width="${num(box.width)}" height="${num(box.height)}" rx="${num(radius)}" fill="${fill}" ${extra}/>`;
  }
  const images = new Map();
  async function imageURI(url) {
    if (!url || url.startsWith('data:')) return url || '';
    if (!images.has(url)) images.set(url, fetch(url).then(r => { if (!r.ok) throw Error(`Image HTTP ${r.status}: ${url}`); return r.blob(); }).then(blob => new Promise(resolve => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.readAsDataURL(blob); })));
    return images.get(url);
  }
  function textStyle(style, fill) {
    return `fill="${fill}" font-family="${esc(style.fontFamily)}" font-size="${style.fontSize}" font-weight="${style.fontWeight}" font-style="${style.fontStyle}" letter-spacing="${style.letterSpacing === 'normal' ? 0 : style.letterSpacing}"`;
  }
  function text(node, style) {
    const value = node.textContent;
    if (!value.trim()) return '';
    // Character ranges preserve the browser's actual line breaks and spacing.
    const lines = []; let line = null;
    const range = document.createRange();
    for (let i = 0; i < value.length; i++) {
      range.setStart(node, i); range.setEnd(node, i + 1);
      const b = range.getBoundingClientRect();
      if (!b.width || !b.height) continue;
      if (!line || Math.abs(line.y - b.y) > 2) { line = { x: b.x, y: b.y, h: b.height, value: '' }; lines.push(line); }
      line.value += value[i];
    }
    return lines.map(line => {
      let label = line.value;
      if (style.textTransform === 'uppercase') label = label.toUpperCase();
      if (style.textTransform === 'lowercase') label = label.toLowerCase();
      return `<text x="${num(line.x)}" y="${num(line.y + line.h * .79)}" xml:space="preserve" ${textStyle(style, color(style.color))}>${esc(label)}</text>`;
    }).join('');
  }
  function shadow(style, box, radius) {
    if (style.boxShadow === 'none') return '';
    return split(style.boxShadow).filter(x => !x.includes('inset')).map(part => {
      const match = part.match(/^(rgba?\([^)]*\)|[^ ]+)\s+(.+)$/);
      if (!match) return '';
      const values = match[2].match(/-?[\d.]+px/g)?.map(parseFloat) || [];
      const [dx = 0, dy = 0, blur = 0, spread = 0] = values;
      const fid = id('shadow');
      defs.push(`<filter id="${fid}" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="${num(blur / 2)}"/></filter>`);
      return rect({ x: box.x + dx - spread, y: box.y + dy - spread, width: Math.max(0, box.width + spread * 2), height: Math.max(0, box.height + spread * 2) }, radius, color(match[1]), `filter="url(#${fid})"`);
    }).join('');
  }
  async function nativeSVG(el, box) {
    const clone = el.cloneNode(true);
    const source = [el, ...el.querySelectorAll('*')], targets = [clone, ...clone.querySelectorAll('*')];
    const ids = new Map();
    for (const target of targets) if (target.id) { ids.set(target.id, id('icon')); target.id = ids.get(target.id); }
    source.forEach((node, i) => {
      const style = getComputedStyle(node), target = targets[i];
      target.removeAttribute('class'); target.removeAttribute('style');
      for (const name of ['fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'fill-rule', 'opacity', 'font-size', 'font-family', 'font-weight']) {
        const value = style.getPropertyValue(name);
        if (value && !value.includes('url(')) target.setAttribute(name, ['fill', 'stroke'].includes(name) ? color(value) : value);
      }
      for (const attr of [...target.attributes]) {
        let value = attr.value;
        for (const [old, next] of ids) value = value.replaceAll(`url(#${old})`, `url(#${next})`).replaceAll(`#${old}`, `#${next}`);
        target.setAttribute(attr.name, value);
      }
    });
    for (const node of clone.querySelectorAll('image')) {
      const href = node.getAttribute('href') || node.getAttribute('xlink:href');
      if (href) { node.removeAttribute('xlink:href'); node.setAttribute('href', await imageURI(href)); }
    }
    clone.setAttribute('x', num(box.x)); clone.setAttribute('y', num(box.y));
    clone.setAttribute('width', num(box.width)); clone.setAttribute('height', num(box.height));
    clone.setAttribute('xmlns', NS);
    return new XMLSerializer().serializeToString(clone);
  }
  async function walk(el) {
    if (!(el instanceof Element)) return '';
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0 || ['SCRIPT', 'STYLE', 'LINK', 'NOSCRIPT'].includes(el.tagName)) return '';
    const box = el.getBoundingClientRect();
    if (!box.width || !box.height || box.y >= height || box.x >= width || box.bottom <= 0 || box.right <= 0) return '';
    const radius = Math.min(parseFloat(style.borderTopLeftRadius) || 0, box.width / 2, box.height / 2);
    if (el instanceof SVGElement) return nativeSVG(el, box);
    let result = shadow(style, box, radius);
    const fill = color(style.backgroundColor);
    if (fill !== 'rgba(0,0,0,0)') result += rect(box, radius, fill);
    const bg = gradient(style.backgroundImage);
    if (bg) result += rect(box, radius, bg);
    const border = parseFloat(style.borderTopWidth);
    if (border && style.borderTopStyle !== 'none') result += rect(box, radius, 'none', `stroke="${color(style.borderTopColor)}" stroke-width="${border}"`);
    let children = '';
    if (el instanceof HTMLImageElement && el.naturalWidth) {
      children = `<image x="${num(box.x)}" y="${num(box.y)}" width="${num(box.width)}" height="${num(box.height)}" href="${esc(await imageURI(el.currentSrc || el.src))}" preserveAspectRatio="${style.objectFit === 'cover' ? 'xMidYMid slice' : style.objectFit === 'contain' ? 'xMidYMid meet' : 'none'}"/>`;
    } else if (el instanceof HTMLVideoElement && el.readyState >= 2) {
      const frame = document.createElement('canvas'); frame.width = el.videoWidth; frame.height = el.videoHeight; frame.getContext('2d').drawImage(el, 0, 0);
      children = `<image x="${num(box.x)}" y="${num(box.y)}" width="${num(box.width)}" height="${num(box.height)}" href="${frame.toDataURL('image/png')}" preserveAspectRatio="xMidYMid slice"/>`;
    } else if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
      const value = el instanceof HTMLSelectElement ? el.selectedOptions[0]?.text : el.value || el.placeholder;
      if (value) children = `<text x="${num(box.x + parseFloat(style.paddingLeft) + border)}" y="${num(box.y + (el instanceof HTMLTextAreaElement ? parseFloat(style.paddingTop) + parseFloat(style.fontSize) : box.height / 2 + parseFloat(style.fontSize) * .35))}" ${textStyle(style, color(el.value ? style.color : '#7A6658'))}>${esc(value)}</text>`;
    } else {
      // Stable z-index order places modal overlays and floating controls above content.
      const nodes = [...el.childNodes].map((node, i) => ({ node, i, z: node instanceof Element ? parseInt(getComputedStyle(node).zIndex) || 0 : 0 })).sort((a, b) => a.z - b.z || a.i - b.i);
      for (const { node } of nodes) children += node.nodeType === Node.TEXT_NODE ? text(node, style) : await walk(node);
    }
    if (['hidden', 'clip', 'auto', 'scroll'].includes(style.overflow) || el instanceof HTMLImageElement) {
      const cid = id('clip'); defs.push(`<clipPath id="${cid}">${rect(box, radius, 'white')}</clipPath>`);
      children = `<g clip-path="url(#${cid})">${children}</g>`;
    }
    result += children;
    return style.opacity === '1' ? result : `<g opacity="${style.opacity}">${result}</g>`;
  }
  const geometry = await walk(root);
  const embeddedFonts = await fetch('/__svg-fonts').then(r => r.text());
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="${NS}" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc"><title id="title">YEMUNNAI — ${esc(title)}</title><desc id="desc">Static export of the current React interface with local sample data. Vector layout, editable text, embedded photos. Video is represented by one frame.</desc><defs>${defs.join('')}</defs><style>${embeddedFonts}</style><rect width="100%" height="100%" fill="white"/>${geometry}</svg>\n`;
}
