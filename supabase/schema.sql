-- =====================================================================
--  AJANTA PAVER – Billing app database (Supabase / PostgreSQL)
--  Run this whole file once in: Supabase → SQL Editor → New query → Run
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- Who is allowed to use the app -------------------------------
-- Only e-mails listed here can read or write data, even if someone else
-- manages to create a login. Add your father's / your e-mail below.
create table if not exists app_members (
  email text primary key
);

-- >>> EDIT THESE E-MAILS BEFORE RUNNING <<<
insert into app_members (email) values
  ('ajantapaver@gmail.com')
on conflict do nothing;

create or replace function is_member() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from app_members
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
grant execute on function is_member() to authenticated;

-- ---------- Customers & vendors (one table, two tags) ------------------
create table if not exists parties (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  contact_person  text,
  phone           text,
  email           text,
  address         text,
  shipping_address text,
  state_code      text,
  gstin           text,
  is_customer     boolean not null default false,
  is_vendor       boolean not null default false,
  opening_balance numeric(14,2) not null default 0,
  opening_type    text not null default 'dr' check (opening_type in ('dr','cr')),
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ---------- Product / item master --------------------------------------
create table if not exists products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  hsn         text,
  unit        text,
  rate        numeric(14,2) not null default 0,
  tax_rate    numeric(5,2)  not null default 18,
  created_at  timestamptz not null default now()
);

-- ---------- All documents ----------------------------------------------
-- doc_type: quote | pi | invoice | dn | receipt | po | purchase | payment
create table if not exists documents (
  id          uuid primary key default gen_random_uuid(),
  doc_type    text not null check (doc_type in ('quote','pi','invoice','dn','receipt','po','purchase','payment')),
  doc_no      text not null,
  doc_date    date not null default current_date,
  party_id    uuid references parties(id) on delete restrict,
  party       jsonb,             -- snapshot of party details at time of document
  items       jsonb not null default '[]'::jsonb,
  data        jsonb not null default '{}'::jsonb,  -- texts, tax mode, payment details …
  subtotal    numeric(14,2) not null default 0,
  tax_total   numeric(14,2) not null default 0,
  grand_total numeric(14,2) not null default 0,
  ref_id      uuid references documents(id) on delete set null,  -- created from / paid against
  status      text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (doc_type, doc_no)
);
-- (safe to re-run on an older database)
alter table parties add column if not exists shipping_address text;
alter table documents drop constraint if exists documents_doc_type_check;
alter table documents add constraint documents_doc_type_check
  check (doc_type in ('quote','pi','invoice','dn','receipt','po','purchase','payment'));
create index if not exists documents_party_idx on documents(party_id);
create index if not exists documents_ref_idx   on documents(ref_id);
create index if not exists documents_type_date on documents(doc_type, doc_date);

-- ---------- Saved terms & conditions ---------------------------------
-- scope: sales (Quotation / PI / Invoice) | purchase (Purchase Order)
create table if not exists terms (
  id         uuid primary key default gen_random_uuid(),
  scope      text not null default 'sales' check (scope in ('sales','purchase')),
  title      text,
  content    text,
  auto       jsonb not null default '[]'::jsonb,   -- doc types to auto-add to, e.g. ["quote"]
  sort       int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- Company settings (single row) ------------------------------
create table if not exists settings (
  id         int primary key default 1 check (id = 1),
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---------- Row Level Security -----------------------------------------
alter table app_members enable row level security;
alter table parties     enable row level security;
alter table products    enable row level security;
alter table documents   enable row level security;
alter table terms       enable row level security;
alter table settings    enable row level security;

drop policy if exists members_all  on parties;
drop policy if exists members_all  on products;
drop policy if exists members_all  on documents;
drop policy if exists members_all  on terms;
drop policy if exists members_all  on settings;
drop policy if exists members_read on app_members;

create policy members_all on parties   for all to authenticated using (is_member()) with check (is_member());
create policy members_all on products  for all to authenticated using (is_member()) with check (is_member());
create policy members_all on documents for all to authenticated using (is_member()) with check (is_member());
create policy members_all on terms     for all to authenticated using (is_member()) with check (is_member());
create policy members_all on settings  for all to authenticated using (is_member()) with check (is_member());
create policy members_read on app_members for select to authenticated using (is_member());

-- ---------- File storage for purchase bill attachments ---------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('attachments', 'attachments', false, 20971520)   -- 20 MB per file
on conflict (id) do nothing;

drop policy if exists attachments_read   on storage.objects;
drop policy if exists attachments_insert on storage.objects;
drop policy if exists attachments_update on storage.objects;
drop policy if exists attachments_delete on storage.objects;
create policy attachments_read   on storage.objects for select to authenticated using (bucket_id = 'attachments' and public.is_member());
create policy attachments_insert on storage.objects for insert to authenticated with check (bucket_id = 'attachments' and public.is_member());
create policy attachments_update on storage.objects for update to authenticated using (bucket_id = 'attachments' and public.is_member());
create policy attachments_delete on storage.objects for delete to authenticated using (bucket_id = 'attachments' and public.is_member());

-- ---------- Starter data (from your existing documents) ---------------
insert into parties (name, contact_person, phone, address, state_code, gstin, is_customer, is_vendor)
select * from (values
  ('Integrity Infrabuild Developers Ltd.', 'Akshat Shah', '7069759849',
   E'Indiabulls Megamall, T-02, Jetalpur Rd, Anand Nagar,\nAkota, Vadodara, Gujarat 390007', '24', '24AAHCI7013H1ZS', true, false),
  ('PURUSHADANIYA PARAS ENTERPRISE', 'NIKET SHAH', null,
   E'9th Floor, P 901, Amber Heights, Gotri GERI Bansal Road,\nVadodara, Gujarat, 390021', '24', '24CHYPS8856H1Z9', true, false),
  ('HK ENTERPRISES', 'MD Khan', '9999438141', null, '24', null, true, false),
  ('DINESH STEEL AND ALLOYS', 'Lokesh Soni', '9714441905',
   E'238A, New Lehripura, Gendigate Road\nVadodara, Gujarat, 390001', '24', '24AYLPM3961D1ZF', false, true)
) as v(name, contact_person, phone, address, state_code, gstin, is_customer, is_vendor)
where not exists (select 1 from parties);

insert into products (name, description, hsn, unit, rate, tax_rate)
select * from (values
  ('Uni Paver Block', E'80 mm Thickness,\nIncludes Loading-Unloading and transportation.\nGrade: M35+', null, 'Sqft', 65::numeric, 18::numeric),
  ('Paver Block 60mm', null, null, 'Sqft', 35, 18),
  ('SS304 Stud M10 1mtr Long', null, '73181500', 'Nos', 117, 18)
) as v(name, description, hsn, unit, rate, tax_rate)
where not exists (select 1 from products);

insert into terms (scope, title, content, auto, sort)
select * from (values
  ('sales', 'Transport', 'Transport, Loading & Unloading included.', '["quote"]'::jsonb, 1),
  ('sales', 'Payment',   '30% Advance, 70% on Delivery.',            '["quote"]'::jsonb, 2)
) as v(scope, title, content, auto, sort)
where not exists (select 1 from terms);

insert into settings (id, data) values (1, '{}'::jsonb) on conflict (id) do nothing;
