-- VEILØRIS / Case 01 persistence schema
-- Prepared for Supabase/PostgreSQL. The web app currently uses localStorage first.

create table if not exists public.veilorius_cases (
  id uuid primary key default gen_random_uuid(),
  case_number integer not null unique,
  title text not null,
  status text not null default 'locked' check (status in ('locked','available','solved')),
  difficulty integer check (difficulty between 1 and 10),
  estimated_minutes_min integer,
  estimated_minutes_max integer,
  created_at timestamptz not null default now()
);

create table if not exists public.veilorius_characters (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.veilorius_cases(id) on delete cascade,
  name text not null,
  role text not null,
  is_investigator boolean not null default false,
  is_victim boolean not null default false,
  is_primary_suspect boolean not null default false,
  unique(case_id, name)
);

create table if not exists public.veilorius_clues (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.veilorius_cases(id) on delete cascade,
  clue_key text not null,
  title text not null,
  description text not null,
  source text,
  unique(case_id, clue_key)
);

create table if not exists public.veilorius_statements (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.veilorius_cases(id) on delete cascade,
  character_id uuid references public.veilorius_characters(id) on delete cascade,
  statement_key text not null,
  question text not null,
  response text not null,
  requires_clue_key text,
  unlocks_clue_key text,
  unique(case_id, statement_key)
);

create table if not exists public.veilorius_connections (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.veilorius_cases(id) on delete cascade,
  connection_key text not null,
  clue_a_key text not null,
  clue_b_key text not null,
  interpretation text not null,
  unique(case_id, connection_key)
);

create table if not exists public.veilorius_progress (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.veilorius_cases(id) on delete cascade,
  player_key text not null,
  discovered_clues jsonb not null default '[]'::jsonb,
  asked_questions jsonb not null default '[]'::jsonb,
  visited_areas jsonb not null default '[]'::jsonb,
  connections jsonb not null default '[]'::jsonb,
  status text not null default 'investigating' check (status in ('investigating','solved')),
  updated_at timestamptz not null default now(),
  unique(case_id, player_key)
);

insert into public.veilorius_cases
  (case_number, title, status, difficulty, estimated_minutes_min, estimated_minutes_max)
values
  (1, 'O Último Temporal', 'available', 7, 10, 18)
on conflict (case_number) do update set
  title = excluded.title,
  status = excluded.status,
  difficulty = excluded.difficulty,
  estimated_minutes_min = excluded.estimated_minutes_min,
  estimated_minutes_max = excluded.estimated_minutes_max;

-- Seed the 20 occupants described by Case 01.
with c as (
  select id from public.veilorius_cases where case_number = 1
)
insert into public.veilorius_characters (case_id, name, role, is_investigator, is_victim, is_primary_suspect)
select c.id, v.name, v.role, v.is_investigator, v.is_victim, v.is_primary_suspect
from c
cross join (values
  ('Adrian Vale','Investigador / analista',true,false,false),
  ('Samuel Crowe','Investigador / interrogador',true,false,false),
  ('Elias Vane','Capitão / vítima',false,true,false),
  ('Marcus Rook','Primeiro imediato',false,false,true),
  ('Helena Graves','Navegadora',false,false,true),
  ('Tobias Flint','Cozinheiro',false,false,true),
  ('Rowan Pike','Contramestre',false,false,true),
  ('Clara Bell','Médica',false,false,false),
  ('Silas Reed','Armeiro',false,false,false),
  ('Nora Finch','Mantimentos',false,false,false),
  ('Gideon Marsh','Carpinteiro',false,false,false),
  ('Eliza Wren','Costureira',false,false,false),
  ('Hugo Black','Vigia',false,false,false),
  ('Vincent Cole','Responsável pela carga',false,false,false),
  ('Miriam Locke','Registros',false,false,false),
  ('Arthur Grey','Marinheiro veterano',false,false,false),
  ('Beatrice Shaw','Marinheira',false,false,false),
  ('Daniel Cross','Aprendiz / infiltrado',false,false,true),
  ('Thomas Ash','Animais / carga viva',false,false,false),
  ('Rose Mercer','Auxiliar',false,false,false)
) as v(name,role,is_investigator,is_victim,is_primary_suspect)
on conflict (case_id, name) do update set
  role = excluded.role,
  is_investigator = excluded.is_investigator,
  is_victim = excluded.is_victim,
  is_primary_suspect = excluded.is_primary_suspect;
