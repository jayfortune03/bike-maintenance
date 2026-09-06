import { expect, it } from 'vitest';
import { getTabSwipeTarget } from '../src/domain/tab-swipe';

it('moves one tab for deliberate horizontal swipes without wrapping', () => {
  for (let index = 0; index < 4; index++) {
    expect(getTabSwipeTarget(index, 4, -64, 0)).toBe(index === 3 ? null : index + 1);
    expect(getTabSwipeTarget(index, 4, 64, 0)).toBe(index === 0 ? null : index - 1);
  }
  expect(getTabSwipeTarget(1, 4, -500, 24)).toBe(2);
  expect(getTabSwipeTarget(1, 4, 0, 0)).toBeNull();
  expect(getTabSwipeTarget(1, 4, -63, 0)).toBeNull();
  expect(getTabSwipeTarget(1, 4, 63, 0)).toBeNull();
  expect(getTabSwipeTarget(1, 4, -100, 25)).toBeNull();
  expect(getTabSwipeTarget(1, 4, 100, -25)).toBeNull();
  expect(getTabSwipeTarget(0, 1, -100, 0)).toBeNull();
});
