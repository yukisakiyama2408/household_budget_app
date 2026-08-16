alter table goals
  add column if not exists start_balance integer not null default 0,
  add column if not exists is_active boolean not null default true,
  add column if not exists updated_at timestamp with time zone default now() not null;

create index if not exists goals_active_idx on goals(is_active, created_at desc);
