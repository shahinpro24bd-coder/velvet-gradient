import { getContentSnapshot, isSiteLang, SITE_LANGS, type SiteLang } from "./server";
import { PAGE_SOURCE } from "./pages.server";
import { renderPage } from "./transform";

/**
 * Builds one public page: every string and image comes from the bundled
 * content snapshot, applied onto the page markup in src/site.
 * Each supported language is rendered server-side via ?lang=xx.
 */
export async function renderSitePage(request: Request, slug: string): Promise<Response> {
  if (slug === "gallery") {
    return Response.redirect(new URL("/service.html", request.url), 301);
  }
  const source = PAGE_SOURCE[slug];
  if (!source) return new Response("Not found", { status: 404 });

  const url = new URL(request.url);
  const editMode = url.searchParams.get("edit") === "1";
  const langParam = url.searchParams.get("lang") || "";
  const cookieLang = request.headers
    .get("cookie")
    ?.match(/(?:^|;\s*)site_lang=(en|ar)(?:;|$)/)?.[1];
  const lang: SiteLang = isSiteLang(langParam)
    ? langParam
    : cookieLang && isSiteLang(cookieLang)
      ? cookieLang
      : "en";

  const snapshot = await getContentSnapshot(editMode);
  const texts = snapshot.langs[lang];

  // Fully rendered pages are memoised per slug+language+content version, so a
  // repeat request skips the HTML parse/transform entirely.
  const cacheKey = `${slug}|${lang}|${snapshot.version}|${url.pathname}`;
  if (!editMode) {
    const cached = RENDER_CACHE.get(cacheKey);
    if (cached) return htmlResponse(cached, snapshot.version, false, !isSiteLang(langParam));
  }

  const bootstrap =
    `<script>window.__SITE_LANG__=${JSON.stringify(lang)};` +
    `window.__SITE_LANGS__=${JSON.stringify([...SITE_LANGS])};` +
    `window.__SITE_EDIT__=${editMode ? "true" : "false"};</script>` +
    `<script src="/js/local-content.js" defer></script>`;


  let html = renderPage(source, {
    texts,
    images: snapshot.images,
    editMode,
    lang,
    bodyScripts: bootstrap,
  });

  const links: string[] = [
    // One font stylesheet for every page and language (same URL, so in-place
    // page swaps reuse it). It loads without blocking the first paint; font
    // files themselves only download for glyphs a page actually shows.
    '<link rel="preconnect" href="https://fonts.googleapis.com" />',
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />',
    `<link rel="stylesheet" href="${GOOGLE_FONTS_URL}" media="print" onload="this.media='all'" />`,
    `<noscript><link rel="stylesheet" href="${GOOGLE_FONTS_URL}" /></noscript>`,
    '<link rel="preload" href="/fonts/fa-solid-900.sub.woff2" as="font" type="font/woff2" crossorigin />',
    '<link rel="stylesheet" href="/perf.css" />',
    // Site-wide look (black + sand, serif); last so it overrides lama.css/home.css.
    '<link rel="stylesheet" href="/flagship.css" />',
    '<script src="/js/lib/perf.js" defer></script>',
  ];
  // SEO: self-referential hreflang alternates for every published language.
  links.push(...SITE_LANGS.map((code) => {
    const href =
      code === "en" ? url.origin + url.pathname : `${url.origin}${url.pathname}?lang=${code}`;
    return `<link rel="alternate" hreflang="${code}" href="${href}" />`;
  }));
  links.push(`<link rel="alternate" hreflang="x-default" href="${url.origin}${url.pathname}" />`);
  // Card photos set as CSS backgrounds would all download up front; hand them
  // to js/lib/perf.js, which loads each one just before it scrolls into view.
  if (!editMode) html = html.replace(LAZY_BG_RE, 'data-lazy-bg="$1"');
  // Instant page switching must start before page scripts run.
  if (!editMode) html = html.replace(/<head([^>]*)>/i, '<head$1><script src="/js/speed.js"></script>');
  const headIndex = html.lastIndexOf("</head>");
  if (headIndex !== -1) html = html.slice(0, headIndex) + links.join("") + html.slice(headIndex);

  if (!editMode) {
    if (RENDER_CACHE.size > 64) RENDER_CACHE.clear();
    RENDER_CACHE.set(cacheKey, html);
  }

  return htmlResponse(html, snapshot.version, editMode, !isSiteLang(langParam));
}

const LAZY_BG_RE = /style="background-image: url\('([^']+)'\);"/g;

const GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=Raleway:wght@300;400;500&family=Sora:wght@300;400;500;600;700&family=Manrope:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Readex+Pro:wght@300;400;500;600;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600&family=Instrument+Serif:ital@0;1&family=Teko:wght@500;600&display=swap";

/** slug|lang|version|path -> fully rendered HTML */
const RENDER_CACHE = new Map<string, string>();

function htmlResponse(html: string, version: number | string, editMode: boolean, usesCookie: boolean): Response {
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": editMode
        ? "no-store"
        : usesCookie
          ? "private, no-cache"
          : "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
      "Vary": "Cookie",
      "X-Content-Version": String(version),
    },
  });
}
