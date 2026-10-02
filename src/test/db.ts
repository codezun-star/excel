import fs from "node:fs";
import path from "node:path";

import { PGlite } from "@electric-sql/pglite";

/**
 * Base de datos Postgres en memoria (PGlite) con lo mínimo de Supabase para
 * probar los scripts SQL: roles anon/authenticated/service_role, el esquema
 * auth con auth.users y auth.uid(), y el esquema storage.
 */
const SUPABASE_STUBS = `
do $$ begin
  create role anon nologin;
exception when duplicate_object then null; end $$;
do $$ begin
  create role authenticated nologin;
exception when duplicate_object then null; end $$;
do $$ begin
  create role service_role nologin bypassrls;
exception when duplicate_object then null; end $$;

create schema if not exists auth;
create table if not exists auth.users (
  id uuid primary key,
  email text,
  raw_user_meta_data jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(nullif(current_setting('request.jwt.claims', true), '')::json ->> 'sub', '')::uuid
$$;
create or replace function auth.role() returns text language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), '')::json ->> 'role', 'anon')
$$;
grant usage on schema auth to anon, authenticated, service_role;
grant execute on all functions in schema auth to anon, authenticated, service_role;

create schema if not exists storage;
create table if not exists storage.buckets (
  id text primary key, name text, public boolean default false,
  file_size_limit bigint, allowed_mime_types text[]
);
create table if not exists storage.objects (
  id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner uuid
);
create or replace function storage.foldername(name text) returns text[] language sql immutable as $$
  select string_to_array(name, '/')
$$;
grant usage on schema public to anon, authenticated, service_role;
`;

export async function createTestDb(): Promise<PGlite> {
  const db = new PGlite();
  await db.exec(SUPABASE_STUBS);
  const dir = path.join(process.cwd(), "supabase", "sql");
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const file of files) {
    const sql = fs.readFileSync(path.join(dir, file), "utf8");
    try {
      await db.exec(sql);
    } catch (err) {
      throw new Error(`Error al ejecutar ${file}: ${(err as Error).message}`);
    }
  }
  // service_role tiene todos los permisos en public (como en Supabase)
  await db.exec(`
    grant all on all tables in schema public to service_role;
    grant all on all sequences in schema public to service_role;
    grant execute on all functions in schema public to service_role;
  `);
  return db;
}

/** Ejecuta una función como un rol de Supabase con un usuario (sub) dado. */
export async function asRole<T>(
  db: PGlite,
  role: "anon" | "authenticated" | "service_role",
  userId: string | null,
  fn: () => Promise<T>,
): Promise<T> {
  const claims = JSON.stringify({ sub: userId ?? "", role });
  await db.exec(`set role ${role}; select set_config('request.jwt.claims', '${claims}', false);`);
  try {
    return await fn();
  } finally {
    await db.exec(`reset role; select set_config('request.jwt.claims', '', false);`);
  }
}

export async function createUser(
  db: PGlite,
  id: string,
  meta: Record<string, unknown> = {},
): Promise<void> {
  await db.query(`insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3)`, [
    id,
    `${id.slice(0, 8)}@test.hn`,
    JSON.stringify(meta),
  ]);
}
