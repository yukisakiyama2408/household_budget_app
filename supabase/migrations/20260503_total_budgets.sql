-- 月次合計予算
create table if not exists monthly_total_budgets (
  id serial primary key,
  year integer not null,
  month integer not null,
  amount integer not null default 0,
  unique(year, month)
);

-- 週次合計予算
create table if not exists weekly_total_budgets (
  id serial primary key,
  week_start date not null unique,
  amount integer not null default 0
);
