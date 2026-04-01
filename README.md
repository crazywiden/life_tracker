# Life Tracker

Private habit tracking for one user, with:

- magic-link sign-in for one allowlisted email
- a `Today` screen optimized for gym logging
- a month calendar for review and backfill
- JSON template import for workout structure

## Stack

- Next.js App Router
- Supabase Auth + Postgres
- Shared day payload with module-scoped patch writes

## Setup

1. Copy `.env.example` to `.env.local`.
2. Fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `ALLOWLIST_EMAIL`
   - `NEXT_PUBLIC_APP_URL`
3. Create a Supabase project.
4. Apply `supabase/migrations/20260330000000_init.sql`.
5. Install dependencies.
6. Run `npm run dev`.

## Current implementation status

The core app scaffold is in place:

- auth entry screen
- protected app layout
- today flow with module-scoped saves
- calendar month view and day detail
- template import + activation
- SQL schema and RPC functions for atomic day-module patching

What still needs real environment wiring before it runs end to end:

- Supabase project credentials
- applying the SQL migration to a real database
- browser-level test execution against a configured local app

## Verification

- `npm run typecheck`
- `npm run build`
