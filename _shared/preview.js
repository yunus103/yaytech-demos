// View tracking for lead-finder: one "open" beacon per page load, an "end" beacon with visible time and
// scroll depth whenever the tab is hidden, and an "action" beacon for WhatsApp / call / Maps / Instagram clicks.
// Open any demo once with ?me=1 to stop counting this browser on every demo (?me=0 undoes it).
(() => {
  const ENDPOINT = "https://lead-finder-ecru-xi.vercel.app/api/demo-view";
  const ME_COOKIE = "yt_me";

  if (!location.hostname.endsWith(".yaytechstudio.com") || navigator.webdriver) return;

  const url = new URL(location.href);
  const me = url.searchParams.get("me");
  if (me !== null) {
    // Set on the parent domain so one visit covers every demo subdomain.
    const maxAge = me === "0" ? 0 : 60 * 60 * 24 * 365 * 5;
    document.cookie = `${ME_COOKIE}=1; domain=.yaytechstudio.com; path=/; max-age=${maxAge}; secure; samesite=lax`;
    url.searchParams.delete("me");
    history.replaceState(null, "", url.pathname + url.search + url.hash);
  }
  if (document.cookie.split("; ").includes(`${ME_COOKIE}=1`)) return;

  const id = crypto.randomUUID();
  let visitor = null;
  try {
    visitor = localStorage.getItem("yt_visitor");
    if (!visitor) localStorage.setItem("yt_visitor", (visitor = crypto.randomUUID()));
  } catch {}

  // text/plain keeps the request "simple": no CORS preflight, and sendBeacon survives tab closes.
  const send = data =>
    navigator.sendBeacon(ENDPOINT, new Blob([JSON.stringify({ id, ...data })], { type: "text/plain" }));

  let referrer = "";
  try { referrer = document.referrer ? new URL(document.referrer).hostname : ""; } catch {}
  send({ t: "open", v: visitor, r: referrer });

  let visibleMs = 0;
  let visibleSince = document.visibilityState === "visible" ? Date.now() : null;
  let maxScroll = 0;
  const trackScroll = () => {
    const height = document.documentElement.scrollHeight;
    const pct = height > 0 ? Math.min(100, Math.round(((scrollY + innerHeight) / height) * 100)) : 100;
    if (pct > maxScroll) maxScroll = pct;
  };
  addEventListener("scroll", trackScroll, { passive: true });
  addEventListener("load", trackScroll);

  // "hidden" also fires on tab close and app switch on mobile, where pagehide/unload are unreliable.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      if (visibleSince !== null) visibleMs += Date.now() - visibleSince;
      visibleSince = null;
      send({ t: "end", d: Math.round(visibleMs / 1000), s: maxScroll });
    } else {
      visibleSince = Date.now();
    }
  });

  const ACTIONS = [
    [/^https:\/\/wa\.me\//, "whatsapp"],
    [/^tel:/, "call"],
    [/google\.[a-z.]+\/maps/, "maps"],
    [/instagram\.com/, "instagram"],
  ];
  document.addEventListener("click", e => {
    const link = e.target instanceof Element ? e.target.closest("a[href]") : null;
    const hit = link && ACTIONS.find(([re]) => re.test(link.href));
    if (hit) send({ t: "action", a: hit[1] });
  }, true);
})();
