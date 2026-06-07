// lib/theme-script.ts
// Script inline no <head> — evita flash de tema errado (FOUC)
// Usar como: <script dangerouslySetInnerHTML={{ __html: themeScript }} />

export const themeScript = `
(function() {
  try {
    var saved = localStorage.getItem('sos-theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = saved || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
  } catch(e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`.trim()
