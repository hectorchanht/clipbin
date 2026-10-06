## 📋 Clipbin

Your private clipboard on cloud or local — for free, forever.

Paste text **or images** and save them **locally** (browser localStorage, works fully offline), or **get a magic link by email** and sync to the Cloudflare cloud so you can access your clips on any device.

## Features

- 📋 Save from clipboard (`navigator.clipboard`) or from typed text
- 🖼️ Image support — paste, drag & drop, or upload; private per-user R2 bucket in the cloud, localStorage when logged out
- 💾 Local-only mode with zero setup — works offline
- ☁️ Cloud sync on Cloudflare (D1 + R2 + Pages Functions) — passwordless magic-link login, no passwords
- ✏️ Edit saved entries (toggle with the green edit button in the toolbar)
- 📄 Pagination with page-size control
- 🌗 Dark mode by default (follows system)

## How to run

```bash
npm install
npm run dev   # or: npm start
```

Open [http://localhost:3000](http://localhost:3000).

### Cloud mode (Cloudflare)

The app works out of the box with no credentials (local-only mode). Cloud sync runs on Cloudflare Pages Functions + D1 + R2, deployed automatically with the site:

1. Create a D1 database and apply `d1/migrations/0001_init.sql` via the D1 dashboard console (Pages git integration does not auto-run migrations)
2. Create a private R2 bucket
3. In the Pages project → Settings → Functions, add bindings: D1 as `DB`, R2 as `IMAGES`
4. In Settings → Environment variables, add secret `RESEND_API_KEY` (Resend, sending access) and optional plain var `MAGIC_LINK_FROM` (e.g. `Clipbin <login@yourdomain.com>` — the domain must be verified in Resend)

Auth is passwordless: the app POSTs the email to `/api/auth/magic-link`, the Function creates a single-use 15-minute token and emails it via Resend; the SPA redeems it at `/api/auth/verify` and gets an httpOnly session cookie. Rate limits (3 per email / 10 min) are enforced in D1.

### Deploy

Deploy on [Cloudflare Pages](https://pages.cloudflare.com) with `npm run build` — `functions/` is picked up automatically. No client-side env vars needed.

## Packages used

Project bootstrapped with [Create React App](https://create-react-app.dev/) + [React 18](https://reactjs.org/)

- [Chakra UI](https://chakra-ui.com/) — UI components
- [jotai](https://github.com/pmndrs/jotai) — state management
- [Lodash](https://lodash.com/) — utilities
- [react-hook-clipboard](https://github.com/apolkingg8/react-hook-clipboard) — clipboard copy/preview
- [react-icons](https://react-icons.github.io/react-icons/) — icons

## Project structure

```
src/
  Components/        # Auth, Toolbar, ClipboardList, PaginationTool, PostFromClipboard, PostFromText
  Components/Buttons # DeleteBtn, IsEditingBtn, SaveSettingBtn
  libs/
    apiClient.js     # fetch client for /api/* (Cloudflare Pages Functions)
    fns.js           # data layer (API ↔ localStorage), useData hook, useDataLoader
    states.jsx       # jotai atoms
    useAuthSession.js# keeps the logged-in user in sync via /api/auth/session
    useClipboard.js  # local clipboard hook (copy + live preview)
functions/
  _lib.js            # shared backend helpers (auth, crypto, rate limit, Resend)
  api/auth/          # magic-link, verify, session, logout
  api/clips.js       # list + create (+ DELETE = full reset)
  api/clips/[id].js  # edit + delete one
  api/settings.js    # get + put UI settings
  api/images*.js     # list + upload + delete + private R2 file serving
d1/
  migrations/0001_init.sql  # D1 schema (apply via D1 dashboard console)
```

See [logic.md](./logic.md) for the original backend design notes.
