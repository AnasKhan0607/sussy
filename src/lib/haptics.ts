export function vibrate(pattern: number | number[] = 50) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

export function vibrateShort() {
  vibrate(30);
}

export function vibrateMedium() {
  vibrate(50);
}

export function vibrateLong() {
  vibrate(100);
}

export function vibratePattern() {
  vibrate([50, 30, 50, 30, 100]);
}

export function vibrateSuccess() {
  vibrate([30, 50, 80]);
}

export function vibrateDanger() {
  vibrate([100, 50, 100, 50, 100]);
}
