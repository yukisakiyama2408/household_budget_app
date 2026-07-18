create table if not exists wishlist_items (
  id serial primary key,
  title text not null check (char_length(trim(title)) > 0),
  price integer not null check (price > 0),
  url text not null check (char_length(trim(url)) > 0),
  memo text not null default '' check (char_length(memo) <= 300),
  priority text not null default '' check (priority in ('', 'next', 'high', 'medium', 'low')),
  purchased_at timestamp with time zone,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create index if not exists wishlist_items_active_idx
  on wishlist_items(purchased_at, created_at desc);

alter table public.wishlist_items enable row level security;
revoke select, insert, update, delete on table public.wishlist_items from anon;
grant select, insert, update, delete on table public.wishlist_items to authenticated;
drop policy if exists "single user full access" on public.wishlist_items;
create policy "single user full access"
  on public.wishlist_items for all to authenticated using (true) with check (true);
grant usage, select on sequence public.wishlist_items_id_seq to authenticated;
