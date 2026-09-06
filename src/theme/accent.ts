export function accentColors(accent: string, dark: boolean) {
  const hex = /^#[0-9a-f]{6}$/i.test(accent) ? accent : '#2563EB';
  const rgb = [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16));
  const mix = (target: number, amount: number) => rgb.map((value) => Math.round(value + (target - value) * amount));
  const luminance = (channels: number[]) => channels.reduce((sum, value, index) => {
    const channel = value / 255;
    return sum + (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4) * [0.2126, 0.7152, 0.0722][index];
  }, 0);
  const encode = (channels: number[]) => '#' + channels.map((value) => value.toString(16).padStart(2, '0')).join('');
  let primary = rgb;
  // Keep accents readable as text and give filled buttons a contrasting label.
  for (let amount = 0; amount <= 1; amount += 0.05) {
    primary = mix(dark ? 255 : 0, amount);
    if (dark ? luminance(primary) >= 0.5 : luminance(primary) <= 0.18) break;
  }
  return {
    primary: encode(primary),
    onPrimary: dark ? '#111827' : '#FFFFFF',
    primaryContainer: encode(mix(dark ? 0 : 255, dark ? 0.8 : 0.92)),
    onPrimaryContainer: dark ? encode(mix(255, 0.8)) : encode(mix(0, 0.65)),
  };
}
