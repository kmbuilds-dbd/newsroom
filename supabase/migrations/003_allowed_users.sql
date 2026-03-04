-- Whitelist of emails allowed to sign in
create table allowed_users (
  email text primary key,
  created_at timestamptz not null default now()
);

-- Seed with initial user
insert into allowed_users (email) values ('kunalmorparia@gmail.com');
