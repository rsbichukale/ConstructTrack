export function triggerHaptic(type = 'light') {
  if (typeof window === 'undefined' || !navigator.vibrate) return;

  try {
    switch (type) {
      case 'light':
        navigator.vibrate(30);
        break;
      case 'medium':
        navigator.vibrate(50);
        break;
      case 'heavy':
        navigator.vibrate(80);
        break;
      case 'success':
        navigator.vibrate([30, 50, 40]);
        break;
      case 'warning':
        navigator.vibrate([60, 60, 60]);
        break;
      default:
        navigator.vibrate(30);
    }
  } catch (err) {
    // Ignore unsupported devices silently
  }
}
