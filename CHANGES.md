# KRIVE FASHIONS — premium upgrade: what changed

## Run it
```bash
npm install          # nothing new to install; same dependencies as before
npm run dev          # storefront: /   admin: /admin
npm run lint         # 0 problems (it was 15 before)
```
Backend: `cd backend && mvn spring-boot:run` (Java 21 + Maven), then `npm run dev`. See `backend/README.md`.
Without the backend the uploader says so plainly and offers an honest "save in browser" fallback.

## Files
**Changed (4):** `src/App.jsx`, `src/admin/AdminDashboard.jsx`, `src/main.jsx`, `vite.config.js` (dev proxy to :8080).
**Untouched:** `App.css`, `index.css`, `AdminDashboard.css`, `package.json`, `public/`, all product data and `money()`.
**New:** `src/hooks/*`, `src/components/*`, `src/styles/{tokens,premium}.css`, `src/admin/upload/*`, `src/admin/admin-premium.css`, `backend/` (a complete Spring Boot 4.1 API, see below).
To undo the visual layer entirely: delete the two `premium` CSS imports (`main.jsx`, top of `AdminDashboard.jsx`).
New files use LF line endings; your originals were CRLF.

## Storefront
- Opening loader (waits for the hero image + fonts, 1.5 s minimum, 3.5 s cap), Women/Men page transition.
- `ProductCard`: 3D mouse tilt + glare via CSS variables (no React re-render per mouse move).
- `ProductCarousel`: scroll-snap, prev/next arrows, mouse drag with momentum, touch swipe, keyboard arrows, progress bar.
- Animated category cards, hero parallax, sticky glass header, button light-sweep, cart slide-in, auto-dismissing toast.
- Honours `prefers-reduced-motion`; tilt is off on touch devices.

## 3D uploader (`src/admin/upload/`)
Pure CSS 3D, no Three.js. A tilted platform with tick marks, an orbiting comet arc that passes behind *and in front of* the
rotating product plaque, and a progress arc whose angle is the real `bytes sent / total`. States: idle, drag-over, uploading,
success (ripple + sparks + check), error, existing image. Drag-and-drop, click, keyboard; type/size validation; cancel, retry,
replace, remove. Uses `XMLHttpRequest` because `fetch` cannot report upload progress. Save is blocked while uploading.
The result is written to the same `image` string as before, so product data and the manual path/URL field still work.

## Admin
Premium sidebar (gold active indicator), count-up stats, tilting clickable stat cards, Table/Gallery toggle, animated page
changes, 3D modal enter/exit (Esc and backdrop are blocked mid-upload), body scroll lock.

## Bugs fixed (all were in your original)
| Bug | Fix |
|---|---|
| Hooks called after an early `return` in `App` (10 lint errors) | `App` is now a thin router; storefront is `<Storefront />` |
| "Bag" wrapped to a second row (4 items in a 3-column grid) | header grid corrected |
| Men's filter chips showed the women's categories | per-gender filter lists |
| "Dresses" nav link produced an empty grid | now shows all |
| Cart quantity matched `item.id`, not the cart line | matches `cartId` |
| Storefront toast never disappeared | 3.2 s timer |
| Admin banner headline dark-on-dark; floral decorations behind the admin | storefront `main` styles were leaking into the admin `<main>`; scoped out |
| Admin table thumbnails 220 px wide (rows up to 367 px tall) | same leak (`.product-image`); scoped out |
| Men header was a light ivory bar | dark charcoal header with light text |
| Two `set-state-in-effect` errors in admin | rewritten without effects |

## Not done / know before you ship
- **Storefront and admin still do not read the new API.** The backend (`backend/`) is complete and the 3D uploader already uses
  it, but the storefront still reads its hard-coded list and the admin still stores products in `localStorage`, so a product
  added in admin does not appear in the shop yet. Wiring both to `GET /api/products` and `/api/admin/*` is the next step, plus a
  login screen for the admin when the backend runs in `prod` mode (the default `dev` profile leaves the admin API open).
- **The backend was written without Maven, network or Spring jars.** It compiles against API stand-ins and its 41 unit tests and
  18 service-level checks were executed, but the real Spring context, Hibernate queries, Spring Security and `ApiSmokeTest`
  have not been run. Run `mvn test` in `backend/` first. Details in `backend/README.md`.
- Tested in Chromium only (desktop, 390 px phone, 820 px tablet, reduced-motion, real touch events). Not tested in Safari or
  Firefox. The progress arc falls back to stepping instead of easing where CSS `@property` is unsupported.
- Fonts: kept Playfair Display / DM Sans. I could not preview web fonts offline, so I did not swap in a new typeface.
- `public/images` is ~17 MB (several 2 MB+ PNGs with double extensions like `.jpg.png`). Worth compressing before launch.
- Removing an image in the admin only detaches it; the backend offers `DELETE /api/uploads/{name}` but the dashboard does not call it yet.

## Backend (`backend/`)
Spring Boot 4.1 · Java 21 · JPA · Spring Security · H2 (dev) / PostgreSQL (prod) · Docker. Public catalogue + checkout with
row-locked stock control, admin API (products, orders, stats), secure image upload (type checked from bytes, UUID names),
uniform JSON errors, tests, `api.http`, `docker-compose.yml`. Seeds the same 12 products the storefront shows.
