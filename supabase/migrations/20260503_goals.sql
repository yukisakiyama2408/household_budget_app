create table if not exists goals (
  id serial primary key,
  title text not null,
  type text not null check (type in ('savings', 'expense')),
  target_amount integer not null,
  deadline date,
  category_id integer references categories(id) on delete set null,
  created_at timestamp with time zone default now() not null
);
