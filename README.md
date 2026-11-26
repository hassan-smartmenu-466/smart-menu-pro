# SMART MENU PRO

More Than a Menu. A Sales Machine.

Premium restaurant digital menu + online ordering + management dashboard.
Built with Next.js 15 (App Router), TypeScript, Tailwind CSS, and SQLite
(Node.js built-in database, zero external services required).

## Quick start

```bash
npm install
cp .env.example .env      # then edit .env (see below)
npm run build
npm start                 # http://localhost:3000
```

For development: `npm run dev`.

- Customer site: `http://localhost:3000` (English), `/ar` (Arabic RTL), `/fr` (French)
- Admin dashboard: `http://localhost:3000/admin` (login with the credentials from `.env`)
- On first run the database is created and seeded automatically with the full
  provided menu (8 categories, 73 products, exact prices).

## Environment variables (.env)

| Variable | Required | Purpose |
|---|---|---|
| `ADMIN_USERNAME` | yes | Admin dashboard login username (default `admin`) |
| `ADMIN_PASSWORD` | yes | Admin dashboard login password. CHANGE IT before going live |
| `SESSION_SECRET` | yes | Random hex string securing admin sessions: `openssl rand -hex 32` |
| `DATABASE_PATH` | no | SQLite file location (default `./data/smartmenu.db`) |
| `NEXT_PUBLIC_BASE_URL` | yes in production | Public URL, used for QR codes, sitemap, Open Graph |
| `OPENAI_API_KEY` | no | Enables natural-language AI Advisor summaries. The advisor's analysis engine works fully without it |

## Admin access setup

1. Set `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `SESSION_SECRET` in `.env`.
2. Start the app, open `/admin`, sign in.
3. Go to Settings and fill in the restaurant identity (name, logo, phone,
   WhatsApp number, address, opening hours). Nothing is invented by the app;
   everything is configured there.

**No computer? See `docs/DEPLOY-PHONE.md` — full phone-only guide (English + Arabic): GitHub + Render free tier, one-click Blueprint via the included `render.yaml`.**

## Deployment

### Free / cheap hosting paths

**Railway or Render (recommended for this app, free tier works)**
1. Push this folder to a GitHub repo.
2. Create a new service from the repo on railway.app or render.com.
3. Build command: `npm install && npm run build`. Start command: `npm start`.
4. Set the environment variables from `.env.example` in the service settings,
   including `NEXT_PUBLIC_BASE_URL=https://<your-app>.up.railway.app`.
5. Add a persistent volume mounted at `/app/data` (Railway: "Volumes";
   Render: "Disks") and set `DATABASE_PATH=/app/data/smartmenu.db`.
   Without a volume the SQLite file resets on every redeploy and orders are lost.

**VPS (full control, ~$4-6/mo, most reliable for SQLite)**
1. Copy the project to the server, `npm install`, `npm run build`.
2. Set the `.env` values, including `NEXT_PUBLIC_BASE_URL=https://your-domain.com`.
3. Run `npm start` behind your reverse proxy (nginx/caddy) or a process manager
   (`pm2 start npm -- start`).
4. The database file lives at `DATABASE_PATH`; back it up regularly (it contains all orders).

**Vercel (serverless): possible but with a caveat.** Vercel's filesystem is
ephemeral and read-only at runtime, so SQLite cannot store orders there.
Deploy to Vercel only after swapping the data layer to Supabase (below); that
swap is a single module, `src/lib/db.ts`, and the schema is at the top of the
file. The free Supabase tier is enough to start.

### Swapping SQLite for Supabase/Postgres

All database access goes through `src/lib/db.ts`. Re-implement that one module
against Supabase/Postgres with the same schema (defined at the top of the file)
and the rest of the app works unchanged. Image uploads go through
`src/app/api/upload/route.ts`; replace the local `public/uploads` write with
Supabase Storage/S3 there.

## Implemented features

Customer site
- Mobile-first premium dark design (charcoal/black + gold), smooth animations,
  sticky category tabs, search, category filtering
- Homepage: hero, special offers (real promotions only), featured/best sellers,
  menu, approved customer reviews, opening hours, delivery info, contact, footer
