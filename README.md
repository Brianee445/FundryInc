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
4. ~~**Waitlist form/backend mismatch**~~ — re-verified directly against the
   backend's `WaitlistCreate` schema: the field is `role`, matching what the
   form already sends. This line previously claimed a `role_interest`
   mismatch that does not exist; no code change was needed here.
5. Removed `framer-motion` and the scroll-triggered animation on every
   section — swapped for one subtle CSS fade-in on the hero only, to match
   a calmer, less "templated" feel.

## Dashboard

Both dashboards are fully functional, not mockups — real data, real API calls.

**Founder** (`app/components/dashboard/FounderDashboard.tsx`)
- Create/edit startup profile (`PUT /api/v1/founder-profiles/me`)
- Publish/unpublish toggle — draft profiles aren't visible in the investor
  directory until published
- Incoming connection requests, with working Accept/Decline

**Investor** (`app/components/dashboard/InvestorDashboard.tsx`)
- Discover tab: searchable/filterable directory of published startups
  (sector, stage, funding range, free-text search)
- Save/watchlist toggle per startup
- Send a connection request with an optional message; once a founder
  accepts, their contact email unlocks inline on the card
- Saved and Sent Requests tabs

**Deliberately not built yet** (separate PRD sections, not part of this
pass): in-platform messaging, the pitch/update feed, the spotlight
application flow, the admin panel, and any usage analytics/charts. The
dashboard doesn't fake these — it just doesn't have them.

## Auth

Custom JWT-based auth (no third-party provider). Signup and login both return
`{ access_token, token_type, user }`; the token is stored in `localStorage`
and attached as `Authorization: Bearer <token>` on every subsequent request
by `app/lib/api.ts`.

- `app/signup/page.tsx` — founder/investor signup
- `app/login/page.tsx` — login
- `app/dashboard/page.tsx` — placeholder landing spot after auth; redirects
  to `/login` if there's no valid session. Replace with the real
  founder/investor dashboards next.
- `app/providers/AuthProvider.tsx` — session state (`user`, `login`,
  `signup`, `logout`), wrapped around the whole app in `app/layout.tsx`.
  On load it re-validates the stored token against `GET /api/v1/auth/me`
  rather than trusting `localStorage` blindly (an expired or revoked token
  gets cleared automatically).

Backend counterpart lives in the `FundryInc-Backend-main` repo:
`app/routers/auth.py`, `app/security.py` (bcrypt + JWT), `app/dependencies.py`
(`get_current_user`, `require_role` for admin-only routes later).

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
