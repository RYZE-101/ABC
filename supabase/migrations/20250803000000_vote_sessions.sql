alter table public.profile_votes add column if not exists session_id text;

update public.profile_votes
set session_id = gen_random_uuid()::text
where session_id is null;

alter table public.profile_votes alter column session_id set not null;
create unique index if not exists profile_votes_session_profile_idx
  on public.profile_votes (session_id, profile_id);
