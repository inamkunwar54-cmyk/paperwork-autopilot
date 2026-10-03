-- Paperwork Autopilot: Free + Pro plans
-- Written only by the server (service role) from Stripe webhooks; users can read their own row.

create table public.subscriptions (
  user_id                uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id     text unique,
  stripe_subscription_id text unique,
  status                 text not null default 'none',   -- Stripe subscription status, or 'none'
  current_period_end     timestamptz,
  cancel_at_period_end   boolean not null default false,
  updated_at             timestamptz not null default now()
);

alter table public.subscriptions enable row level security;
create policy "subscriptions: owner select" on public.subscriptions for select using (user_id = auth.uid());

-- Monthly document counter for the free plan. It holds counts only, never document content,
-- and it is kept when a user deletes their data so the monthly limit can't be reset that way.
create table public.usage_counters (
  user_id   uuid not null references auth.users (id) on delete cascade,
  month     date not null,                 -- first day of the month (UTC)
  documents integer not null default 0 check (documents >= 0),
  primary key (user_id, month)
);

alter table public.usage_counters enable row level security;
create policy "usage: owner select" on public.usage_counters for select using (user_id = auth.uid());

-- Atomically reserves one document for this month. Returns false when the limit is reached.
-- p_limit null means unlimited (Pro).
create or replace function public.reserve_document(p_user uuid, p_limit integer)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_month date := date_trunc('month', now() at time zone 'utc')::date;
  v_count integer;
begin
  insert into usage_counters (user_id, month, documents) values (p_user, v_month, 0)
  on conflict (user_id, month) do nothing;

  update usage_counters set documents = documents + 1
   where user_id = p_user and month = v_month
     and (p_limit is null or documents < p_limit)
  returning documents into v_count;

  return v_count is not null;
end;
$$;

-- Gives a reserved document back, used when reading the document fails.
create or replace function public.release_document(p_user uuid)
returns void
language sql security definer set search_path = public as $$
  update usage_counters set documents = greatest(documents - 1, 0)
   where user_id = p_user and month = date_trunc('month', now() at time zone 'utc')::date;
$$;

revoke all on function public.reserve_document(uuid, integer) from public, anon, authenticated;
revoke all on function public.release_document(uuid) from public, anon, authenticated;
grant execute on function public.reserve_document(uuid, integer) to service_role;
grant execute on function public.release_document(uuid) to service_role;
