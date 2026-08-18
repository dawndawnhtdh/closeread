import fs from "node:fs";

const size = 1024;
const pixels = Buffer.alloc(size * size * 3);

const color = (hex) => [
  Number.parseInt(hex.slice(1, 3), 16),
  Number.parseInt(hex.slice(3, 5), 16),
  Number.parseInt(hex.slice(5, 7), 16),
];

const setPixel = (x, y, rgb) => {
  if (x < 0 || y < 0 || x >= size || y >= size) return;
  const offset = (y * size + x) * 3;
  pixels[offset] = rgb[0];
  pixels[offset + 1] = rgb[1];
  pixels[offset + 2] = rgb[2];
};

const rect = (x, y, width, height, rgb) => {
  for (let py = y; py < y + height; py += 1) {
    for (let px = x; px < x + width; px += 1) setPixel(px, py, rgb);
  }
};

const roundedRect = (x, y, width, height, radius, rgb) => {
  for (let py = y; py < y + height; py += 1) {
    for (let px = x; px < x + width; px += 1) {
      const cx = Math.max(x + radius, Math.min(px, x + width - radius - 1));
      const cy = Math.max(y + radius, Math.min(py, y + height - radius - 1));
      if ((px - cx) ** 2 + (py - cy) ** 2 <= radius ** 2) setPixel(px, py, rgb);
    }
  }
};

const green = color("#285c4c");
const paper = color("#fffefb");
const paperSoft = color("#f4f3ef");
const ink = color("#353a35");
const red = color("#bd4a35");
const yellow = color("#f3d77d");
const divider = color("#d9ddd5");

rect(0, 0, size, size, green);
roundedRect(178, 206, 325, 610, 44, paper);
roundedRect(521, 206, 325, 610, 44, paperSoft);
rect(503, 245, 18, 532, divider);

for (const y of [342, 414, 486]) {
  roundedRect(254, y, y === 414 ? 180 : 150, 25, 12, ink);
  roundedRect(589, y, y === 486 ? 170 : 145, 25, 12, ink);
}

roundedRect(244, 576, 205, 30, 14, red);
roundedRect(589, 576, 155, 30, 14, yellow);
rect(672, 190, 108, 250, red);

for (let row = 0; row < 56; row += 1) {
  const halfWidth = Math.floor(row * 0.96);
  rect(726 - halfWidth, 438 + row, halfWidth * 2, 1, paperSoft);
}

const header = Buffer.from(`P6\n${size} ${size}\n255\n`);
fs.writeFileSync(process.argv[2], Buffer.concat([header, pixels]));
