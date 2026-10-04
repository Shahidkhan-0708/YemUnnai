import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const directory = 'public/images', output = path.join(directory, 'optimized');
await fs.mkdir(output, { recursive: true });
const manifest = {};
let originalBytes = 0, cardBytes = 0;
async function optimize(buffer, name, source) {
  const hash = createHash('sha256').update(buffer).digest('hex').slice(0, 10);
  const metadata = await sharp(buffer).metadata();
  const widths = [...new Set((name === 'NewLogo.png' ? [128] : name.startsWith('shop_') ? [96, 192] : [320, 640, 1280]).map(width => Math.min(width, metadata.width)))];
  const variants = [];
  for (const width of widths) {
    const file = `${path.parse(name).name}-${hash}-${width}.webp`;
    const image = await sharp(buffer).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: name === 'NewLogo.png' ? 92 : 82, effort: 6 }).toBuffer({ resolveWithObject: true });
    await fs.writeFile(path.join(output, file), image.data);
    variants.push({ src: `/images/optimized/${file}`, width: image.info.width });
    if (width === widths[0]) cardBytes += image.data.length;
  }
  originalBytes += buffer.length;
  manifest[source] = { width: metadata.width, height: metadata.height, variants };
}
for (const name of (await fs.readdir(directory)).sort()) {
  if (!/^(item_|shop_).*\.(png|jpe?g)$/i.test(name) && name !== 'NewLogo.png') continue;
  await optimize(await fs.readFile(path.join(directory, name)), name, `/images/${name}`);
}
for (const source of JSON.parse(await fs.readFile('scripts/catalog-remote-images.json', 'utf8'))) {
  const response = await fetch(source, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw Error(`Cannot optimize the published photo: ${response.status}`);
  const hash = createHash('sha256').update(source).digest('hex').slice(0, 10);
  await optimize(Buffer.from(await response.arrayBuffer()), `uploaded-${hash}.png`, source);
}
// The same logo artwork is used by the SVG header, which embeds a large raster.
manifest['/images/NewLogo.svg'] = manifest['/images/NewLogo.png'];
await sharp(path.join(directory, 'NewLogo.png')).resize(64, 64).png({ compressionLevel: 9 }).toFile('public/icons/favicon-64.png');
await fs.writeFile('src/lib/catalog-images.json', JSON.stringify(manifest));
console.log(JSON.stringify({ images: Object.keys(manifest).length - 1, originalBytes, cardBytes, reductionPercent: Math.round(100 * (1 - cardBytes / originalBytes)) }));
