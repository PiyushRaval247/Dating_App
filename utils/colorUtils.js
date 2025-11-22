// Utility to pick black or white text depending on background color brightness.
function hexToRgb(hex) {
  if (!hex) return null;
  const h = String(hex).replace('#', '').trim();
  if (!h) return null;
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  if (full.length !== 6) return null;
  const bigint = parseInt(full, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

export function getContrastingTextColor(bgColor) {
  if (!bgColor) return '#000000';

  const lc = String(bgColor).toLowerCase().trim();
  if (lc === 'white' || lc === '#fff' || lc === '#ffffff') return '#000000';
  if (lc === 'black' || lc === '#000' || lc === '#000000') return '#FFFFFF';

  // Try parse hex
  const rgb = hexToRgb(lc);
  if (!rgb) return '#000000';

  // Perceived luminance
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.6 ? '#000000' : '#FFFFFF';
}

export default { getContrastingTextColor };
