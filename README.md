# The Frame Story

Website for [@_the__frame__story](https://www.instagram.com/_the__frame__story/) — photo frames, wall frames, polaroids and bouquets, Chennai.

One repo, two websites:

| Site | Folder | Build command | Output |
|---|---|---|---|
| **Shop** (customers) | `src/customer` | `npm run build:customer` | `dist/customer` |
| **Admin** (owner only) | `src/admin` | `npm run build:admin` | `dist/admin` |

Everything runs on free plans: **Supabase** (database, login, photo storage) + **Cloudflare Pages** (hosting).

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

## 2. Hosting on Cloudflare Pages (free)

Do this twice — once for the shop, once for admin:

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages → Create → Pages → Connect to Git**
   (if it offers a Worker, look for “Looking to deploy Pages? Get started”).
2. Pick the `frame_story` repo.
3. Settings:

   | | Shop | Admin |
   |---|---|---|
   | Project name | `theframestory` | `theframestory-admin` |
   | Framework preset | None | None |
   | Build command | `npm run build:customer` | `npm run build:admin` |
   | Build output directory | `dist/customer` | `dist/admin` |

4. **Save and Deploy.** Every `git push` to `main` redeploys both sites automatically.

Then in the admin portal → **Settings → Shop website address**, paste the shop URL.

## 3. Keep Supabase awake (important)

Free Supabase projects **pause after 7 days with no activity** (data is kept; you can click
*Restore* in the dashboard). Two pings prevent this:

1. **cron-job.org (main)** — free account → *Create cronjob*:
   - URL: `https://qriipkojtrgerlvexszo.supabase.co/rest/v1/settings?select=id&limit=1`
   - Schedule: every 2 days
   - Advanced → Headers: `apikey` = `sb_publishable_3-WiHPpqxUeDNlZfwHpGpg_p7ClzRsP`
2. **GitHub Action (backup)** — [`.github/workflows/keepalive.yml`](.github/workflows/keepalive.yml) runs every 2 days.
   Check it under the repo’s **Actions** tab.

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
