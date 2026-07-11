create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint profiles_display_name_format check (
    display_name is null
    or (
      not (
        array[left(display_name, 1), right(display_name, 1)]
        && array[
          chr(9), chr(10), chr(11), chr(12), chr(13), chr(32), chr(133),
          chr(160), chr(5760), chr(8192), chr(8193), chr(8194), chr(8195),
          chr(8196), chr(8197), chr(8198), chr(8199), chr(8200), chr(8201),
          chr(8202), chr(8232), chr(8233), chr(8239), chr(8287), chr(12288),
          chr(65279)
        ]
      )
      and char_length(display_name) between 1 and 100
    )
  )
);

alter table public.profiles enable row level security;
alter table public.profiles force row level security;

revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (display_name) on table public.profiles to authenticated;
grant select, insert, update, delete on table public.profiles to service_role;

create policy "Profiles are selectable by their owner"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy "Profiles are updatable by their owner"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create function public.set_profile_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = clock_timestamp();
  return new;
end;
$$;

revoke all on function public.set_profile_updated_at() from public, anon, authenticated;

create trigger set_profile_updated_at
before update on public.profiles
for each row
execute function public.set_profile_updated_at();

create function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$;

revoke all on function public.handle_new_auth_user() from public, anon, authenticated;

create trigger create_profile_after_auth_user_insert
after insert on auth.users
for each row
execute function public.handle_new_auth_user();