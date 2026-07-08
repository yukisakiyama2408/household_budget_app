create table if not exists feature_requests (
  id serial primary key,
  title text not null check (char_length(trim(title)) > 0),
  detail text not null default '',
  category text not null default 'その他',
  status text not null default '検討中' check (status in ('検討中', '次に対応', '対応済み')),
  votes integer not null default 1 check (votes >= 0),
  comments_count integer not null default 0 check (comments_count >= 0),
  created_by text not null default 'あなた',
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create index if not exists feature_requests_status_idx on feature_requests(status);
create index if not exists feature_requests_created_at_idx on feature_requests(created_at desc);

create or replace function increment_feature_request_votes(request_id integer)
returns void
language sql
as $$
  update feature_requests
  set
    votes = votes + 1,
    updated_at = now()
  where id = request_id;
$$;
