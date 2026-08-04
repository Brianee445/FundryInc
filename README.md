# Fundry Landing (Next.js)

Public marketing site + waitlist. Fixed from the previous repo — see "What was broken" below.

## Setup

```bash
npm install
cp .env.example .env.local   # set NEXT_PUBLIC_API_URL to your FastAPI backend
npm run dev
```

## Deploying to Vercel

Import this repo directly — **do not** put it in a `frontend/` subfolder of a
monorepo unless you also set the Vercel project's *Root Directory* setting to
that subfolder. `app/` is at the repo root here specifically so Vercel's
zero-config Next.js detection just works with no dashboard setting required.

Set `NEXT_PUBLIC_API_URL` as an environment variable in the Vercel project
(the deployed FastAPI backend URL).

## What was broken in the previous version

1. **Root-cause of the 404s**: no root-level `package.json` — only
   `frontend/package.json` — with no matching Vercel Root Directory setting.
   Fixed by moving `app/` to the repo root.
2. **`HowItWorks.tsx` build failure**: imported `Handcoin` from
   `lucide-react`, which isn't a real export — this fails the whole build
   (not a warning). Replaced with `Handshake`.
3. **Broken image request**: `Navbar.tsx` referenced `/logo/fundry.svg`,
   but no `public/` folder existed in the repo, so it 404'd in the browser
   on every page load. Replaced with a `<Logo />` component (text + a
   gradient mark) — swap the mark inside `app/components/layout/Logo.tsx`
   for your real SVG whenever it's ready; every page already renders
   through that one component.
4. **Waitlist form/backend mismatch**: the form posted `{ email, role }`,
   but the backend's `WaitlistCreate` schema expects `role_interest`.
   Fixed the field name.
5. Removed `framer-motion` and the scroll-triggered animation on every
   section — swapped for one subtle CSS fade-in on the hero only, to match
   a calmer, less "templated" feel.

## Structure

Everything lives under `app/` (co-located, not a separate top-level
`components/`), matching the App Router convention where only
`page.tsx` / `layout.tsx` are treated as routes:

```
app/
  components/
    layout/Logo.tsx      # swap in your SVG here
    sections/            # one file per landing-page section
    ui/                  # Button, Input, Select, Container
  lib/
    api.ts                # fetch wrapper (apiPost) — no axios dependency
    utils.ts               # cn() class merge helper
  page.tsx                 # assembles all sections
  waitlist/page.tsx         # wired to POST /api/v1/waitlist
```
