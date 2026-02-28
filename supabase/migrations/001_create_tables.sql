create extension if not exists "uuid-ossp";

create table stories (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  subtitle text not null,
  event_query text not null,
  status text not null default 'developing' check (status in ('developing', 'concluded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table developments (
  id uuid primary key default uuid_generate_v4(),
  story_id uuid not null references stories(id) on delete cascade,
  date text not null,
  date_sort timestamptz not null,
  source_label text not null,
  source_color text not null,
  headline text not null,
  summary text not null,
  sources jsonb not null default '[]',
  is_turning_point boolean not null default false,
  position int not null default 0
);

create index idx_developments_story_id on developments(story_id);
create index idx_stories_created_at on stories(created_at desc);
