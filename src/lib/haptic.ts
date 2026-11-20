/**
 * Web Haptic Vibration Feedback utilities.
 * Safely degrades on unsupported devices/browsers.
 */

export function hapticTap(durationMs = 12): void {
  if (typeof window !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(durationMs);
    } catch {
      // Ignore vibration errors if restricted by browser policy
    }
  }
}

export function hapticSuccess(): void {
  if (typeof window !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate([15, 60, 25]);
    } catch {
      // Ignore
    }
  }
}

export function hapticWarning(): void {
  if (typeof window !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate([40, 40, 40]);
    } catch {
      // Ignore
    }
  }
}
