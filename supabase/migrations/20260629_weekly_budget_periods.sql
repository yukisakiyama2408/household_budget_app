create table if not exists weekly_budget_periods (
  id serial primary key,
  period_start date not null,
  period_end date not null,
  category_id integer not null references categories(id) on delete cascade,
  amount integer not null default 0 check (amount >= 0),
  created_at timestamp with time zone default now() not null,
  check (period_end >= period_start),
  unique(period_start, period_end, category_id)
);

-- 既存の週予算は、月内の週ならそのまま移す。
insert into weekly_budget_periods (period_start, period_end, category_id, amount)
select
  week_start,
  (week_start + 6),
  category_id,
  amount
from weekly_budgets
where date_trunc('month', week_start) = date_trunc('month', week_start + 6)
on conflict (period_start, period_end, category_id)
do nothing;

-- 月を跨ぐ既存予算は日数比で分割し、2区間の合計を元の金額に合わせる。
with crossing as (
  select
    week_start,
    (week_start + 6) as week_end,
    (date_trunc('month', week_start) + interval '1 month - 1 day')::date as first_end,
    category_id,
    amount
  from weekly_budgets
  where date_trunc('month', week_start) <> date_trunc('month', week_start + 6)
),
split as (
  select
    *,
    round(amount * ((first_end - week_start + 1)::numeric / 7))::integer as first_amount
  from crossing
)
insert into weekly_budget_periods (period_start, period_end, category_id, amount)
select week_start, first_end, category_id, first_amount from split
union all
select (first_end + 1), week_end, category_id, amount - first_amount from split
on conflict (period_start, period_end, category_id)
do nothing;
