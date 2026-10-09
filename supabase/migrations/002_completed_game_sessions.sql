-- Run this AFTER creating the completed_games table from the previous step.
-- Each signed game session can produce at most one history row.
alter table public.completed_games
  add column if not exists session_id uuid;

create unique index if not exists completed_games_unique_session
  on public.completed_games (session_id);

-- Additional reminder: authenticated has SELECT only and the service_role
-- inserts records. Never grant INSERT to anon or authenticated here.
