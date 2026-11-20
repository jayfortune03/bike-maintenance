import { describe, expect, it } from 'vitest';
import { getTabDragPosition, getTabSwipeTarget } from '../src/domain/tab-swipe';

describe('tab swipe', () => {
  it('reveals the neighboring page while a horizontal drag is still in progress', () => {
    // Given a 375px pager resting on the second tab
    const drag = { startPosition: 1, count: 4, translationX: -25, width: 375 };

    // When the finger moves only 25px
    const position = getTabDragPosition(drag);

    // Then the next real page is already partially revealed
    expect(position).toBeCloseTo(1 + 25 / 375);
  });

  it('keeps partial reveals inside the first and last tab bounds', () => {
    // Given drags pointing beyond each end and more than one page from the middle
    const firstTabDrag = { startPosition: 0, count: 4, translationX: 50, width: 375 };
    const lastTabDrag = { startPosition: 3, count: 4, translationX: -50, width: 375 };
    const middleTabDrag = { startPosition: 1, count: 4, translationX: -750, width: 375 };

    // When their visual positions are calculated
    const firstPosition = getTabDragPosition(firstTabDrag);
    const lastPosition = getTabDragPosition(lastTabDrag);
    const middlePosition = getTabDragPosition(middleTabDrag);

    // Then no drag wraps, exposes empty canvas, or skips over a neighbor
    expect(firstPosition).toBe(0);
    expect(lastPosition).toBe(3);
    expect(middlePosition).toBe(2);
  });

  it('commits exactly one tab when release crosses the distance threshold', () => {
    // Given releases at the 64px cap and below the 18% threshold on a narrow pager
    const cappedRelease = { index: 1, count: 4, translationX: -64, translationY: 0, velocityX: 0, width: 375 };
    const fractionalRelease = { index: 2, count: 4, translationX: 58, translationY: 0, velocityX: 0, width: 320 };

    // When the destinations are resolved
    const next = getTabSwipeTarget(cappedRelease);
    const previous = getTabSwipeTarget(fractionalRelease);

    // Then each release advances only one tab
    expect(next).toBe(2);
    expect(previous).toBe(1);
  });

  it('commits a short deliberate flick using horizontal velocity', () => {
    // Given a short drag with a deliberate leftward release velocity
    const release = { index: 1, count: 4, translationX: -25, translationY: 4, velocityX: -600, width: 375 };

    // When the destination is resolved
    const target = getTabSwipeTarget(release);

    // Then the pager advances one tab
    expect(target).toBe(2);
  });

  it('cancels a short slow drag', () => {
    // Given a drag below both distance and velocity thresholds
    const release = { index: 1, count: 4, translationX: -50, translationY: 2, velocityX: -300, width: 375 };

    // When the destination is resolved
    const target = getTabSwipeTarget(release);

    // Then the committed tab does not change
    expect(target).toBeNull();
  });

  it('rejects vertical releases and never wraps at tab boundaries', () => {
    // Given one vertical release and deliberate swipes beyond both pager edges
    const verticalRelease = { index: 1, count: 4, translationX: -100, translationY: 25, velocityX: -700, width: 375 };
    const beforeFirst = { index: 0, count: 4, translationX: 100, translationY: 0, velocityX: 0, width: 375 };
    const afterLast = { index: 3, count: 4, translationX: -100, translationY: 0, velocityX: 0, width: 375 };

    // When each destination is resolved
    const targets = [
      getTabSwipeTarget(verticalRelease),
      getTabSwipeTarget(beforeFirst),
      getTabSwipeTarget(afterLast),
    ];

    // Then every invalid release stays on its committed tab
    expect(targets).toEqual([null, null, null]);
  });
});
