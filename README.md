# Origins

Next.js app for capturing family stories (Supabase auth + storage, optional OpenAI interview).

**Repo:** [tong0701/510_finalproject_Origin](https://github.com/tong0701/510_finalproject_Origin) · deploy branch `510_Origin_deploy`

## Local

```bash
npm install
cp .env.example .env.local   # or paste keys in lib/public-config.ts
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Config

Either `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- `OPENAI_API_KEY` (optional)

Or edit `lib/public-config.ts` (inline URL/key for Vercel without env UI).

Run `supabase/schema.sql` in your Supabase SQL editor once.

## Vercel

- Import this repo, branch **`510_Origin_deploy`**
- **Root Directory:** `.` (repo root is the Next app)
- Build: `npm run build` · Start: `npm start`
- After deploy, set Supabase Auth redirect URLs to your Vercel domain + `/auth/callback`

## Demo

New accounts get a built-in **Alex Rivera** profile with sample stories and photos under `public/demo/` (no OpenAI key required).
