-- Storage bucket for exercise photos
insert into storage.buckets (id, name, public)
values ('exercises', 'exercises', false)
on conflict (id) do nothing;

-- RLS policies on storage.objects for the 'exercises' bucket
create policy "users read own exercise images"
on storage.objects for select
using (bucket_id = 'exercises' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "users upload own exercise images"
on storage.objects for insert
with check (bucket_id = 'exercises' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "users delete own exercise images"
on storage.objects for delete
using (bucket_id = 'exercises' and auth.uid()::text = (storage.foldername(name))[1]);

-- Solved exercises history
create table public.solved_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  image_path text not null,
  note text,
  solution text not null,
  created_at timestamp with time zone not null default now()
);

alter table public.solved_exercises enable row level security;

create policy "own solved select" on public.solved_exercises
  for select using (auth.uid() = user_id);
create policy "own solved insert" on public.solved_exercises
  for insert with check (auth.uid() = user_id);
create policy "own solved delete" on public.solved_exercises
  for delete using (auth.uid() = user_id);

create index solved_exercises_user_created_idx
  on public.solved_exercises (user_id, created_at desc);