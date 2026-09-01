drop policy if exists "public can submit teacher ratings" on public.teacher_ratings;
alter table public.teacher_ratings drop column if exists lesson;
alter table public.teacher_ratings add column if not exists digital integer;
alter table public.teacher_ratings add column if not exists serious integer;

update public.teacher_ratings set digital = 3 where digital is null;
update public.teacher_ratings set serious = 3 where serious is null;
alter table public.teacher_ratings alter column digital set not null;
alter table public.teacher_ratings alter column serious set not null;
alter table public.teacher_ratings add constraint teacher_ratings_digital_check check (digital between 1 and 5);
alter table public.teacher_ratings add constraint teacher_ratings_serious_check check (serious between 1 and 5);

create policy "public can submit teacher ratings" on public.teacher_ratings
  for insert to anon, authenticated with check (profile_id between 1 and 40 and productivity between 1 and 5 and atmosphere between 1 and 5 and digital between 1 and 5);

create or replace view public.teacher_score_totals as
select profile_id, round(avg(score))::integer as score
from public.teacher_ratings
group by profile_id;
