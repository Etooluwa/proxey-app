-- Run this in the Supabase SQL editor
create table if not exists user_push_tokens (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  token       text not null unique,
  updated_at  timestamptz not null default now()
);

create index if not exists user_push_tokens_user_id_idx on user_push_tokens(user_id);
