import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Storage tenant-isolation guard.
 *
 * A policy called `storage_service_role_buckets_upload` was granted to
 * `{authenticated}` and checked nothing but `bucket_id`. Every authenticated
 * user of every tenant could write into six buckets under any path,
 * including another org's prefix in `credentials` and `personal-documents`.
 * It shipped because the NAME said one thing and the GRANT said another, and
 * nothing was watching the difference.
 *
 * Names drift. This watches the shape instead:
 *
 *  1. Every storage INSERT policy granted to `authenticated` must route
 *     through `private.caller_owns_org_prefix` — the single expression of
 *     "path segment 1 is an org you actually belong to". A policy that only
 *     filters `bucket_id` is the bug, restated.
 *  2. Service-only buckets get NO authenticated policy. `service_role` has
 *     rolbypassrls, so a policy for it is decoration at best and a hole at
 *     worst — which is precisely what happened.
 *
 * Static because CI has no live DB. It reads the migration that owns the
 * rule, so a future migration reintroducing an unscoped grant has to edit
 * this file to get past — which is the point: make it a decision, not an
 * accident.
 */
const ROOT = process.cwd();
const MIGRATIONS = join(ROOT, "supabase/migrations");

/** Buckets only a service client writes. They must never appear in an
 *  authenticated INSERT policy. */
const SERVICE_ONLY_BUCKETS = ["receipts", "proposals", "credentials", "personal-documents", "exports"];

function latestStorageMigration(): string {
  const files = readdirSync(MIGRATIONS)
    .filter((f) => f.endsWith(".sql") && f.includes("storage_upload_tenant_scoping"))
    .sort();
  const last = files[files.length - 1];
  if (!last) throw new Error("storage tenant-scoping migration is missing — the hole may be reopened");
  return readFileSync(join(MIGRATIONS, last), "utf8");
}

describe("storage writes are tenant-scoped", () => {
  const sql = latestStorageMigration();

  it("keeps the tenant rule in one named place", () => {
    expect(sql).toMatch(/caller_owns_org_prefix/);
    // The rule itself: path segment 1 = an org the caller actively belongs to.
    expect(sql).toMatch(/storage\.foldername\(object_name\)\)\[1\]/);
    expect(sql).toMatch(/m\.deleted_at is null/);
  });

  it("gates every authenticated upload on that rule, not on bucket_id alone", () => {
    const policy = sql.slice(sql.indexOf('CREATE POLICY "storage_org_scoped_upload"'));
    expect(policy).toMatch(/TO "authenticated"/);
    expect(policy).toMatch(/caller_owns_org_prefix/);
  });

  it("drops the unscoped grants that caused the incident", () => {
    expect(sql).toMatch(/DROP POLICY IF EXISTS "storage_service_role_buckets_upload"/);
    // Same shape, smaller radius: bucket_id='branding' with no tenant check.
    expect(sql).toMatch(/DROP POLICY IF EXISTS "branding_authenticated_write"/);
  });

  it("never grants authenticated write to a service-only bucket", () => {
    const policy = sql.slice(
      sql.indexOf('CREATE POLICY "storage_org_scoped_upload"'),
      sql.indexOf("DROP POLICY IF EXISTS \"storage_service_role_buckets_upload\""),
    );
    const leaked = SERVICE_ONLY_BUCKETS.filter((b) => new RegExp(`'${b}'`).test(policy));
    expect(
      leaked,
      `service-only bucket(s) in an authenticated INSERT policy — service_role bypasses RLS, so this can only be a hole:\n  ${leaked.join(
        "\n  ",
      )}`,
    ).toEqual([]);
  });
});
