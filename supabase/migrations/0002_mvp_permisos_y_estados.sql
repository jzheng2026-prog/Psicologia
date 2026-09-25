-- =========================================================
-- CONECTADOS — Migración 0002 (MVP)
-- 1. Arregla la recursión infinita en las políticas que consultan
--    miembros_pareja desde dentro de miembros_pareja (error 42P17).
-- 2. Estado 'inactiva': la pareja nace inactiva y pasa a 'activa'
--    automáticamente cuando se unen sus dos miembros.
-- 3. Permisos que necesita el lado de la pareja y el seguimiento.
-- 4. Retos: quién y cuándo se completó.
-- 5. Sesiones: la pareja no puede leer las notas privadas.
-- 6. Invitaciones: el psicólogo puede renovar un enlace caducado.
-- =========================================================

-- ---------------------------------------------------------
-- 1. RLS sin recursión
-- ---------------------------------------------------------
-- La política de miembros_pareja se consultaba a sí misma, así que
-- cualquier lectura de la tabla (y de retos/sesiones, que la usan)
-- fallaba, también para el psicólogo. Esta función lee la pareja del
-- usuario saltándose RLS (security definer), lo que corta el ciclo.
create or replace function public.pareja_del_usuario()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select pareja_id from miembros_pareja where id = auth.uid()
$$;

revoke all on function public.pareja_del_usuario() from public;
grant execute on function public.pareja_del_usuario() to authenticated;

drop policy if exists "miembros_select_propia_pareja" on miembros_pareja;
create policy "miembros_select_propia_pareja"
  on miembros_pareja for select
  using (id = auth.uid() or pareja_id = public.pareja_del_usuario());

drop policy if exists "retos_select_miembro" on retos;
create policy "retos_select_miembro"
  on retos for select
  using (pareja_id = public.pareja_del_usuario());

drop policy if exists "retos_update_miembro" on retos;
create policy "retos_update_miembro"
  on retos for update
  using (pareja_id = public.pareja_del_usuario());

-- ---------------------------------------------------------
-- 2. Estado 'inactiva' hasta que se unan los dos miembros
-- ---------------------------------------------------------
alter table parejas drop constraint if exists parejas_estado_check;
alter table parejas
  add constraint parejas_estado_check
  check (estado in ('inactiva', 'activa', 'pausada', 'finalizada'));
alter table parejas alter column estado set default 'inactiva';

-- Parejas existentes que aún no están completas
update parejas p
set estado = 'inactiva'
where p.estado = 'activa'
  and (select count(*) from miembros_pareja mp where mp.pareja_id = p.id) < 2;

-- Al unirse el segundo miembro, la pareja se activa sola.
-- Solo desde 'inactiva': si el psicólogo la pausó o finalizó, se respeta.
create or replace function public.activar_pareja_completa()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from miembros_pareja where pareja_id = new.pareja_id) >= 2 then
    update parejas
    set estado = 'activa'
    where id = new.pareja_id and estado = 'inactiva';
  end if;
  return new;
end;
$$;

drop trigger if exists miembros_pareja_activar on miembros_pareja;
create trigger miembros_pareja_activar
  after insert on miembros_pareja
  for each row execute function public.activar_pareja_completa();

-- ---------------------------------------------------------
-- 3. Permisos del lado de la pareja y nombres visibles
-- ---------------------------------------------------------
-- El miembro ve su propia pareja
drop policy if exists "parejas_select_miembro" on parejas;
create policy "parejas_select_miembro"
  on parejas for select
  using (id = public.pareja_del_usuario());

-- El psicólogo ve el perfil (nombre, email) de los miembros de sus parejas
drop policy if exists "perfiles_select_psicologo_de_miembros" on perfiles;
create policy "perfiles_select_psicologo_de_miembros"
  on perfiles for select
  using (
    exists (
      select 1
      from miembros_pareja mp
      join parejas p on p.id = mp.pareja_id
      where mp.id = perfiles.id
        and p.psicologo_id = auth.uid()
    )
  );

-- El miembro ve el perfil del otro miembro y el de su psicólogo
drop policy if exists "perfiles_select_misma_pareja" on perfiles;
create policy "perfiles_select_misma_pareja"
  on perfiles for select
  using (
    id in (
      select mp.id from miembros_pareja mp
      where mp.pareja_id = public.pareja_del_usuario()
    )
    or id = (
      select p.psicologo_id from parejas p
      where p.id = public.pareja_del_usuario()
    )
  );

-- ---------------------------------------------------------
-- 4. Retos: quién y cuándo lo completó
-- ---------------------------------------------------------
alter table retos add column if not exists completado_en timestamptz;
alter table retos add column if not exists completado_por uuid references perfiles(id);

-- ---------------------------------------------------------
-- 5. Sesiones: la pareja lee solo por la vista, sin "notas"
-- ---------------------------------------------------------
-- Con security_invoker la pareja necesitaba select sobre la tabla,
-- lo que le permitía leer las notas privadas pidiendo la tabla directa.
-- Ahora la tabla es solo del psicólogo y la vista filtra por la pareja
-- del usuario (se ejecuta con los permisos de su dueño).
drop policy if exists "sesiones_select_miembro" on sesiones;

drop view if exists sesiones_pareja;
create view sesiones_pareja as
  select id, pareja_id, fecha, hora, duracion_minutos, estado, creado_en
  from sesiones
  where pareja_id = public.pareja_del_usuario();

revoke all on sesiones_pareja from anon;
grant select on sesiones_pareja to authenticated;

-- ---------------------------------------------------------
-- 6. Invitaciones: renovar un enlace caducado
-- ---------------------------------------------------------
drop policy if exists "invitaciones_update_psicologo" on invitaciones;
create policy "invitaciones_update_psicologo"
  on invitaciones for update
  using (
    exists (
      select 1 from parejas p
      where p.id = invitaciones.pareja_id
        and p.psicologo_id = auth.uid()
    )
  );
