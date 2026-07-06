-- RATIO schema v1 (voir RATIO_STARTER.md section 3)

create extension if not exists vector;

create type decision_status as enum ('proposed', 'decided', 'revisited', 'reversed');
create type decision_relation as enum ('supersedes', 'relates_to', 'conflicts_with');

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- étend auth.users (géré par Supabase Auth) avec le rattachement organisation
create table users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  org_id uuid references organizations (id) on delete set null,
  role text not null default 'member'
);

create table decisions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  title text not null,
  status decision_status not null default 'proposed',
  context text,
  options_json jsonb,
  decision_text text,
  rationale text,
  decider text,
  stakeholders text[],
  source_raw text,
  embedding vector(1536),
  tags text[],
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  created_by uuid references users (id)
);

create table decision_links (
  decision_id uuid not null references decisions (id) on delete cascade,
  related_decision_id uuid not null references decisions (id) on delete cascade,
  relation decision_relation not null,
  primary key (decision_id, related_decision_id, relation)
);

create index decisions_org_id_idx on decisions (org_id);
create index decisions_embedding_idx on decisions using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- RLS multi-tenant : hors scope MVP semaine 1, prévu en phase 2 (voir RATIO_STARTER.md section 4)
