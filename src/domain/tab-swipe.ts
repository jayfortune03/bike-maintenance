export function getTabSwipeTarget(index: number, count: number, translationX: number, translationY: number): number | null {
  if (Math.abs(translationX) < 64 || Math.abs(translationY) > 24) return null;
  const target = index + (translationX < 0 ? 1 : -1);
  return target >= 0 && target < count ? target : null;
}