- Product pages: image, description, quantity, extras, special instructions,
  live price calculation, SEO metadata
- Smart upselling: owner-controlled recommendations + frequently-bought-together
  mined from real orders. Never auto-added; the customer approves each item
- Cart: add/remove/quantity, extras, instructions, subtotals, localStorage
  persistence across refresh
- Checkout: name, phone, delivery/pickup, address + instructions, notes,
  delivery zones/fees, promo codes, configurable payment methods
- Server-side order pricing (client prices are never trusted), unique order
  numbers, sold-out and unavailable products cannot be ordered
- Order confirmation with live status tracker (polls real status) and a
  WhatsApp order message (wa.me deep link with the full formatted order)
- Order tracking endpoint requires order number + phone
- Arabic (full RTL), English, French. Currency configurable (USD default)
- Reviews: star + text, owner moderation/reply/homepage featuring. No fake reviews
- SEO: metadata, Open Graph, sitemap.xml, robots.txt, Restaurant JSON-LD
- Table QR codes: `?table=N` attaches the table number to the order

Admin dashboard (secure login, session cookies)
- Overview: today's revenue/orders, average order value, customers, repeat
  customers, 7-day trend, best sellers, recent orders, new-order alerts
- Orders: live refresh (10s), status workflow
  new → accepted → preparing → ready → out for delivery → completed,
  plus reject/cancel, search, status filters, full order detail
- Menu management: add/edit/delete products, image upload, prices,
  descriptions (EN/AR/FR), availability, sold out, featured, best seller,
  extras per product, owner-controlled upsell links, cost fields;
  categories: add, translate, reorder, enable/disable, delete
- Sales analytics: daily/weekly/monthly revenue charts, orders by hour,
  best and lowest sellers, average order value
- Profit analytics: per-product costs, margins, estimated gross profit.
  Clearly labeled estimates; revenue is never shown as profit
- Promotions: percent, fixed amount, promo codes, product offers, combo deals,
  time windows, usage limits
- Customers & loyalty: phone-identified customers, repeat tracking, loyalty
  points credited on completed orders (configurable rate)
- AI Business Advisor: answers and recommendations computed from real data
  only; says when there is not enough data; optional OpenAI phrasing layer
  (only aggregated numbers leave the server, never customer data)
- QR codes: menu QR + per-table QR, downloadable PNG
- Settings: identity, logo/cover upload, contact, WhatsApp, address, hours,
  social links, delivery zones and fees, payment methods, currency, languages,
  loyalty

## Features requiring external credentials

- `OPENAI_API_KEY` (optional): natural-language advisor summaries
- Online card payments: not enabled by design. Cash on delivery / cash at
  pickup work out of the box; a real payment gateway (e.g. Stripe, Whish,
  Tap) needs credentials and a small integration in the checkout API
- WhatsApp: no credentials needed; the customer's own WhatsApp sends the
  order via wa.me. Set the restaurant WhatsApp number in Settings

## Known limitations

- The specification listed "TOTAL INITIAL PRODUCTS: 81" but the menu it
  provided contains 73 products. The app seeds exactly the 73 listed products
  at the given prices (the spec forbids inventing products). If 8 more items
  exist, add them in Menu management or share them and they will be seeded.
- Admin orders use honest 10-second polling for live updates (no fake
  "real-time"); WebSocket push can be added behind a persistent Node host.
- Product images ship as original vector placeholders (no stock photos used,
  per spec); upload real photography in Menu management.
- Customer accounts are intentionally optional; loyalty is tracked by phone.

## Testing performed

- All 73 seed products and prices verified against the provided menu
  (`npm run verify` re-checks the database)
- End-to-end API tests: order placement, extras pricing, promo codes,
  sold-out blocking, server-side pricing, order status flow, public tracking
  (wrong phone rejected), reviews moderation, recommendations, analytics,
  advisor, QR generation, admin auth (wrong password rejected, unauthenticated
  API calls rejected)
- Visual QA on 20+ screenshots: EN/AR/FR, mobile (390px) and desktop,
  homepage, menu, product, cart, checkout, confirmation, and every admin page
