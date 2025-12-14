CREATE EXTENSION IF NOT EXISTS pgcrypto;

create table person (
  id serial primary key,
  email text not null unique,
  password text not null
);

create table log_entry (
  id serial primary key,
  person_id integer not null,
  created_at timestamp not null default current_timestamp,

  text_content text not null,
  latitude real not null,
  longitude real not null,

  constraint fk_person foreign key (person_id) references person(id)
);

create table image_attachment (
  id uuid primary key default gen_random_uuid(),
  log_entry_id integer not null,
  created_at timestamp not null default current_timestamp,

  constraint fk_log_entry foreign key (log_entry_id) references log_entry(id)
);

create table image (
  attachment_id uuid not null,
  mime_type text not null,
  width integer not null,
  height integer not null,
  data bytea not null,
  
  constraint fk_attachment foreign key (attachment_id) references image_attachment(id)
);

create table audio_attachment (
  id uuid primary key default gen_random_uuid(),
  log_entry_id integer not null,
  created_at timestamp not null default current_timestamp,
  data bytea not null,

  constraint fk_log_entry foreign key (log_entry_id) references log_entry(id)
);
