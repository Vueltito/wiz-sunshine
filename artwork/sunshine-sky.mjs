// Source for the pre-rendered decorative sky. Not executed by the published page.
export function paintSky(canvas) {
  const context = canvas.getContext('2d');
  if (!context) return;
  const width = 650, height = 230;
  canvas.width = width;
  canvas.height = height;
  const frame = context.createImageData(width, height);
  let seed = 29062026;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const gaussian = (x, y, cx, cy, sx, sy) => Math.exp(-(((x - cx) ** 2) / sx + ((y - cy) ** 2) / sy));
  const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const nx = x / width, ny = y / height;
      const fade = Math.max(0, 1 - ny) ** 1.35;
      const gold = gaussian(nx, ny, .24, .13, .12, .45);
      const pink = gaussian(nx, ny, .02, .1, .04, .3);
      const violet = gaussian(nx, ny, .87, .08, .12, .3);
      const blue = gaussian(nx, ny, .69, .2, .025, .19);
      const grain = (random() - .5) * 48 + (bayer[(y % 4) * 4 + (x % 4)] - 7.5) * 1.1;
      const i = (y * width + x) * 4;
      frame.data[i] = 250 - (gold * 1 + pink * 5 + violet * 58 + blue * 82) * fade + grain;
      frame.data[i + 1] = 249 - (gold * 42 + pink * 69 + violet * 77 + blue * 22) * fade + grain;
      frame.data[i + 2] = 245 - (gold * 137 + pink * 35 + violet * 5 + blue * 1) * fade + grain;
      frame.data[i + 3] = Math.round(255 * Math.min(1, fade * 1.8));
    }
  }
  context.putImageData(frame, 0, 0);
}
