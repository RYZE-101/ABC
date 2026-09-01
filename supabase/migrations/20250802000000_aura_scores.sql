alter table public.profile_votes add column if not exists session_id text;
alter table public.profile_votes add column if not exists aura_points integer;

update public.profile_votes
set session_id = coalesce(session_id, gen_random_uuid()::text),
    aura_points = case when aura_points is null or aura_points < 98000 or aura_points > 103000 then floor(random() * 5001 + 98000)::integer else aura_points end;

alter table public.profile_votes alter column aura_points set default 0;
alter table public.profile_votes alter column session_id set not null;

create unique index if not exists profile_votes_session_profile_idx on public.profile_votes (session_id, profile_id);
alter table public.profile_votes alter column aura_points set not null;
alter table public.profile_votes drop constraint if exists profile_votes_aura_points_check;
alter table public.profile_votes add constraint profile_votes_aura_points_check check (aura_points between 98000 and 103000);

create or replace view public.profile_aura_totals as
select profile_id, coalesce(sum(aura_points), 0)::integer as aura
from public.profile_votes
group by profile_id;
