-- このアプリは、Supabase Authで作成した1アカウントだけが利用する。
-- signup画面は公開せず、認証済みユーザーだけにpublicテーブルを許可する。
-- service_roleはRLSを迂回するため、cronなどの管理処理には引き続き利用できる。

do $$
declare
  table_name text;
  protected_tables constant text[] := array[
    'categories',
    'transactions',
    'credit_settlements',
    'budgets',
    'yearly_budgets',
    'monthly_total_budgets',
    'weekly_total_budgets',
    'weekly_budgets',
    'weekly_budget_periods',
    'fixed_expenses',
    'fixed_expense_logs',
    'check_ins',
    'goals',
    'push_subscriptions',
    'feature_requests'
  ];
begin
  foreach table_name in array protected_tables loop
    if to_regclass(format('public.%I', table_name)) is not null then
      execute format('alter table public.%I enable row level security', table_name);

      -- anonにはテーブル自体の権限を与えない。
      execute format(
        'revoke select, insert, update, delete on table public.%I from anon',
        table_name
      );

      -- authenticatedは、下のRLSポリシーを満たす場合だけ操作できる。
      execute format(
        'grant select, insert, update, delete on table public.%I to authenticated',
        table_name
      );

      execute format(
        'drop policy if exists "single user full access" on public.%I',
        table_name
      );
      execute format(
        'create policy "single user full access" on public.%I for all to authenticated using (true) with check (true)',
        table_name
      );
    end if;
  end loop;
end
$$;

-- serial列へのINSERTで必要。RLSはテーブル側で制御する。
grant usage, select on all sequences in schema public to authenticated;

-- 投票用RPCを未ログインユーザーから呼べないようにする。
do $$
begin
  if to_regprocedure('public.increment_feature_request_votes(integer)') is not null then
    revoke execute on function public.increment_feature_request_votes(integer) from public, anon;
    grant execute on function public.increment_feature_request_votes(integer) to authenticated;
  end if;
end
$$;
