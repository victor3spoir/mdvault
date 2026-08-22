const { default: sharp } = await import("file:///D:/dev/projects/mdvault/mdvault/node_modules/sharp/dist/index.mjs");
const { writeFile } = await import("node:fs/promises");

const SRC = "D:/dev/projects/mdvault/brand/mdvault-logo-original.png";
const OUT_PNG = "D:/dev/projects/mdvault/brand/mdvault-logo-colorized.png";
const OUT_WEBP = "D:/dev/projects/mdvault/brand/mdvault-logo-colorized.webp";
const ROOT = "D:/dev/projects/mdvault";

const img = sharp(SRC).ensureAlpha();
const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
const { width, height, channels } = info;
console.log(width, height, channels);

// helpers
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v) => Math.max(0, Math.min(255, v));

// tone curve: push lights to white, darks to near-black
function curve(l) {
  // normalize roughly: assume useful range 60..245
  let t = (l - 60) / (245 - 60);
  t = Math.max(0, Math.min(1, t));
  // s-curve for contrast
  t = t * t * (3 - 2 * t);
  return t; // 0 = dark, 1 = white
}

// Restrained palette: near-black structure, cool gray surfaces, indigo Markdown mark.
const ink = [15, 15, 22];
const surface = [205, 205, 216];
const indigo = [99, 102, 241];

// Tight regions around the actual "M" and down arrow only.
const inMarkdownMark = (x, y) =>
  (x >= 125 && x <= 180 && y >= 135 && y <= 188) ||
  (x >= 183 && x <= 226 && y >= 145 && y <= 197);

for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const i = (y * width + x) * channels;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const l = 0.299 * r + 0.587 * g + 0.114 * b;
    const t = curve(l); // 0 dark -> 1 white
    // Darken mid-tones while preserving the original highlights and volume.
    const shaped = Math.pow(t, 1.25);
    const base = inMarkdownMark(x, y) && t < 0.58 ? indigo : ink;
    const top = inMarkdownMark(x, y) && t < 0.58 ? [220, 221, 255] : surface;
    data[i] = clamp(lerp(base[0], top[0], shaped));
    data[i + 1] = clamp(lerp(base[1], top[1], shaped));
    data[i + 2] = clamp(lerp(base[2], top[2], shaped));
  }
}

const raw = Buffer.from(data);
const png = await sharp(raw, { raw: { width, height, channels } }).png().toBuffer();
const webp = await sharp(raw, { raw: { width, height, channels } })
  .webp({ quality: 95 })
  .toBuffer();
const png192 = await sharp(png).resize(192, 192).png().toBuffer();
const png512 = await sharp(png).resize(512, 512).png().toBuffer();
const png64 = await sharp(png).resize(64, 64).png().toBuffer();

// ICO container with a PNG payload, supported by current browsers.
const icoHeader = Buffer.alloc(22);
icoHeader.writeUInt16LE(0, 0);
icoHeader.writeUInt16LE(1, 2);
icoHeader.writeUInt16LE(1, 4);
icoHeader.writeUInt8(64, 6);
icoHeader.writeUInt8(64, 7);
icoHeader.writeUInt8(0, 8);
icoHeader.writeUInt8(0, 9);
icoHeader.writeUInt16LE(1, 10);
icoHeader.writeUInt16LE(32, 12);
icoHeader.writeUInt32LE(png64.length, 14);
icoHeader.writeUInt32LE(22, 18);
const favicon = Buffer.concat([icoHeader, png64]);

const fullSizeTargets = [
  OUT_PNG,
  `${ROOT}/docs-site/public/logo.png`,
  `${ROOT}/docs-site/.output/public/logo.png`,
  `${ROOT}/docs/public/logo.png`,
  `${ROOT}/docs/dist/logo.png`,
  `${ROOT}/images/logo.png`,
  `${ROOT}/mdvault/public/logo.png`,
  `${ROOT}/mdvault/.output/public/logo.png`,
];

await Promise.all([
  ...fullSizeTargets.map((path) => writeFile(path, png)),
  writeFile(OUT_WEBP, webp),
  writeFile(`${ROOT}/mdvault/public/logo192.png`, png192),
  writeFile(`${ROOT}/mdvault/.output/public/logo192.png`, png192),
  writeFile(`${ROOT}/mdvault/public/logo512.png`, png512),
  writeFile(`${ROOT}/mdvault/.output/public/logo512.png`, png512),
  writeFile(`${ROOT}/mdvault/public/favicon.ico`, favicon),
  writeFile(`${ROOT}/mdvault/.output/public/favicon.ico`, favicon),
]);

console.log("logo assets synchronized");
