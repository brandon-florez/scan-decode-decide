-- Tabla de símbolos del paso 4.
-- Ejecutar en el editor SQL de Supabase. La clave publishable no puede crear tablas.

create table if not exists public.ingredientes (
  nombre text primary key,
  codigo text,
  significado text not null,
  nivel text not null check (nivel in ('bajo', 'moderado', 'alto'))
);

grant select on public.ingredientes to anon, authenticated;

alter table public.ingredientes enable row level security;

drop policy if exists "La app puede leer ingredientes" on public.ingredientes;
create policy "La app puede leer ingredientes"
  on public.ingredientes
  for select
  to anon, authenticated
  using (true);

insert into public.ingredientes (nombre, codigo, significado, nivel)
values
  ('jarabe de maíz de alta fructosa', null, 'Exceso de azúcares procesados', 'alto'),
  ('glutamato monosódico', 'E621', 'Aditivo potenciador de sabor, moderar consumo', 'moderado')
on conflict (nombre) do update
  set codigo = excluded.codigo,
      significado = excluded.significado,
      nivel = excluded.nivel;
