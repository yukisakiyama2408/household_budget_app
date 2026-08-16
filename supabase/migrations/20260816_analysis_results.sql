create table if not exists analysis_results (
  id serial primary key,
  title text not null check (char_length(trim(title)) > 0),
  content text not null check (char_length(trim(content)) > 0),
  analysis_view text not null check (analysis_view in ('monthly', 'weekly', 'yearly')),
  period_label text not null,
  date_from date not null,
  date_to date not null check (date_to >= date_from),
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table if not exists analysis_advices (
  id serial primary key,
  analysis_result_id integer not null references analysis_results(id) on delete cascade,
  content text not null check (char_length(trim(content)) > 0),
  is_completed boolean not null default false,
  display_order integer not null default 0,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create index if not exists analysis_results_period_idx
  on analysis_results(date_from desc, date_to desc);
create index if not exists analysis_advices_result_idx
  on analysis_advices(analysis_result_id, display_order);

alter table analysis_results enable row level security;
alter table analysis_advices enable row level security;

revoke select, insert, update, delete on table analysis_results from anon;
revoke select, insert, update, delete on table analysis_advices from anon;
grant select, insert, update, delete on table analysis_results to authenticated;
grant select, insert, update, delete on table analysis_advices to authenticated;
grant usage, select on sequence analysis_results_id_seq to authenticated;
grant usage, select on sequence analysis_advices_id_seq to authenticated;

drop policy if exists "single user full access" on analysis_results;
create policy "single user full access" on analysis_results
  for all to authenticated using (true) with check (true);

drop policy if exists "single user full access" on analysis_advices;
create policy "single user full access" on analysis_advices
  for all to authenticated using (true) with check (true);
