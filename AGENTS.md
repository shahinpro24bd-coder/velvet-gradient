<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

- Vercel builds use Nitro's Vercel server preset; other builds retain the platform default, because public HTML requires request-time language rendering.
- Language-switch and internal navigation URLs carry an explicit language; cookie-selected responses are private to prevent cross-language CDN/browser cache reuse.
- Public site pages live in `src/site/*.html` (English source) and `src/lib/site-content/fallback.generated.json` (per-language text keyed by text hash); edit both together so every language stays in sync.
- Site images and videos are self-hosted under `public/img` and `public/reels`, so the site works on any host without Lovable asset URLs.
- Browser-saved admin edits use versioned storage keys; bump the version when content is replaced wholesale so stale edits never re-apply.
- Public pages share one stylesheet (`public/lama.css`) and one behaviour script (`public/js/site.js`, safe to re-run after `speed.js` in-place swaps); no Bootstrap/jQuery, so page markup stays light and consistent.
- New visible text in `src/site/*.html` must reuse an existing English string exactly or be added to `fallback.generated.json` with its Arabic translation, because English is the default language and text is matched by hash.
- The homepage has its own layer, `public/home.css` + `public/js/home.js` (all classes `x-*`), loaded only by `src/site/index.html`, so homepage redesigns never restyle the other pages that share `public/lama.css`.
- The site footer markup is identical in every `src/site/*.html` page and styled only in `public/lama.css`; change all pages together so the footer never differs between pages.
- Every public page also loads `public/perf.css` and `public/js/lib/perf.js` (injected by `render.server.ts`): looping CSS animations pause while scrolling and when off-screen, and CSS-background card photos load lazily via `data-lazy-bg`; keep new decorative loops compatible with that, because painting them during scroll caused the stutter.
- Icons come from the slim kit `public/icons.css` + `public/fonts/*.sub.woff2`, generated from the full `public/icons-local.css` by `scripts/build-icons.py`; re-run it after using a new `fa-*` icon, because the full kit was ~0.5 MB of render-blocking CSS and fonts.
- Avoid animated or large `filter: blur()` and frosted-glass blur on scroll-revealed or looping elements; use soft radial gradients instead, because blurs are redrawn every frame.
- The site-wide look (colours, fonts, section fades, buttons) lives in `public/flagship.css`, loaded last on every page by `render.server.ts`; sections opt into a dark or sand role by selector there, so restyles are one-file edits that never touch `lama.css`/`home.css`.
