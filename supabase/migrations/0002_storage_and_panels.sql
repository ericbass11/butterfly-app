-- ============================================================================
-- App Butterfly — Migration 0002
-- (1) Bucket privado para fotos das refeições (Supabase Storage)
-- (2) Ajustes de RLS para os painéis de Parceiro e Admin lerem os dados
-- Rode no SQL Editor DEPOIS da 0001_init.sql.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- (1) Storage: bucket privado "meal-photos"
-- Cada usuária só acessa arquivos dentro da própria pasta (prefixo = seu id).
-- Parceiro/Admin podem ler (acompanhamento clínico).
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('meal-photos', 'meal-photos', false)
on conflict (id) do nothing;

drop policy if exists "meal_photos_insert_own" on storage.objects;
create policy "meal_photos_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'meal-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "meal_photos_select" on storage.objects;
create policy "meal_photos_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'meal-photos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.current_app_role() in ('admin', 'partner')
    )
  );

drop policy if exists "meal_photos_delete_own" on storage.objects;
create policy "meal_photos_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'meal-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- (2) RLS para os painéis: Parceiro e Admin precisam LER perfis e anamneses
-- de outras usuárias (somente leitura). Escrita continua restrita à dona.
-- ---------------------------------------------------------------------------

-- profiles: leitura para própria dona, admin e parceiro
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select using (
    auth.uid() = id or public.current_app_role() in ('admin', 'partner')
  );

-- anamneses: substitui a política "for all" por leitura ampliada + escrita própria.
-- (Evita que parceiro/admin possam APAGAR anamneses de terceiros.)
drop policy if exists "anamneses_rw_own" on public.anamneses;
drop policy if exists "anamneses_select" on public.anamneses;
drop policy if exists "anamneses_insert_own" on public.anamneses;

create policy "anamneses_select" on public.anamneses
  for select using (
    auth.uid() = user_id or public.current_app_role() in ('admin', 'partner')
  );

create policy "anamneses_insert_own" on public.anamneses
  for insert with check (auth.uid() = user_id);
