-- ============================================================================
-- App Butterfly — Migration 0005
-- Permite que ADMIN gerencie o programa pelo app:
--  - editar o papel de outras usuárias (profiles)
-- O CRUD de conteúdo (lessons, ebooks, modules, knowledge_entries) já é liberado
-- para admin pelas políticas "*_admin_write" da migration 0003.
-- Rode no SQL Editor DEPOIS da 0004.
-- ============================================================================

-- Admin pode atualizar qualquer profile (ex.: promover a parceiro/admin).
drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update" on public.profiles
  for update
  using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');
