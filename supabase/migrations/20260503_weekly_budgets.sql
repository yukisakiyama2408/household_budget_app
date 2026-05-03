create table if not exists weekly_budgets (
  id serial primary key,
  week_start date not null,
  category_id integer not null references categories(id) on delete cascade,
  amount integer not null default 0,
  created_at timestamp with time zone default now() not null,
  unique(week_start, category_id)
);
