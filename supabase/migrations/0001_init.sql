-- =========================================================
-- CONECTADOS — Migración inicial (MVP)
-- Tablas + Row Level Security (RLS)
-- =========================================================

-- Extensión necesaria para gen_random_uuid()
create extension if not exists "pgcrypto";

-- =========================================================
-- 1. PERFILES (tabla central de usuarios)
-- =========================================================
create table perfiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  rol         text not null check (rol in ('psicologo', 'miembro_pareja')),
  nombre      text not null,
  email       text not null,
  creado_en   timestamptz not null default now()
);

alter table perfiles enable row level security;

-- Cada usuario ve y edita solo su propio perfil
create policy "perfiles_select_propio"
  on perfiles for select
  using (id = auth.uid());

create policy "perfiles_update_propio"
  on perfiles for update
  using (id = auth.uid());

-- El insert de perfiles lo hace el propio flujo de registro (trigger o server route),
-- normalmente no hace falta política de insert para el cliente.

-- =========================================================
-- 2. PSICOLOGOS (detalle de perfil con rol psicólogo)
-- =========================================================
create table psicologos (
  id                 uuid primary key references perfiles(id) on delete cascade,
  numero_colegiado   text,
  especialidad       text,
  creado_en          timestamptz not null default now()
);

alter table psicologos enable row level security;

create policy "psicologos_select_propio"
  on psicologos for select
  using (id = auth.uid());

create policy "psicologos_update_propio"
  on psicologos for update
  using (id = auth.uid());

-- =========================================================
-- 3. PAREJAS (entidad central)
-- =========================================================
create table parejas (
  id             uuid primary key default gen_random_uuid(),
  psicologo_id   uuid not null references psicologos(id) on delete cascade,
  nombre         text,                 -- etiqueta interna, ej. "Juan y Ana"
  estado         text not null default 'activa'
                   check (estado in ('activa', 'pausada', 'finalizada')),
  creado_en      timestamptz not null default now()
);

alter table parejas enable row level security;

-- El psicólogo ve/gestiona solo sus propias parejas
create policy "parejas_select_psicologo"
  on parejas for select
  using (psicologo_id = auth.uid());

create policy "parejas_insert_psicologo"
  on parejas for insert
  with check (psicologo_id = auth.uid());

create policy "parejas_update_psicologo"
  on parejas for update
  using (psicologo_id = auth.uid());

-- =========================================================
-- 4. INVITACIONES
-- NOTA: el canjeo de esta tabla (aceptar invitación + crear cuenta)
-- se gestiona desde una Route Handler de Next.js con la SECRET KEY
-- de Supabase (server-side), porque el usuario invitado aún no tiene
-- sesión ni auth.uid(). El cliente nunca debe leer esta tabla directo.
-- =========================================================
create table invitaciones (
  id              uuid primary key default gen_random_uuid(),
  pareja_id       uuid not null references parejas(id) on delete cascade,
  email           text not null,
  token           text not null unique,
  rol_en_pareja   text not null check (rol_en_pareja in ('A', 'B')),
  aceptada        boolean not null default false,
  creado_en       timestamptz not null default now(),
  expira_en       timestamptz not null default (now() + interval '7 days')
);

alter table invitaciones enable row level security;

-- Solo el psicólogo dueño de la pareja puede ver/crear invitaciones desde el cliente
create policy "invitaciones_select_psicologo"
  on invitaciones for select
  using (
    exists (
      select 1 from parejas p
      where p.id = invitaciones.pareja_id
        and p.psicologo_id = auth.uid()
    )
  );

create policy "invitaciones_insert_psicologo"
  on invitaciones for insert
  with check (
    exists (
      select 1 from parejas p
      where p.id = invitaciones.pareja_id
        and p.psicologo_id = auth.uid()
    )
  );

-- No hay política de select pública por token: esa lectura puntual
-- para validar el token en /invitacion/[token] se hace con la secret key
-- desde el servidor (Route Handler), no desde el cliente.

-- =========================================================
-- 5. MIEMBROS_PAREJA (une un perfil a una pareja, rol A/B)
-- =========================================================
create table miembros_pareja (
  id              uuid primary key references perfiles(id) on delete cascade,
  pareja_id       uuid not null references parejas(id) on delete cascade,
  rol_en_pareja   text not null check (rol_en_pareja in ('A', 'B')),
  invitacion_id   uuid references invitaciones(id),
  creado_en       timestamptz not null default now(),
  unique (pareja_id, rol_en_pareja)
);

alter table miembros_pareja enable row level security;

-- Cada miembro ve su propia fila y la de su pareja (para saber quién es el otro)
create policy "miembros_select_propia_pareja"
  on miembros_pareja for select
  using (
    id = auth.uid()
    or pareja_id in (
      select pareja_id from miembros_pareja where id = auth.uid()
    )
  );

-- El psicólogo dueño de la pareja también puede ver sus miembros
create policy "miembros_select_psicologo"
  on miembros_pareja for select
  using (
    exists (
      select 1 from parejas p
      where p.id = miembros_pareja.pareja_id
        and p.psicologo_id = auth.uid()
    )
  );

-- El insert real (alta del miembro) se hace server-side al canjear la invitación,
-- con la secret key, así que no exponemos policy de insert al cliente.

