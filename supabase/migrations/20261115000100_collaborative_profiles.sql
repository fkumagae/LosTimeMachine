begin;

create table public.participants (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(btrim(nome)) between 1 and 100 and char_length(nome) <= 100),
  apelido text not null check (char_length(btrim(apelido)) between 1 and 60 and char_length(apelido) <= 60),
  bio text not null default '' check (char_length(bio) <= 500),
  updated_at timestamptz not null default now()
);

create table public.participant_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  participant_id uuid not null unique references public.participants(id) on delete restrict
);

alter table public.participants enable row level security;
alter table public.participant_accounts enable row level security;

-- Explicit grants also cover projects that grant table privileges by default.
revoke all on public.participants, public.participant_accounts from public, anon, authenticated;
grant select on public.participant_accounts to authenticated;
grant select on public.participants to authenticated;
grant update (nome, apelido, bio) on public.participants to authenticated;
grant all on public.participants, public.participant_accounts to service_role;

create policy "Members read their own account link"
on public.participant_accounts for select to authenticated
using (user_id = (select auth.uid()));

create policy "Members read profiles"
on public.participants for select to authenticated
using (exists (
  select 1 from public.participant_accounts where user_id = (select auth.uid())
));

create policy "Members edit collaborative profiles"
on public.participants for update to authenticated
using (exists (
  select 1 from public.participant_accounts where user_id = (select auth.uid())
))
with check (exists (
  select 1 from public.participant_accounts where user_id = (select auth.uid())
));

create function public.set_participant_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := greatest(clock_timestamp(), old.updated_at + interval '1 microsecond');
  return new;
end;
$$;

create trigger set_participant_updated_at
before update on public.participants for each row
execute function public.set_participant_updated_at();

commit;
