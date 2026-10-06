## 📋 Clipbin

Your private clipboard on cloud or local — for free, forever.

Paste text **or images** and save them **locally** (browser localStorage, works fully offline), or **register an account** and sync to the cloud via Supabase so you can access your clips on any device.

## Features

- 📋 Save from clipboard (`navigator.clipboard`) or from typed text
- 🖼️ Image support — paste, drag & drop, or upload; private per-user storage bucket in the cloud, localStorage when logged out
- 💾 Local-only mode with zero setup — works offline
- ☁️ Cloud sync with Supabase (email/password, magic link, GitHub/Google/GitLab OAuth)
- ✏️ Edit saved entries (toggle with the green edit button in the toolbar)
- 📄 Pagination with page-size control
- 🌗 Dark mode by default (follows system)

## How to run

```bash
npm install
npm run dev   # or: npm start
```

Open [http://localhost:3000](http://localhost:3000).

### Cloud mode (optional)

The app works out of the box with no credentials (local-only mode). To enable cloud sync:

1. Create a project at [supabase.com](https://supabase.com)
2. Copy `.env.example` to `.env` and fill in `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY`
3. Run the migrations in `supabase/migrations/` in order in the Supabase SQL editor — they create the tables, the private image storage bucket, plus row-level-security policies so users can only read/write their own rows
4. (Optional) Enable auth providers under Authentication → Providers: Email, Google, GitHub, GitLab. For OAuth, add your site URL to the provider's allowed callback URLs

### Deploy

Deploy on [Vercel](https://vercel.com) (or any static host) with `npm run build`. Set the two `REACT_APP_*` env vars in the host's dashboard to enable cloud mode in production.

## Packages used

Project bootstrapped with [Create React App](https://create-react-app.dev/) + [React 18](https://reactjs.org/)

- [Chakra UI](https://chakra-ui.com/) — UI components
- [jotai](https://github.com/pmndrs/jotai) — state management
- [@supabase/supabase-js](https://supabase.com/docs/reference/javascript/introduction) (v2) — database + auth
- [Lodash](https://lodash.com/) — utilities
- [react-hook-clipboard](https://github.com/apolkingg8/react-hook-clipboard) — clipboard copy/preview
- [react-icons](https://react-icons.github.io/react-icons/) — icons

## Project structure

```
src/
  Components/        # Auth, Toolbar, ClipboardList, PaginationTool, PostFromClipboard, PostFromText
  Components/Buttons # DeleteBtn, IsEditingBtn, OAuthLoginBtn, ResetPasswordBtn, SaveSettingBtn
  libs/
    fns.js           # data layer (Supabase ↔ localStorage), useData hook, useDataLoader
    states.jsx       # jotai atoms
    supabaseClient.js# Supabase v2 client (graceful local-only mode without credentials)
    useAuthSession.js# keeps the logged-in user in sync (incl. OAuth redirects)
    useClipboard.js  # local clipboard hook (copy + live preview)
supabase/
  migrations/  # 0001_init.sql (tables + RLS), 0002_images.sql (image table + private bucket), 0003_rename.sql (rushbin → clipbin)
```

See [logic.md](./logic.md) for the original backend design notes.
