# Origins — Demo guide (Final week)

Two **one-click** demos on Dashboard (no OpenAI key). A third **live** path shows interview + skip.

## Before you start

1. Run `origins/supabase/schema.sql` in Supabase SQL Editor (once).
2. Copy `origins/.env.example` → `.env.local` and set Supabase URL + publishable/anon key.
3. `cd origins && npm install && npm run dev` → open http://localhost:3000
4. Register or log in with your demo account.

---

## Demo A — Built-in sample (≈3 min)

**Load:** Dashboard → **Built-in sample · Alex Rivera** → **Load demo**

| Step | What to show | Say (optional) |
|------|----------------|----------------|
| 1 | Card **Alex Rivera** appears | “This is who we’re capturing stories for.” |
| 2 | **Timeline** | Point to years **1945 / 1962 / 1980s** on the dated rail |
| 3 | Scroll to **Undated stories** | “If we don’t know the year, stories still live here — not lost.” |
| 4 | Open one **story detail** | Read a short Q&A; note text-only is fine without audio |
| 5 | **Interview** | Show a **built-in** question (no API key); click **Skip this question** → new question, nothing saved |
| 6 | Type one sentence → **Save answer & next question** | “User-owned content — we don’t ship a script library.” |
| 7 | Back to **Dashboard** → ⋯ **Edit profile** / **Delete everything** | SPEC edit + destructive delete with warning |

---

## Demo B — Grandma Lin (≈3 min, warmer story)

**Load:** Dashboard → **Grandma Lin** → **Load demo**

| Step | What to show | Say (optional) |
|------|----------------|----------------|
| 1 | **Timeline** | Shanghai childhood → migration → tradition |
| 2 | **Undated** | Dumpling tradition — “still happening, no single year” |
| 3 | **Story detail** | Pick the Seattle / garden story |
| 4 | **Interview** | Record or type a new line about her — “everything in the app is what the family records.” |

Reloading the same demo **replaces** the previous copy of that person (same name).

---

## Demo C — Live path (no seed, ≈5 min)

1. **Add someone** — e.g. name only, relationship “Uncle”.
2. **Interview** — answer 2 questions (text is enough).
3. **Timeline** — mix of dated (if OpenAI key) vs undated (without key).
4. Optional: add **photo** on interview or profile.

---

## Deployed demo (Vercel)

- Root directory: **`origins`**
- Env: same as `.env.local` (no `OPENAI_API_KEY` required for Demos A/B).
- Supabase → Auth → add `https://your-app.vercel.app/auth/callback` to redirect URLs.

If deploy fails, Demo A/B still work locally for presentation screen-share.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Empty dashboard after Load demo | Hard refresh; check Supabase RLS + logged-in user |
| All stories undated | Expected without OpenAI; Demo A still has manual years on 3 stories |
| Interview stuck loading | Network tab on `/api/interview/next-question`; fallback questions work without key |
