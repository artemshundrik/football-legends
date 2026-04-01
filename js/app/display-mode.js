export function applyDisplayModeClass() {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  document.documentElement.classList.toggle('app-standalone', isStandalone);
  document.documentElement.classList.toggle('app-browser', !isStandalone);
  document.body.classList.toggle('app-standalone', isStandalone);
  document.body.classList.toggle('app-browser', !isStandalone);
}

export function initDisplayModeClass() {
  applyDisplayModeClass();
  window.matchMedia('(display-mode: standalone)').addEventListener?.('change', applyDisplayModeClass);
  window.addEventListener('pageshow', applyDisplayModeClass);
}
