-- ============================================================================
-- App Butterfly — Migration 0006
-- Conquistas (badges) desbloqueadas por usuária, guardadas no estado do programa.
-- Rode no SQL Editor DEPOIS da 0005.
-- ============================================================================

alter table public.program_state
  add column if not exists badges text[] not null default '{}';
