# Keyline — Hotel Ticket Desk (Vercel + Postgres edition)

A real shared backend for the Keyline ticket board: one login system, one
shared ticket list, backed by a Postgres database, deployed as Vercel
serverless functions. The frontend still works offline — it caches the last
synced data locally and queues any changes made while disconnected, syncing
them automatically once the connection returns.

## What's in this folder

```
index.html            The whole frontend (single file, no build step)
api/register.js        POST — create an account
api/login.js           POST — log in, get a token
api/me.js               GET — validate a token
api/handover.js        GET/PUT — shared shift-handover notes
api/tickets/index.js    GET (list) / POST (create)
api/tickets/[id].js     PATCH (update) / DELETE
lib/db.js, lib/auth.js, lib/format.js   shared helpers
schema.sql              run this once against your database
.env.example            copy to .env.local for local dev
```

## 1. Create a Vercel Postgres database

1. Go to your project on vercel.com → **Storage** tab → **Create Database** → choose **Postgres**.
2. Once created, click **Connect Project** to link it to this project. Vercel
   will automatically add a `POSTGRES_URL` environment variable for you —
   you don't need to copy/paste it.

## 2. Set your JWT secret

In the same project → **Settings → Environment Variables**, add:

- `JWT_SECRET` — any long random string (e.g. run `openssl rand -base64 32`
  locally and paste the result). This is what signs login sessions — keep it
  private and don't reuse it elsewhere.

## 3. Run the schema

You need to run `schema.sql` once against your new database, to create the
`users`, `tickets`, `ticket_logs`, and `handover` tables.

Easiest way — from the Vercel dashboard:
1. Storage tab → your Postgres database → **Query** (or "Data" / "Browser" tab, naming varies slightly by Vercel version).
2. Paste the entire contents of `schema.sql` and run it.

Alternatively, from your terminal with the Vercel CLI installed:
```bash
vercel env pull .env.local     # pulls POSTGRES_URL etc. into a local file
npm install
node -e "
require('dotenv').config({path:'.env.local'});
const { sql } = require('@vercel/postgres');
const fs = require('fs');
sql.query(fs.readFileSync('schema.sql','utf8')).then(()=>console.log('done'));
"
```
(If you go this route, you'll also want `npm install dotenv` first.)

## 4. Deploy

**Option A — GitHub (recommended for ongoing use):**
1. Push this folder to a new GitHub repo.
2. In Vercel: **Add New → Project → Import** that repo.
3. Vercel auto-detects the `/api` folder as serverless functions and serves
   `index.html` as your homepage. No build settings needed.
4. Deploy. Every future `git push` redeploys automatically.

**Option B — Vercel CLI, no GitHub needed:**
```bash
npm install -g vercel
cd keyline-vercel
vercel        # follow the prompts, link to the project you created storage on
vercel --prod
```

Either way, once deployed you'll get a URL like `https://your-project.vercel.app`
— that's the one link everyone on staff uses.

## 5. First login

Open your deployed URL. Since there are no accounts yet, it opens straight
to **Create Account**. The first person to register picks their name,
department, username, and password — after that, anyone else on staff opens
the same link and either logs in or registers their own account. Everyone
sees the same shared ticket board immediately.

## How the offline behavior works

- Every ticket fetch is cached to the browser's local storage.
- If a device loses its connection, the app keeps working from that cached
  copy — you can still view tickets, and any create/edit/delete you make
  gets applied locally right away and queued.
- When the connection returns (or every 20 seconds while online), the app
  flushes the queue to the server in order, then re-fetches the canonical
  list so everyone converges on the same data.
- A ticket you created while offline shows an "Unsynced" tag until it's
  successfully pushed to the server.

**Known limitation:** if the *same* ticket is edited on two different offline
devices before either reconnects, the second one to sync will overwrite the
first one's change (last-write-wins) — there's no field-level conflict
merging. For a single-property front desk this is rarely an issue in
practice, but it's worth knowing.

## Security notes

- Passwords are hashed with bcrypt before being stored — this is real
  password security, unlike the earlier device-only version of this app.
- Sessions use JWTs signed with your `JWT_SECRET` and last 30 days.
- There's currently no "admin" role or per-department access restriction on
  the server — any logged-in account can see and edit every ticket
  regardless of department. The department field is used for defaults and
  filtering, not access control. If you need real per-department
  permissions, that's a reasonable next step to add to the API routes.
- This project doesn't include rate-limiting or account lockout on the
  login endpoint. Fine for an internal staff tool behind a private link;
  worth adding if this is ever exposed more broadly.

## Local development

```bash
npm install -g vercel
npm install
vercel dev
```
This runs both the static frontend and the `/api` functions locally,
talking to the same Postgres database (via the `.env.local` you pulled or
created from `.env.example`).
