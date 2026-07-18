-- ============================================================================
-- App Butterfly — Schema inicial (MVP Fase 1)
-- Postgres + RLS (Supabase). Rode no SQL Editor do seu projeto.
-- Dados de saúde são sensíveis: RLS garante que cada usuária só acessa os
-- próprios registros (RNF02 — LGPD/HIPAA básico).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- profiles: 1:1 com auth.users, guarda papel (RBAC) e dados públicos
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  name       text not null default '',
  email      text,
  role       text not null default 'patient' check (role in ('patient', 'partner', 'admin')),
  avatar_url text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- anamneses: respostas da triagem clínica (RF02)
-- ---------------------------------------------------------------------------
create table if not exists public.anamneses (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references auth.users (id) on delete cascade,
  goal                    text,
  age                     int,
  has_diabetes            boolean not null default false,
  has_hypertension        boolean not null default false,
  is_pregnant             boolean not null default false,
  eating_disorder_history boolean not null default false,
  medications             text,
  observations            text,
  risk_level              text,
  requires_partner        boolean not null default false,
  created_at              timestamptz not null default now()
);
create index if not exists anamneses_user_id_idx on public.anamneses (user_id);

-- ---------------------------------------------------------------------------
-- program_state: estado do programa de 45 dias (1 linha por usuária)
-- ---------------------------------------------------------------------------
create table if not exists public.program_state (
  user_id           uuid primary key references auth.users (id) on delete cascade,
  start_date        timestamptz not null default now(),
  day               int not null default 1,
  points            int not null default 0,
  stage             text not null default 'larva' check (stage in ('larva', 'casulo', 'borboleta')),
  today_checkins    jsonb not null default '{}'::jsonb,
  last_checkin_date date,
  streak            int not null default 0,
  onboarded         boolean not null default false,
  updated_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- meals: evidências das refeições (RF05). Foto em base64 (MVP).
-- ---------------------------------------------------------------------------
create table if not exists public.meals (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  image      text,
  note       text,
  created_at timestamptz not null default now()
);
create index if not exists meals_user_id_idx on public.meals (user_id);

-- ---------------------------------------------------------------------------
-- Função utilitária: papel da usuária autenticada (para políticas de admin).
-- security definer evita recursão de RLS ao ler a própria tabela profiles.
-- ---------------------------------------------------------------------------
create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles      enable row level security;
alter table public.anamneses     enable row level security;
alter table public.program_state enable row level security;
alter table public.meals         enable row level security;

-- profiles: cada uma lê/edita o próprio; admin lê todos
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id or public.current_app_role() = 'admin');

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- anamneses: própria dona (admin lê todas)
drop policy if exists "anamneses_rw_own" on public.anamneses;
create policy "anamneses_rw_own" on public.anamneses
  for all using (auth.uid() = user_id or public.current_app_role() = 'admin')
  with check (auth.uid() = user_id);

-- program_state: própria dona (parceiro e admin leem para acompanhamento)
drop policy if exists "program_select" on public.program_state;
create policy "program_select" on public.program_state
  for select using (auth.uid() = user_id or public.current_app_role() in ('admin', 'partner'));

drop policy if exists "program_insert_own" on public.program_state;
create policy "program_insert_own" on public.program_state
  for insert with check (auth.uid() = user_id);

drop policy if exists "program_update_own" on public.program_state;
create policy "program_update_own" on public.program_state
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- meals: própria dona (parceiro e admin leem para acompanhamento)
drop policy if exists "meals_select" on public.meals;
create policy "meals_select" on public.meals
  for select using (auth.uid() = user_id or public.current_app_role() in ('admin', 'partner'));

drop policy if exists "meals_insert_own" on public.meals;
create policy "meals_insert_own" on public.meals
  for insert with check (auth.uid() = user_id);

drop policy if exists "meals_delete_own" on public.meals;
create policy "meals_delete_own" on public.meals
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Trigger: cria o profile automaticamente quando um usuário se cadastra.
-- name e role vêm do metadata enviado no signup (options.data).
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.raw_user_meta_data ->> 'role', 'patient')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
