# Deploying Newsroom to Cloudflare Workers

Newsroom runs on Cloudflare Workers via the
[OpenNext adapter](https://opennext.js.org/cloudflare)
(`@opennextjs/cloudflare`). The adapter is pinned to **1.18.1** — the newest
release whose Next.js peer range includes this app's Next 16.1.6 (newer
adapter releases require Next ≥ 16.2.3 / ≥ 16.4.1). Do not float it with a
caret range.

## Prereqs

- A Cloudflare account.
- Wrangler authenticated to that account. Either run `npx wrangler login`
  (browser OAuth), or set `CLOUDFLARE_API_TOKEN` (an API token with
  **Workers Scripts: Edit** permission) plus `CLOUDFLARE_ACCOUNT_ID`.
- Node.js 20+ and `python3` (the `prebuild` icon script needs python3;
  a local Mac is fine, CI needs python3 available).
- All env vars from `.env.example` (see "Secrets" below).

## One-time setup: secrets

Runtime secrets are **not** committed and do not go in `wrangler.toml`.
Set each one with Wrangler (you'll be prompted to paste the value):

```bash
npx wrangler secret put DEEPSEEK_API_KEY
npx wrangler secret put AUTH_SECRET
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put EXTENSION_API_KEY
```

Or set them in the Cloudflare dashboard: Workers & Pages → newsroom →
Settings → Variables → Secrets.

`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are
**build-time** vars — Next.js inlines them into the bundle. They must be
present in the environment when you run the build, e.g. via a `.env.local`
file or shell exports. They are not secrets (the anon key is safe to expose;
the app gates sign-in through the `allowed_users` table).

## Deploy

```bash
npm install
npm run deploy
```

That runs `npm run build:worker` (icon generation + `opennextjs-cloudflare
build`, which runs `next build` behind the scenes) and then
`opennextjs-cloudflare deploy`. The worker is named `newsroom` and gets a
`https://newsroom.<your-subdomain>.workers.dev` URL. Point a custom domain
at it in the Cloudflare dashboard if you want one.

## Preview locally (Workers runtime)

```bash
npm run preview:worker
```

This builds and serves the app in `workerd`, the same runtime production
uses. Plain `npm run dev` still works for day-to-day development, but it
runs in Node.js, which is a different runtime.

## Install the PWA on your phone

1. Open the deployed `workers.dev` (or custom-domain) URL in **Safari** on
   the iPhone.
2. Tap **Share → Add to Home Screen**.
3. The Newsroom icon appears on the home screen and opens in standalone
   (full-screen, no browser chrome) mode.

## Notes

- `next.config.ts` deliberately has no `output: "standalone"` — that output
  is for Docker/Node hosting and conflicts with the adapter build.
- The auth boundary lives in `src/middleware.ts`, not Next 16's `proxy.ts`:
  `proxy` is Node.js-only and OpenNext does not support it. `middleware.ts`
  is deprecated in Next 16 but still works on the Edge runtime; revisit when
  OpenNext supports Node proxy.
- `.open-next/` and `.wrangler/` are build artifacts, gitignored.
- The free Workers plan caps bundles at 3 MiB compressed; if a deploy
  complains about size, the Workers Paid plan ($5/mo) raises it to 10 MiB.
