-- AI Todo Manager Supabase schema
-- PRD 기준: public.users, public.todos + RLS(owner only)

create extension if not exists pgcrypto;

-- updated_at 자동 갱신 함수
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- auth.users 와 1:1로 연결되는 프로필 테이블
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 사용자별 할일 관리 테이블
create table if not exists public.todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  created_date timestamptz not null default now(),
  due_date timestamptz,
  priority text not null default 'medium'
    check (priority in ('high', 'medium', 'low')),
  category text[] not null default array['개인']::text[],
  completed boolean not null default false,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 인덱스
create index if not exists idx_todos_user_created_date
  on public.todos (user_id, created_date desc);

create index if not exists idx_todos_user_due_date
  on public.todos (user_id, due_date asc);

create index if not exists idx_todos_user_completed
  on public.todos (user_id, completed);

create index if not exists idx_todos_category_gin
  on public.todos using gin(category);

-- updated_at 트리거
drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
before update on public.users
for each row
execute function public.set_updated_at();

drop trigger if exists todos_set_updated_at on public.todos;
create trigger todos_set_updated_at
before update on public.todos
for each row
execute function public.set_updated_at();

-- 회원가입 시 public.users 프로필 자동 생성
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- RLS 활성화
alter table public.users enable row level security;
alter table public.todos enable row level security;

-- 기존 정책 정리(재실행 안전)
drop policy if exists "users_select_own" on public.users;
drop policy if exists "users_insert_own" on public.users;
drop policy if exists "users_update_own" on public.users;
drop policy if exists "users_delete_own" on public.users;

drop policy if exists "todos_select_own" on public.todos;
drop policy if exists "todos_insert_own" on public.todos;
drop policy if exists "todos_update_own" on public.todos;
drop policy if exists "todos_delete_own" on public.todos;

-- public.users 정책: 본인만 읽기/쓰기
create policy "users_select_own"
on public.users
for select
using (auth.uid() = id);

create policy "users_insert_own"
on public.users
for insert
with check (auth.uid() = id);

create policy "users_update_own"
on public.users
for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "users_delete_own"
on public.users
for delete
using (auth.uid() = id);

-- public.todos 정책: 소유자만 읽기/쓰기
create policy "todos_select_own"
on public.todos
for select
using (auth.uid() = user_id);

create policy "todos_insert_own"
on public.todos
for insert
with check (auth.uid() = user_id);

create policy "todos_update_own"
on public.todos
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "todos_delete_own"
on public.todos
for delete
using (auth.uid() = user_id);

-- 비로그인 문의 접수 (API에서 Service Role로만 insert; 일반 클라이언트는 접근 불가)
create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  category text not null
    check (category in (
      'general',
      'bug',
      'account',
      'partnership',
      'privacy',
      'other'
    )),
  message text not null,
  attachment_paths text[] not null default '{}',
  status text not null default 'received'
    check (status in ('received', 'in_progress', 'resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_contact_submissions_created_at
  on public.contact_submissions (created_at desc);

create index if not exists idx_contact_submissions_status
  on public.contact_submissions (status);

drop trigger if exists contact_submissions_set_updated_at on public.contact_submissions;
create trigger contact_submissions_set_updated_at
before update on public.contact_submissions
for each row
execute function public.set_updated_at();

alter table public.contact_submissions enable row level security;

-- anon·authenticated 모두 행을 읽거나 쓸 수 없음 (Service Role만 우회)
drop policy if exists "contact_submissions_no_public" on public.contact_submissions;
create policy "contact_submissions_no_public"
on public.contact_submissions
for all
using (false)
with check (false);

-- 이미 contact_submissions가 있는 DB에 첨부 컬럼만 추가할 때
alter table public.contact_submissions
  add column if not exists attachment_paths text[] not null default '{}';

-- 문의 첨부 이미지(비공개, API에서 Service Role로만 업로드)
insert into storage.buckets (id, name, public)
values ('contact-attachments', 'contact-attachments', false)
on conflict (id) do nothing;
