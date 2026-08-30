alter table public.goals
  add column if not exists saved_amount integer not null default 0
  check (saved_amount >= 0);
