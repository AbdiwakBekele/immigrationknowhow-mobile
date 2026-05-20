import { Platform } from 'react-native';

let applied = false;

/** Ensures Expo web uses device-width layout (fixes desktop-sized viewport on phones). */
export function ensureWebViewport(): void {
  if (Platform.OS !== 'web' || applied || typeof document === 'undefined') {
    return;
  }
  applied = true;

  let meta = document.querySelector('meta[name="viewport"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'viewport');
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', 'width=device-width, initial-scale=1, viewport-fit=cover');

  if (!document.getElementById('ikh-mobile-global-style')) {
    const style = document.createElement('style');
    style.id = 'ikh-mobile-global-style';
    style.textContent = `
      html, body, #root { height: 100%; width: 100%; margin: 0; }
      body { overflow-x: hidden; -webkit-text-size-adjust: 100%; }
      #root { display: flex; flex-direction: column; min-height: 100%; }
    `;
    document.head.appendChild(style);
  }
}
