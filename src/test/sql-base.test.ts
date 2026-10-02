import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";

import { asRole, createTestDb, createUser } from "./db";

const A = "11111111-1111-1111-1111-111111111111";
const B = "22222222-2222-2222-2222-222222222222";

describe("SQL 001: esquema base, RLS y trigger", () => {
  let db: PGlite;

  beforeAll(async () => {
    db = await createTestDb({ upTo: "001" });
    await createUser(db, A, { full_name: "Ana López", country: "hn" });
    await createUser(db, B, { name: "Beto" });
  });

  it("crea el perfil al registrarse", async () => {
    const { rows } = await db.query<{ full_name: string; country: string; plan: string }>(
      `select full_name, country, plan from public.profiles where id = $1`,
      [A],
    );
    expect(rows[0]).toEqual({ full_name: "Ana López", country: "HN", plan: "free" });
  });

  it("cada usuario solo ve sus configuraciones", async () => {
    await asRole(db, "authenticated", A, () =>
      db.query(
        `insert into public.saved_configs (template_slug, name, config) values ('factura-con-isv', 'Mi factura', '{"a":1}')`,
      ),
    );
    const mine = await asRole(db, "authenticated", A, () =>
      db.query(`select * from public.saved_configs`),
    );
    const theirs = await asRole(db, "authenticated", B, () =>
      db.query(`select * from public.saved_configs`),
    );
    expect(mine.rows).toHaveLength(1);
    expect(theirs.rows).toHaveLength(0);
  });

  it("no permite crear configuraciones a nombre de otro usuario", async () => {
    await expect(
      asRole(db, "authenticated", B, () =>
        db.query(
          `insert into public.saved_configs (user_id, template_slug, name) values ($1, 'kardex', 'x')`,
          [A],
        ),
      ),
    ).rejects.toThrow();
  });

  it("el usuario no puede cambiarse el plan", async () => {
    await expect(
      asRole(db, "authenticated", A, () =>
        db.query(`update public.profiles set plan = 'pro' where id = $1`, [A]),
      ),
    ).rejects.toThrow(/permission denied/);
    const ok = await asRole(db, "authenticated", A, () =>
      db.query(`update public.profiles set full_name = 'Ana M.' where id = $1`, [A]),
    );
    expect(ok.affectedRows).toBe(1);
  });

  it("downloads: anónimos insertan sin usuario y cada quien lee solo lo suyo", async () => {
    await asRole(db, "anon", null, () =>
      db.query(`insert into public.downloads (template_slug, country) values ('kardex', 'HN')`),
    );
    await expect(
      asRole(db, "anon", null, () =>
        db.query(
          `insert into public.downloads (user_id, template_slug, country) values ($1, 'kardex', 'HN')`,
          [A],
        ),
      ),
    ).rejects.toThrow();
    await asRole(db, "authenticated", A, () =>
      db.query(
        `insert into public.downloads (user_id, template_slug, country) values ($1, 'factura-con-isv', 'HN')`,
        [A],
      ),
    );
    const seen = await asRole(db, "authenticated", A, () =>
      db.query(`select * from public.downloads`),
    );
    expect(seen.rows).toHaveLength(1);
    await expect(
      asRole(db, "anon", null, () => db.query(`select * from public.downloads`)),
    ).rejects.toThrow(/permission denied/);
  });

  it("el script se puede ejecutar dos veces", async () => {
    const fs = await import("node:fs");
    const sql = fs.readFileSync("supabase/sql/001_esquema_base.sql", "utf8");
    await expect(db.exec(sql)).resolves.toBeDefined();
  });
});
