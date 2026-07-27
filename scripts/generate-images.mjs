import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const WIDTHS = [480, 800, 1200, 1600];
const HEIGHT_RATIO = 0.625;
const COLORS = [
  ['#24140d', '#9c4728', '#e2a553'],
  ['#1a1514', '#6f372a', '#cda15e'],
  ['#24120d', '#a14a1f', '#e6b46b'],
  ['#171414', '#73382b', '#d8a65a'],
  ['#24190f', '#775124', '#d2aa67'],
  ['#151110', '#6c3223', '#d3914f'],
  ['#121617', '#5d3424', '#d39a55'],
  ['#12191c', '#704128', '#e0a75e'],
  ['#181513', '#814521', '#e3aa61'],
  ['#29201a', '#9a6740', '#efc07a'],
  ['#251b14', '#8b562f', '#e6b16a'],
];

const escapeXml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;');

function artwork(width, height, title, palette) {
  const [dark, mid, light] = palette;
  const fontSize = Math.max(24, Math.round(width * 0.038));
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
      `<defs><linearGradient id="sky" x1="0" y1="0" x2="1" y2="1">` +
      `<stop stop-color="${dark}"/><stop offset=".58" stop-color="${mid}"/><stop offset="1" stop-color="${light}"/>` +
      `</linearGradient><radialGradient id="sun"><stop stop-color="#fff1bd"/><stop offset="1" stop-color="#e3a253"/></radialGradient></defs>` +
      `<rect width="100%" height="100%" fill="url(#sky)"/>` +
      `<circle cx="${width * .76}" cy="${height * .25}" r="${width * .065}" fill="url(#sun)" opacity=".95"/>` +
      `<path d="M0 ${height * .66} Q ${width * .22} ${height * .48} ${width * .48} ${height * .69} T ${width} ${height * .62} V ${height} H0Z" fill="#b66f38" opacity=".72"/>` +
      `<path d="M0 ${height * .79} Q ${width * .28} ${height * .58} ${width * .57} ${height * .81} T ${width} ${height * .73} V ${height} H0Z" fill="#2a1710" opacity=".85"/>` +
      `<path d="M${width * .14} ${height * .69} q${width * .08} -${height * .1} ${width * .16} 0 q-${width * .08} ${height * .025} -${width * .16} 0z" fill="#120d0b" opacity=".85"/>` +
      `<rect x="${width * .055}" y="${height * .83}" width="${width * .89}" height="${height * .11}" rx="${height * .025}" fill="#120d0b" opacity=".64"/>` +
      `<text x="50%" y="${height * .902}" fill="#fff7e8" font-family="Arial, sans-serif" font-weight="700" font-size="${fontSize}" text-anchor="middle">${escapeXml(title)}</text>` +
    `</svg>`,
  );
}

export async function generateImages(outputDirectory, packages) {
  await mkdir(outputDirectory, { recursive: true });

  await Promise.all(packages.flatMap((pkg, index) => {
    const stem = path.basename(pkg.image, path.extname(pkg.image));
    return WIDTHS.map(async (width) => {
      const height = Math.round(width * HEIGHT_RATIO);
      await sharp(artwork(width, height, pkg.name, COLORS[index % COLORS.length]))
        .webp({ quality: 82, effort: 5 })
        .toFile(path.join(outputDirectory, `${stem}-${width}.webp`));
    });
  }));

  const cover = artwork(1200, 630, 'Crown Desert Safari', COLORS[0]);
  await sharp(cover).jpeg({ quality: 88, progressive: true })
    .toFile(path.join(outputDirectory, 'og-cover.jpg'));
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const [{ packages }] = await Promise.all([import('../src/data/packages.js')]);
  await generateImages(path.resolve('dist/images'), packages);
}
