// The grain tile for the lens: light and dark specks with alpha, drawn once.
export function grainDataUrl(size = 256): string {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  if (!ctx) return '';
  const img = ctx.createImageData(size, size);
  let seed = 1234567;
  const rnd = () => {
    seed = (seed * 48271) % 2147483647;
    return seed / 2147483647;
  };
  for (let i = 0; i < size * size; i += 1) {
    const light = rnd() > 0.5;
    const v = light ? 255 : 0;
    img.data[i * 4] = v;
    img.data[i * 4 + 1] = v;
    img.data[i * 4 + 2] = light ? 235 : 0;
    img.data[i * 4 + 3] = Math.floor(rnd() * rnd() * 255);
  }
  ctx.putImageData(img, 0, 0);
  return c.toDataURL('image/png');
}
