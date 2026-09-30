(() => {
  const KEY = "yt-preview-badge-closed";
  try {
    if (sessionStorage.getItem(KEY)) return;
  } catch {}

  const style = document.createElement("style");
  style.textContent = `
    .yt-badge {
      /* Templates with a fixed bottom bar set --yt-badge-offset so the badge clears it. */
      position: fixed; left: 12px; bottom: calc(12px + var(--yt-badge-offset, 0px) + env(safe-area-inset-bottom));
      z-index: 2147483000; display: flex; align-items: center; gap: 2px;
      padding: 4px 4px 4px 12px; border-radius: 999px;
      background: rgba(20, 20, 20, .78); color: #fff;
      -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px);
      font: 500 12px/1.2 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      box-shadow: 0 2px 10px rgba(0, 0, 0, .18);
    }
    .yt-badge a { color: inherit; text-decoration: none; white-space: nowrap; }
    .yt-badge a:hover { text-decoration: underline; }
    .yt-badge button {
      width: 24px; height: 24px; border: 0; border-radius: 50%; padding: 0;
      background: transparent; color: inherit; font-size: 16px; line-height: 1;
      cursor: pointer; opacity: .7;
    }
    .yt-badge button:hover { opacity: 1; }
  `;

  const badge = document.createElement("div");
  badge.className = "yt-badge";
  badge.innerHTML = `
    <a href="https://yaytechstudio.com" target="_blank" rel="noopener">Tasarım önizlemesi · YayTech Studio</a>
    <button type="button" aria-label="Kapat">×</button>
  `;
  badge.querySelector("button").addEventListener("click", () => {
    badge.remove();
    try {
      sessionStorage.setItem(KEY, "1");
    } catch {}
  });

  document.head.appendChild(style);
  document.body.appendChild(badge);
})();
