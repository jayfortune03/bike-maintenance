export const TAB_SWIPE = {
  activationDistance: 10,
  verticalFailureDistance: 12,
  verticalCommitLimit: 24,
  commitDistance: 64,
  commitFraction: 0.18,
  commitVelocity: 500,
} as const;

type TabDrag = {
  readonly startPosition: number;
  readonly count: number;
  readonly translationX: number;
  readonly width: number;
};

type TabRelease = {
  readonly index: number;
  readonly count: number;
  readonly translationX: number;
  readonly translationY: number;
  readonly velocityX: number;
  readonly width: number;
};

export function getTabDragPosition({ startPosition, count, translationX, width }: TabDrag): number {
  'worklet';
  const previous = Math.max(0, Math.ceil(startPosition) - 1);
  const next = Math.min(count - 1, Math.floor(startPosition) + 1);
  return Math.min(next, Math.max(previous, startPosition - translationX / width));
}

export function getTabSwipeTarget({ index, count, translationX, translationY, velocityX, width }: TabRelease): number | null {
  'worklet';
  if (Math.abs(translationY) > TAB_SWIPE.verticalCommitLimit) return null;

  const commitDistance = Math.min(TAB_SWIPE.commitDistance, width * TAB_SWIPE.commitFraction);
  const hasDistance = Math.abs(translationX) >= commitDistance;
  const hasVelocity = Math.abs(velocityX) >= TAB_SWIPE.commitVelocity
    && Math.abs(translationX) >= TAB_SWIPE.activationDistance;
  if (!hasDistance && !hasVelocity) return null;

  const direction = hasVelocity ? velocityX : translationX;
  const target = index + (direction < 0 ? 1 : -1);
  return target >= 0 && target < count ? target : null;
}
