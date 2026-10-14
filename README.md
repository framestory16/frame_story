# The Frame Story

Website for [@_the__frame__story](https://www.instagram.com/_the__frame__story/) — photo frames, wall frames, polaroids and bouquets, Chennai.

One repo, two websites:

| Site | Folder | Build command | Output |
|---|---|---|---|
| **Shop** (customers) | `src/customer` | `npm run build:customer` | `dist/customer` |
| **Admin** (owner only) | `src/admin` | `npm run build:admin` | `dist/admin` |

Everything runs on free plans: **Supabase** (database, login, photo storage) + **GitHub Pages** (hosting).

| | Live address |
|---|---|
| Shop | https://framestory16.github.io/frame_story/ |
| Admin | https://framestory16.github.io/frame_story/admin/ |

---

## 1. Supabase setup (once)

1. Create the project (region **South Asia – Mumbai**).
2. **Authentication → Users → Add user** → admin email + password, tick **Auto confirm user**.
3. **Authentication → Sign In / Providers** → turn **off** “Allow new users to sign up”.
4. **SQL Editor → New query** → paste all of [`supabase/schema.sql`](supabase/schema.sql) → **Run**.
   The last result should show the admin email.

The Project URL and publishable key are in [`src/shared/supabase.js`](src/shared/supabase.js).
They are public by design; the database security rules protect the data.
**Never** put the `service_role` / secret key or database password in this repo.

### Add another admin later
Create the user in **Authentication → Users**, then run in SQL Editor:
```sql
insert into public.admins (user_id) select id from auth.users where email = 'their@email.com';
```

## 2. Hosting on GitHub Pages (free)

The repo must be **public** (free GitHub Pages requirement — no secrets are stored in it).

1. Repo → **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Push to `main`. [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) builds both sites and
   publishes them (watch progress in the **Actions** tab, ~1–2 minutes).
3. In the admin portal → **Settings → Shop website address**, paste the shop URL.

Every later `git push` redeploys automatically. The admin uses `#` links (e.g. `/admin/#/orders`)
because GitHub Pages can't route sub-pages for single-page apps.

## 3. Keep Supabase awake (important)

Free Supabase projects **pause after 7 days with no activity** (data is kept; you can click
*Restore* in the dashboard).

1. **GitHub Action (automatic)** — [`.github/workflows/keepalive.yml`](.github/workflows/keepalive.yml)
   runs on GitHub's servers every 2 days and pings the database. It also re-enables itself so GitHub's
   “60 days of inactivity” rule never switches it off. Check runs in the **Actions** tab.
2. **cron-job.org (optional backup)** — free account → *Create cronjob*:
   - URL: `https://qriipkojtrgerlvexszo.supabase.co/rest/v1/settings?select=id&limit=1`
   - Schedule: every 2 days
   - Advanced → Headers: `apikey` = `sb_publishable_3-WiHPpqxUeDNlZfwHpGpg_p7ClzRsP`

## 4. Run locally

```bash
npm install
npm run dev        # shop  → http://localhost:5173
npm run dev:admin  # admin → http://localhost:5174
```

## How it works

- **Categories** (Photo Frames, Bouquets…) and **products** inside them are managed in admin.
  Products can have sizes with different prices and allow customers to upload photos.
- **Orders**: the customer fills the order form (name, phone, address, photos) → saved in Supabase →
  shows in admin **Orders** with status New → Confirmed → In progress → Ready → Delivered.
- Customer photos go to a **private** bucket — only the admin can view/download them.
- Prices are always taken from the database, so customers can't change them.

## Logo files

`assets_src/` has the original Instagram logo and AI-upscaled HD versions
(`logo-hd-2048.png`, `logo-hd-4320.png` for printing).