-- =========================================================
-- 6. RETOS
-- =========================================================
create table retos (
  id                 uuid primary key default gen_random_uuid(),
  pareja_id          uuid not null references parejas(id) on delete cascade,
  creado_por         uuid not null references psicologos(id),
  destinatario_id    uuid references miembros_pareja(id), -- null = ambos miembros
  titulo             text not null,
  descripcion        text,
  fecha_inicio       date,
  fecha_limite       date,
  estado             text not null default 'iniciado'
                        check (estado in ('iniciado', 'en_curso', 'finalizado')),
  reflexion          text,   -- añadida por la pareja al completar
  creado_en          timestamptz not null default now()
);

alter table retos enable row level security;

-- Psicólogo: gestiona retos de sus parejas
create policy "retos_select_psicologo"
  on retos for select
  using (
    exists (
      select 1 from parejas p
      where p.id = retos.pareja_id and p.psicologo_id = auth.uid()
    )
  );

create policy "retos_insert_psicologo"
  on retos for insert
  with check (
    exists (
      select 1 from parejas p
      where p.id = retos.pareja_id and p.psicologo_id = auth.uid()
    )
  );

create policy "retos_update_psicologo"
  on retos for update
  using (
    exists (
      select 1 from parejas p
      where p.id = retos.pareja_id and p.psicologo_id = auth.uid()
    )
  );

-- Pareja: ve los retos de su propia pareja
create policy "retos_select_miembro"
  on retos for select
  using (
    pareja_id in (
      select pareja_id from miembros_pareja where id = auth.uid()
    )
  );

-- Pareja: puede actualizar (completar) los retos de su pareja
-- (en la app limitamos por UI a solo tocar estado/reflexion)
create policy "retos_update_miembro"
  on retos for update
  using (
    pareja_id in (
      select pareja_id from miembros_pareja where id = auth.uid()
    )
  );

-- =========================================================
-- 7. REGISTROS_EMOCIONALES
-- Uno por persona y día. Privacidad: por defecto SOLO el propio
-- miembro y el psicólogo de la pareja lo ven (no el otro miembro),
-- según el riesgo de privacidad señalado en el análisis de producto.
-- =========================================================
create table registros_emocionales (
  id            uuid primary key default gen_random_uuid(),
  miembro_id    uuid not null references miembros_pareja(id) on delete cascade,
  emocion       text not null,               -- ej. 'muy_bien','bien','normal','mal','muy_mal'
  intensidad    int check (intensidad between 1 and 10),
  comentario    text,
  fecha         date not null default current_date,
  creado_en     timestamptz not null default now(),
  unique (miembro_id, fecha)
);

alter table registros_emocionales enable row level security;

-- El propio miembro gestiona sus registros
create policy "registros_select_propio"
  on registros_emocionales for select
  using (miembro_id = auth.uid());

create policy "registros_insert_propio"
  on registros_emocionales for insert
  with check (miembro_id = auth.uid());

create policy "registros_update_propio"
  on registros_emocionales for update
  using (miembro_id = auth.uid());

-- El psicólogo de la pareja puede ver los registros de ambos miembros
create policy "registros_select_psicologo"
  on registros_emocionales for select
  using (
    exists (
      select 1
      from miembros_pareja mp
      join parejas p on p.id = mp.pareja_id
      where mp.id = registros_emocionales.miembro_id
        and p.psicologo_id = auth.uid()
    )
  );

-- =========================================================
-- 8. SESIONES
-- =========================================================
create table sesiones (
  id                  uuid primary key default gen_random_uuid(),
  pareja_id           uuid not null references parejas(id) on delete cascade,
  fecha               date not null,
  hora                time not null,
  duracion_minutos    int not null default 60,
  estado              text not null default 'programada'
                         check (estado in ('programada', 'realizada', 'cancelada')),
  notas               text,   -- notas privadas del psicólogo
  creado_en           timestamptz not null default now()
);

alter table sesiones enable row level security;

-- Psicólogo: gestiona sesiones de sus parejas
create policy "sesiones_select_psicologo"
  on sesiones for select
  using (
    exists (
      select 1 from parejas p
      where p.id = sesiones.pareja_id and p.psicologo_id = auth.uid()
    )
  );

create policy "sesiones_insert_psicologo"
  on sesiones for insert
  with check (
    exists (
      select 1 from parejas p
      where p.id = sesiones.pareja_id and p.psicologo_id = auth.uid()
    )
  );

create policy "sesiones_update_psicologo"
  on sesiones for update
  using (
    exists (
      select 1 from parejas p
      where p.id = sesiones.pareja_id and p.psicologo_id = auth.uid()
    )
  );

-- Pareja: solo lectura de sus propias sesiones (fecha/hora), sin ver "notas"
-- Nota: RLS no filtra columnas, solo filas. Si "notas" debe ser invisible
-- para la pareja, hay que exponerlo via una vista (ver comentario final).
create policy "sesiones_select_miembro"
  on sesiones for select
  using (
    pareja_id in (
      select pareja_id from miembros_pareja where id = auth.uid()
    )
  );

-- =========================================================
-- 9. VISTA sesiones_pareja
-- Expone las sesiones SIN la columna "notas" (privada del psicólogo).
-- La app de la pareja debe leer de esta vista, no de la tabla "sesiones".
-- =========================================================
create view sesiones_pareja as
  select
    id,
    pareja_id,
    fecha,
    hora,
    duracion_minutos,
    estado,
    creado_en
  from sesiones;

-- Las vistas heredan RLS de las tablas subyacentes vía security_invoker
alter view sesiones_pareja set (security_invoker = true);
