-- Historial del paso 8.
-- Ejecutar en el editor SQL de Supabase. La clave publishable no puede crear tablas.
-- Cada fila guarda el reporte completo: texto, niveles, traducción y el recorrido visual.

create table if not exists public.analisis (
  id uuid primary key default gen_random_uuid(),
  creado_en timestamptz not null default now(),
  producto text not null,
  nivel text not null check (nivel in ('bajo', 'moderado', 'alto')),
  reporte jsonb not null
);

create index if not exists analisis_creado_en_idx
  on public.analisis (creado_en desc);

grant select, insert on public.analisis to anon, authenticated;

alter table public.analisis enable row level security;

drop policy if exists "La app puede leer el historial" on public.analisis;
create policy "La app puede leer el historial"
  on public.analisis
  for select
  to anon, authenticated
  using (true);

drop policy if exists "La app puede guardar un análisis" on public.analisis;
create policy "La app puede guardar un análisis"
  on public.analisis
  for insert
  to anon, authenticated
  with check (true);
