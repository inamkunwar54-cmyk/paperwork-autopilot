-- Paperwork Autopilot: initial schema
-- Run in the Supabase SQL editor, or with `supabase db push`.

-- ---------------------------------------------------------------------------
-- documents: one row per upload or pasted email. Holds the original file
-- reference and the raw model extraction, before the user confirms it.
-- ---------------------------------------------------------------------------
create table public.documents (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null default auth.uid() references auth.users (id) on delete cascade,
  source            text not null check (source in ('upload', 'paste')),
  storage_path      text,            -- "<user_id>/<uuid>.<ext>" in the private "documents" bucket
  mime_type         text,
  original_filename text,
  pasted_text       text,            -- only for source = 'paste'
  extraction        jsonb,           -- validated JSON returned by the model
  status            text not null default 'extracted'
                    check (status in ('extracted', 'confirmed', 'failed')),
  created_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- items: the confirmed, user-edited record shown on the dashboard.
-- ---------------------------------------------------------------------------
create table public.items (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  document_id     uuid references public.documents (id) on delete set null,
  doc_type        text not null check (doc_type in (
                    'bill', 'insurance_renewal', 'tax_letter', 'school_form',
                    'warranty', 'subscription', 'other')),
  sender          text not null,
  -- normalised sender used to match documents from the same company:
  -- drops a leading "The" and trailing Inc/LLC/Ltd/Co/Corp, then keeps only letters and digits
  sender_key      text generated always as (lower(regexp_replace(
                    regexp_replace(sender, '^\s*the\s+|[\s,]+(inc|llc|ltd|limited|co|corp|corporation|company)\.?\s*$', '', 'gi'),
                    '[^a-zA-Z0-9]+', '', 'g'))) stored,
  amount          numeric(12, 2) check (amount is null or amount >= 0),
  currency        text not null default 'USD',
  due_date        date,
  required_action text not null,
  urgency         text not null check (urgency in ('high', 'medium', 'low')),
  -- supports money-leak detection (per-month increases, duplicates, renewals)
  billing_period  text not null default 'unknown'
                  check (billing_period in ('one_time', 'monthly', 'quarterly', 'yearly', 'unknown')),
  auto_renews     boolean not null default false,
  status          text not null default 'open' check (status in ('open', 'done')),
  completed_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index items_user_status_due_idx on public.items (user_id, status, due_date);
create index items_user_sender_idx     on public.items (user_id, sender_key);
create index documents_user_idx        on public.documents (user_id, created_at desc);

create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger items_set_updated_at
  before update on public.items
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- reminder_log: which reminder emails were sent, so each goes out once.
-- Written only by the server (service role); not readable by users.
-- ---------------------------------------------------------------------------
create table public.reminder_log (
  item_id   uuid not null references public.items (id) on delete cascade,
  kind      text not null check (kind in ('7d', '1d')),
  due_date  date not null,           -- reminders re-arm if the due date changes
  sent_at   timestamptz not null default now(),
  primary key (item_id, kind, due_date)
);

-- ---------------------------------------------------------------------------
-- Row-level security: every row is private to its owner.
-- ---------------------------------------------------------------------------
alter table public.documents    enable row level security;
alter table public.items        enable row level security;
alter table public.reminder_log enable row level security;  -- no policies: service role only

create policy "documents: owner select" on public.documents for select using (user_id = auth.uid());
create policy "documents: owner insert" on public.documents for insert with check (user_id = auth.uid());
create policy "documents: owner update" on public.documents for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "documents: owner delete" on public.documents for delete using (user_id = auth.uid());

create policy "items: owner select" on public.items for select using (user_id = auth.uid());
create policy "items: owner insert" on public.items for insert with check (
  user_id = auth.uid()
  and (document_id is null or exists (
    select 1 from public.documents d where d.id = document_id and d.user_id = auth.uid()))
);
create policy "items: owner update" on public.items for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "items: owner delete" on public.items for delete using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Storage: private bucket, files live under a folder named after the user id.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documents', 'documents', false, 15728640,
        array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'])
on conflict (id) do nothing;

create policy "documents bucket: owner read" on storage.objects for select
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "documents bucket: owner upload" on storage.objects for insert
  with check (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "documents bucket: owner delete" on storage.objects for delete
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);
