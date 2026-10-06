-- makes a table to save the five event ids for each day so everyone gets the same events in the same order
create table if not exists public.daily_challenges (
  challenge_date date primary key,
  event_ids uuid[] not null,
  created_at timestamptz not null default now(),
  constraint daily_challenges_five_events check (
    array_ndims(event_ids) = 1
    and cardinality(event_ids) = 5
    and array_position(event_ids, null) is null
  )
);

alter table public.daily_challenges enable row level security;
revoke all on table public.daily_challenges from public, anon, authenticated;
grant select, insert on table public.daily_challenges to service_role;
