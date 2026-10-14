-- =====================================================================
-- The Frame Story — database setup
-- Run ONCE in Supabase: SQL Editor → New query → paste all → Run
-- Create the admin user (Authentication → Users) BEFORE running this.
-- =====================================================================

-- ---------- Admins ----------------------------------------------------
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
-- no policies: only reachable through is_admin()

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ---------- updated_at helper -----------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- Site settings (single row) --------------------------------
create table public.settings (
  id int primary key default 1 check (id = 1),
  shop_name text not null default 'The Frame Story',
  tagline text default 'Framing your moments with love 🤍',
  hero_title text default 'Framing your moments with love',
  hero_subtitle text default 'Photo frames · Wall frames · Bouquets · Polaroids',
  banner_url text,
  announcement text,
  instagram text default '_the__frame__story',
  phone text,
  city text default 'Chennai',
  order_success_message text default 'Thank you! We have received your order and will contact you on your phone number shortly.',
  extra jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create trigger settings_updated_at before update on public.settings
  for each row execute function public.set_updated_at();
insert into public.settings (id) values (1);

-- ---------- Categories ------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,                      -- cover image (public URL from the "site" bucket)
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
insert into public.categories (name, slug, sort_order) values
  ('Photo Frames', 'photo-frames', 1),
  ('Wall Frames',  'wall-frames',  2),
  ('Bouquets',     'bouquets',     3),
  ('Polaroids',    'polaroids',    4);

-- ---------- Products --------------------------------------------------
-- sizes: [{"label": "A4", "price": 499}, {"label": "12x18", "price": 899}]
create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories (id) on delete set null,
  title text not null,
  description text,
  price numeric(10,2),                 -- base price; null = "price on request"
  compare_price numeric(10,2),         -- optional strike-through price
  sizes jsonb not null default '[]'::jsonb,
  images text[] not null default '{}', -- public URLs from the "site" bucket
  allow_photo_upload boolean not null default true,
  max_photos int not null default 5 check (max_photos between 0 and 20),
  is_active boolean not null default true,
  is_featured boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_category_idx on public.products (category_id);
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

-- ---------- Orders ----------------------------------------------------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_no bigint generated always as identity (start with 1001) unique,
  product_id uuid references public.products (id) on delete set null,
  product_title text not null,         -- snapshot at order time
  size_label text,
  unit_price numeric(10,2),
  quantity int not null default 1,
  total numeric(10,2),
  customer_name text not null,
  phone text not null,
  address text not null,
  pincode text,
  notes text,
  photo_paths text[] not null default '{}', -- paths in the private "order-photos" bucket
  status text not null default 'new'
    check (status in ('new', 'confirmed', 'in_progress', 'ready', 'delivered', 'cancelled')),
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_status_idx on public.orders (status, created_at desc);
create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

-- Customers place orders only through this function (validates input and
-- takes the price from the product, so it can't be tampered with).
create or replace function public.create_order(
  p_product_id uuid,
  p_size text,
  p_quantity int,
  p_customer_name text,
  p_phone text,
  p_address text,
  p_pincode text,
  p_notes text,
  p_photo_paths text[]
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_product public.products%rowtype;
  v_price numeric(10,2);
  v_size jsonb;
  v_paths text[] := coalesce(p_photo_paths, '{}');
  v_no bigint;
begin
  select * into v_product from public.products where id = p_product_id and is_active;
  if not found then
    raise exception 'This product is not available right now.';
  end if;

  if length(trim(coalesce(p_customer_name, ''))) < 2 then
    raise exception 'Please enter your name.';
  end if;
  if regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g') !~ '^[0-9]{10,13}$' then
    raise exception 'Please enter a valid phone number.';
  end if;
  if length(trim(coalesce(p_address, ''))) < 10 then
    raise exception 'Please enter your full address.';
  end if;
  if coalesce(p_quantity, 0) not between 1 and 50 then
    raise exception 'Quantity must be between 1 and 50.';
  end if;
  if cardinality(v_paths) > v_product.max_photos then
    raise exception 'You can upload up to % photos for this product.', v_product.max_photos;
  end if;
  if exists (select 1 from unnest(v_paths) p where p !~ '^[0-9a-f-]{36}/[A-Za-z0-9._-]+$') then
    raise exception 'Invalid photo upload.';
  end if;

  v_price := v_product.price;
  if jsonb_array_length(v_product.sizes) > 0 then
    select s into v_size
    from jsonb_array_elements(v_product.sizes) s
    where s->>'label' = p_size
    limit 1;
    if v_size is null then
      raise exception 'Please choose a size.';
    end if;
    v_price := nullif(v_size->>'price', '')::numeric;
  end if;

  insert into public.orders (
    product_id, product_title, size_label, unit_price, quantity, total,
    customer_name, phone, address, pincode, notes, photo_paths
  ) values (
    v_product.id, v_product.title, nullif(p_size, ''), v_price, p_quantity, v_price * p_quantity,
    trim(p_customer_name), trim(p_phone), trim(p_address), nullif(trim(p_pincode), ''),
    nullif(left(trim(p_notes), 1000), ''), v_paths
  )
  returning order_no into v_no;

  return 'FS-' || v_no;
end;
$$;

-- ---------- Row Level Security ----------------------------------------
alter table public.settings   enable row level security;
alter table public.categories enable row level security;
alter table public.products   enable row level security;
alter table public.orders     enable row level security;

create policy "settings: public read" on public.settings
  for select using (true);
create policy "settings: admin update" on public.settings
  for update using (public.is_admin()) with check (public.is_admin());

create policy "categories: public read active" on public.categories
  for select using (is_active or public.is_admin());
create policy "categories: admin write" on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

create policy "products: public read active" on public.products
  for select using (is_active or public.is_admin());
create policy "products: admin write" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

-- orders: no public access at all; customers use create_order()
create policy "orders: admin read" on public.orders
  for select using (public.is_admin());
create policy "orders: admin update" on public.orders
  for update using (public.is_admin()) with check (public.is_admin());
create policy "orders: admin delete" on public.orders
  for delete using (public.is_admin());

-- ---------- API grants ------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select on public.settings, public.categories, public.products to anon, authenticated;
grant update on public.settings to authenticated;
grant insert, update, delete on public.categories, public.products to authenticated;
grant select, update, delete on public.orders to authenticated;
revoke all on public.admins from anon, authenticated;
revoke all on function public.create_order(uuid, text, int, text, text, text, text, text, text[]) from public;
grant execute on function public.create_order(uuid, text, int, text, text, text, text, text, text[]) to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------- Storage ---------------------------------------------------
-- "site": public images (products, banner, logo) — only admin uploads
-- "order-photos": private customer uploads — anyone can upload, only admin can view
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('site', 'site', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('order-photos', 'order-photos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);

create policy "site: admin upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'site' and public.is_admin());
create policy "site: admin update" on storage.objects
  for update to authenticated using (bucket_id = 'site' and public.is_admin());
create policy "site: admin delete" on storage.objects
  for delete to authenticated using (bucket_id = 'site' and public.is_admin());

create policy "order-photos: anyone upload" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'order-photos');
create policy "order-photos: admin read" on storage.objects
  for select to authenticated using (bucket_id = 'order-photos' and public.is_admin());
create policy "order-photos: admin delete" on storage.objects
  for delete to authenticated using (bucket_id = 'order-photos' and public.is_admin());

-- ---------- Make the existing user(s) admin ---------------------------
-- Sign-ups are disabled, so the only user is the one you created.
-- If you add another admin later, run:
--   insert into public.admins (user_id) select id from auth.users where email = 'their@email.com';
insert into public.admins (user_id) select id from auth.users;

-- Check: this should list your admin email
select u.email as admin_email from public.admins a join auth.users u on u.id = a.user_id;
