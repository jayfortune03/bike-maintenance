import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

it('ships a 1024px opaque App Store icon and separate transparent adaptive foreground', () => {
  for (const file of ['assets/branding/icon.png', 'ios/MotorCare/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png']) {
    const png = readFileSync(file);
    expect(png.subarray(1, 4).toString()).toBe('PNG');
    expect(png.readUInt32BE(16)).toBe(1024);
    expect(png.readUInt32BE(20)).toBe(1024);
    expect(png[25]).toBe(2); // PNG truecolor RGB, no alpha channel (App Store requirement).
  }
  const foreground = readFileSync('assets/branding/adaptive-foreground.png');
  expect(foreground[25]).toBe(6);
  const config = JSON.parse(readFileSync('app.json', 'utf8')).expo;
  expect(config.icon).toBe('./assets/branding/icon.png');
  expect(config.plugins.some((plugin: unknown) => Array.isArray(plugin) && plugin[0] === 'expo-splash-screen')).toBe(true);
});
