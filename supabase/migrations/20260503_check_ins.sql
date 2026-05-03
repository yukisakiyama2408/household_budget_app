create table if not exists check_ins (
  id serial primary key,
  week_start date not null unique,
  checked_at timestamp with time zone default now() not null
);
