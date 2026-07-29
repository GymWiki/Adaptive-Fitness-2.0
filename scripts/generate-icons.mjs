import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const svgPath = path.join(root, 'icon.svg');
const outDir = path.join(root, '..', 'public');

mkdirSync(outDir, { recursive: true });

const sizes = [
  { size: 192, name: 'pwa-192x192.png' },
  { size: 512, name: 'pwa-512x512.png' },
  { size: 180, name: 'apple-touch-icon.png' },
];

for (const { size, name } of sizes) {
  await sharp(svgPath).resize(size, size).png().toFile(path.join(outDir, name));
  console.log('wrote', name);
}

// Maskable icon with safe-area padding (icon content within inner ~80%)
await sharp({
  create: { width: 512, height: 512, channels: 4, background: '#4f46e5' },
})
  .composite([
    { input: await sharp(svgPath).resize(400, 400).png().toBuffer(), gravity: 'center' },
  ])
  .png()
  .toFile(path.join(outDir, 'maskable-icon-512x512.png'));
console.log('wrote maskable-icon-512x512.png');

await sharp(svgPath).resize(32, 32).png().toFile(path.join(outDir, 'favicon.png'));
console.log('wrote favicon.png');
