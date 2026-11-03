/**
 * SIENVI AGENCY: FULL 16-MIGRATION CHAIN, PRIVILEGED SQL ACLs, AND
 * SYNTHETIC ENCRYPTED BACKUP & RESTORE VERIFICATION ON POSTGRESQL 17.6
 */

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import EmbeddedPostgres from "embedded-postgres";
import pg from "pg";
import {
  runEncryptedBackup,
  verifyAndRestoreEncryptedBackup,
} from "../scripts/pg17_encrypted_backup_restore.mjs";

const { Client } = pg;

const PG_PORT = 54339;
const SYNTHETIC_DB = "sienvi_synthetic_prod";
const RESTORE_DB = "sienvi_restore_disposable";
const TEST_PASSPHRASE = "Sienvi-GateA-Synthetic-Test-Key-2026!#99";

const SUPABASE_PLATFORM_BOOTSTRAP_SQL = `
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  CREATE EXTENSION IF NOT EXISTS "pgcrypto";

  DO $$
  BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
      CREATE ROLE anon NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
      CREATE ROLE authenticated NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'service_role') THEN
      CREATE ROLE service_role NOLOGIN BYPASSRLS;
    END IF;
  END $$;

  CREATE SCHEMA IF NOT EXISTS auth;
  CREATE SCHEMA IF NOT EXISTS storage;
  CREATE SCHEMA IF NOT EXISTS supabase_migrations;

  CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
    version text PRIMARY KEY,
    statements text[],
    name text
  );

  CREATE TABLE IF NOT EXISTS auth.users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE,
    raw_user_meta_data jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now()
  );

  CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
    SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
  $$;

  CREATE OR REPLACE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$
    SELECT COALESCE(NULLIF(current_setting('request.jwt.claim.role', true), ''), 'anon');
  $$;

  CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$
    SELECT jsonb_build_object(
      'sub', NULLIF(current_setting('request.jwt.claim.sub', true), ''),
      'role', COALESCE(NULLIF(current_setting('request.jwt.claim.role', true), ''), 'anon'),
      'email', COALESCE(current_setting('request.jwt.claim.email', true), '')
    );
  $$;

  CREATE TABLE IF NOT EXISTS storage.buckets (
    id text PRIMARY KEY,
    name text NOT NULL,
    public boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS storage.objects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    bucket_id text REFERENCES storage.buckets(id),
    name text,
    owner uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    metadata jsonb DEFAULT '{}'::jsonb
  );

  ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

  INSERT INTO storage.buckets (id, name, public)
  VALUES ('contracts', 'contracts', true), ('submissions', 'submissions', false)
  ON CONFLICT (id) DO NOTHING;

  GRANT USAGE ON SCHEMA public, auth, storage TO anon, authenticated, service_role;
  GRANT SELECT ON auth.users TO anon, authenticated, service_role;
  GRANT ALL ON storage.buckets, storage.objects TO service_role;
  GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated, anon;
`;

describe("PostgreSQL 17 Full Migration Chain, Privileged SQL & Encrypted Backup/Restore", () => {
  let ep;
  let adminClient;
  let backupManifest;

  before(async () => {
    ep = new EmbeddedPostgres({
      port: PG_PORT,
      databaseDir: "./data/pg17_migration_backup_test",
      persistent: false,
    });
    try {
      await ep.initialise();
    } catch {
      // already initialized
    }
    await ep.start();

    adminClient = ep.getPgClient();
    await adminClient.connect();

    await adminClient.query(`DROP DATABASE IF EXISTS ${SYNTHETIC_DB};`);
    await adminClient.query(`DROP DATABASE IF EXISTS ${RESTORE_DB};`);
    await adminClient.query(`CREATE DATABASE ${SYNTHETIC_DB} WITH ENCODING 'UTF8' LC_COLLATE='C' LC_CTYPE='C' TEMPLATE=template0;`);
    await adminClient.query(`CREATE DATABASE ${RESTORE_DB} WITH ENCODING 'UTF8' LC_COLLATE='C' LC_CTYPE='C' TEMPLATE=template0;`);
  });

  after(async () => {
    if (adminClient) await adminClient.end();
    if (ep) await ep.stop();
    // Clean up synthetic test backup files while keeping the protected directory ready
    if (backupManifest) {
      for (const art of Object.values(backupManifest.artifacts)) {
        if (fs.existsSync(art.encryptedPath)) fs.unlinkSync(art.encryptedPath);
      }
      const mPath = path.join(backupManifest.backupDirectory, `${backupManifest.backupId}.manifest.json`);
      if (fs.existsSync(mPath)) fs.unlinkSync(mPath);
    }
  });

  it("1. Applies the full 16-file ordered migration chain cleanly on PostgreSQL 17.6", async () => {
    const db = new Client({
      connectionString: `postgresql://postgres:password@localhost:${PG_PORT}/${SYNTHETIC_DB}`,
    });
    await db.connect();

    try {
      const verRes = await db.query("SELECT version();");
      assert.match(verRes.rows[0].version, /PostgreSQL 17\.6/);

      await db.query(SUPABASE_PLATFORM_BOOTSTRAP_SQL);

      const migrationDir = path.resolve("supabase/migrations");
      const files = fs
        .readdirSync(migrationDir)
        .filter((f) => f.endsWith(".sql"))
        .sort();

      assert.strictEqual(files.length, 16, "Expected exactly 16 ordered migrations");
      assert.strictEqual(files[14], "20261030000000_close_remaining_open_policies.sql");
      assert.strictEqual(files[15], "20261031000000_phase2b_operational_billing_subledger.sql");

      for (const file of files) {
        const version = file.split("_")[0];
        const sql = fs.readFileSync(path.join(migrationDir, file), "utf8");
        try {
          await db.query(sql);
        } catch (err) {
          throw new Error(`Migration ${file} failed: ${err.message}`);
        }
        await db.query(
          `INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES ($1, $2)`,
          [version, file]
        );
      }

      const migCount = await db.query(`SELECT count(*)::int AS cnt FROM supabase_migrations.schema_migrations;`);
      assert.strictEqual(migCount.rows[0].cnt, 16);
    } finally {
      await db.end();
    }
  });

  it("2. Enforces strict service_role EXECUTE privileges, blocks direct authenticated admin RPC bypass, and validates audit schema compatibility", async () => {
    const db = new Client({
      connectionString: `postgresql://postgres:password@localhost:${PG_PORT}/${SYNTHETIC_DB}`,
    });
    await db.connect();

    try {
      const fnSig =
        "public.record_payment_transaction(uuid,bigint,bigint,text,text,text,text,text,text,timestamptz,jsonb,text,jsonb,uuid,uuid)";
      const internalFnSig =
        "billing_internal.record_payment_transaction(uuid,bigint,bigint,text,text,text,text,text,text,timestamptz,jsonb,text,jsonb,uuid,uuid)";

      // Verify PostgreSQL ACLs directly: neither anon nor authenticated has EXECUTE on financial RPCs
      const aclRes = await db.query(`
        SELECT
          has_function_privilege('anon', '${fnSig}', 'EXECUTE') AS anon_exec_public,
          has_function_privilege('authenticated', '${fnSig}', 'EXECUTE') AS auth_exec_public,
          has_function_privilege('service_role', '${fnSig}', 'EXECUTE') AS service_exec_public,
          has_schema_privilege('anon', 'billing_internal', 'USAGE') AS anon_internal_schema,
          has_schema_privilege('authenticated', 'billing_internal', 'USAGE') AS auth_internal_schema,
          has_schema_privilege('service_role', 'billing_internal', 'USAGE') AS service_internal_schema,
          has_function_privilege('authenticated', '${internalFnSig}', 'EXECUTE') AS auth_exec_internal,
          has_function_privilege('service_role', '${internalFnSig}', 'EXECUTE') AS service_exec_internal,
          has_table_privilege('authenticated', 'public.billing_invoices', 'INSERT') AS auth_insert_invoices,
          has_table_privilege('authenticated', 'public.billing_invoices', 'UPDATE') AS auth_update_invoices,
          has_table_privilege('authenticated', 'public.billing_payments', 'INSERT') AS auth_insert_payments,
          has_table_privilege('authenticated', 'public.billing_exceptions', 'UPDATE') AS auth_update_exceptions;
      `);

      const acl = aclRes.rows[0];
      assert.strictEqual(acl.anon_exec_public, false, "anon must NOT have EXECUTE on public.record_payment_transaction");
      assert.strictEqual(acl.auth_exec_public, false, "authenticated must NOT have EXECUTE on public.record_payment_transaction (direct RPC bypass closed)");
      assert.strictEqual(acl.service_exec_public, true, "service_role MUST have EXECUTE on public.record_payment_transaction");
      assert.strictEqual(acl.anon_internal_schema, false, "anon must NOT have USAGE on billing_internal");
      assert.strictEqual(acl.auth_internal_schema, false, "authenticated must NOT have USAGE on billing_internal");
      assert.strictEqual(acl.service_internal_schema, true, "service_role must have USAGE on billing_internal");
      assert.strictEqual(acl.auth_exec_internal, false, "authenticated must NOT have EXECUTE on billing_internal function");
      assert.strictEqual(acl.service_exec_internal, true, "service_role must have EXECUTE on billing_internal function");
      assert.strictEqual(acl.auth_insert_invoices, false, "authenticated must NOT have INSERT on billing_invoices");
      assert.strictEqual(acl.auth_update_invoices, false, "authenticated must NOT have UPDATE on billing_invoices");
      assert.strictEqual(acl.auth_insert_payments, false, "authenticated must NOT have INSERT on billing_payments");
      assert.strictEqual(acl.auth_update_exceptions, false, "authenticated must NOT have UPDATE on billing_exceptions");

      // Seed synthetic users, client profile, subscription, and open invoice
      const adminUserRes = await db.query(
        `INSERT INTO auth.users (email) VALUES ('admin@sienvi.com') RETURNING id;`
      );
      const adminUserId = adminUserRes.rows[0].id;
      await db.query(
        `INSERT INTO public.user_roles (user_id, role) VALUES ($1, 'admin') ON CONFLICT (user_id, role) DO NOTHING;`,
        [adminUserId]
      );

      const clientUserRes = await db.query(
        `INSERT INTO auth.users (email) VALUES ('founder@clientbrand.com') RETURNING id;`
      );
      const clientUserId = clientUserRes.rows[0].id;

      const clientProfRes = await db.query(
        `INSERT INTO public.client_profiles (user_id, email, first_name, last_name, plan, subscription_status, contract_status)
         VALUES ($1, 'founder@clientbrand.com', 'Alex', 'Founder', 'custom', 'active', 'signed')
         RETURNING id;`,
        [clientUserId]
      );
      const clientProfileId = clientProfRes.rows[0].id;

      const subRes = await db.query(
        `INSERT INTO public.client_subscriptions (client_profile_id, label, plan, monthly_amount, subscription_status, is_primary)
         VALUES ($1, 'Enterprise Retainer', 'custom', 4947.00, 'active', true)
         RETURNING id;`,
        [clientProfileId]
      );
      const subId = subRes.rows[0].id;

      const invRes = await db.query(
        `INSERT INTO public.billing_invoices (
           client_profile_id, subscription_id, invoice_number, invoice_type, billing_channel,
           status, subtotal_amount_cents, tax_amount_cents, total_amount_cents,
           amount_paid_cents, amount_due_cents, currency, due_date
         ) VALUES (
           $1, $2, 'INV-SYNTH-2026-001', 'manual_retainer', 'manual_wire',
           'open', 494700, 0, 494700, 0, 494700, 'usd', now() + interval '7 days'
         ) RETURNING id;`,
        [clientProfileId, subId]
      );
      const invoiceId = invRes.rows[0].id;

      // 2a. Anonymous caller is blocked by PostgreSQL EXECUTE privilege revocation
      await db.query(`SET ROLE anon;`);
      await assert.rejects(
        () =>
          db.query(
            `SELECT public.record_payment_transaction($1, 494700, 0, 'usd', 'wire', 'WIRE-ANON', NULL, NULL, NULL, now(), '{}'::jsonb, 'anon attempt', '[]'::jsonb, NULL);`,
            [clientProfileId]
          ),
        /permission denied for function record_payment_transaction/
      );
      await db.query(`RESET ROLE;`);

      // 2b. Authenticated non-admin client can submit bank transfer notice (pending_verification)
      //     but is strictly blocked from calling public.record_payment_transaction
      await db.query(`SET ROLE authenticated;`);
      await db.query(`SELECT set_config('request.jwt.claim.role', 'authenticated', false);`);
      await db.query(`SELECT set_config('request.jwt.claim.sub', $1, false);`, [clientUserId]);
      await db.query(`SELECT set_config('request.jwt.claim.email', 'founder@clientbrand.com', false);`);

      const subNoticeRes = await db.query(
        `INSERT INTO public.manual_payment_submissions (
           client_profile_id, invoice_id, amount_cents, currency, sending_bank,
           wire_reference_number, transfer_date, submitted_by, status
         ) VALUES ($1, $2, 494700, 'usd', 'Silicon Valley Bank', 'WIRE-SYNTH-001', current_date, $3, 'pending_verification')
         RETURNING id;`,
        [clientProfileId, invoiceId, clientUserId]
      );
      const manualSubId = subNoticeRes.rows[0].id;

      await assert.rejects(
        () =>
          db.query(
            `SELECT public.record_payment_transaction($1, 494700, 0, 'usd', 'wire', 'WIRE-SYNTH-001', NULL, NULL, NULL, now(), '{}'::jsonb, 'client self-verify attempt', '[]'::jsonb, $2);`,
            [clientProfileId, manualSubId]
          ),
        /permission denied for function record_payment_transaction/
      );

      // 2c. Authenticated ADMINISTRATOR calling public.record_payment_transaction directly via PostgREST role 'authenticated'
      //     is strictly blocked so an admin cannot bypass FEATURE_FINANCIAL_MUTATIONS_ENABLED=false!
      await db.query(`SELECT set_config('request.jwt.claim.sub', $1, false);`, [adminUserId]);
      await db.query(`SELECT set_config('request.jwt.claim.email', 'admin@sienvi.com', false);`);

      await assert.rejects(
        () =>
          db.query(
            `SELECT public.record_payment_transaction($1, 494700, 0, 'usd', 'wire', 'WIRE-SYNTH-001', NULL, NULL, NULL, now(), '{}'::jsonb, 'admin direct rpc attempt', '[]'::jsonb, $2);`,
            [clientProfileId, manualSubId]
          ),
        /permission denied for function record_payment_transaction/
      );

      // Authenticated admin also cannot directly UPDATE billing_invoices or INSERT into billing_payments
      await assert.rejects(
        () => db.query(`UPDATE public.billing_invoices SET status = 'paid' WHERE id = $1;`, [invoiceId]),
        /permission denied for table billing_invoices/
      );

      await db.query(`RESET ROLE;`);

      // 2d. Server-side service_role with non-admin actor user ID is rejected by internal RBAC check
      await db.query(`SET ROLE service_role;`);
      await db.query(`SELECT set_config('request.jwt.claim.role', 'service_role', false);`);
      await db.query(`SELECT set_config('request.jwt.claim.sub', $1, false);`, [clientUserId]);
      await assert.rejects(
        () =>
          db.query(
            `SELECT public.record_payment_transaction($1, 494700, 0, 'usd', 'wire', 'WIRE-SYNTH-001', NULL, NULL, NULL, now(), '{}'::jsonb, 'non-admin actor via service_role', '[]'::jsonb, $2, $3);`,
            [clientProfileId, manualSubId, clientUserId]
          ),
        /Forbidden: only administrators can record financial transactions/
      );

      // 2e. Authorized server-side service_role with verified admin actor succeeds atomically
      await db.query(`SELECT set_config('request.jwt.claim.sub', $1, false);`, [adminUserId]);
      await db.query(`SELECT set_config('request.jwt.claim.email', 'admin@sienvi.com', false);`);

      const txRes = await db.query(
        `SELECT public.record_payment_transaction(
           $1, 494700, 0, 'usd', 'wire', 'WIRE-SYNTH-001', NULL, NULL, NULL, now(),
           '{"bank":"SVB"}'::jsonb, 'Verified wire receipt',
           jsonb_build_array(jsonb_build_object('invoice_id', $2::text, 'amount_cents', 494700)),
           $3, $4
         ) AS result;`,
        [clientProfileId, invoiceId, manualSubId, adminUserId]
      );
      assert.strictEqual(txRes.rows[0].result.success, true);
      assert.strictEqual(txRes.rows[0].result.allocated_amount_cents, 494700);
      assert.strictEqual(txRes.rows[0].result.unallocated_amount_cents, 0);

      // 2f. Verify Audit Schema Compatibility:
      //     (1) Legacy production audit writer (omits admin_email and details)
      await db.query(
        `INSERT INTO public.admin_audit_logs (
           admin_user_id, action, target_client_id, metadata, ip_address, user_agent, created_at
         ) VALUES ($1, 'admin_client_updated', $2, '{"updatedFields":["plan"]}'::jsonb, '127.0.0.1', 'Mozilla/5.0', now());`,
        [adminUserId, clientProfileId]
      );

      //     (2) Phase 2B Edge Function audit writer (includes category in metadata)
      await db.query(
        `INSERT INTO public.admin_audit_logs (
           admin_user_id, action, target_client_id, metadata, ip_address, user_agent, created_at
         ) VALUES ($1, 'manual_payment_verified', $2, '{"category":"financial","verifiedAmountCents":494700}'::jsonb, '127.0.0.1', 'Deno/2.x', now());`,
        [adminUserId, clientProfileId]
      );

      const auditRows = await db.query(
        `SELECT action, admin_email, details, metadata FROM public.admin_audit_logs ORDER BY created_at ASC;`
      );
      assert.strictEqual(auditRows.rows.length, 3, "All 3 audit writer formats must coexist cleanly in admin_audit_logs");

      await db.query(`RESET ROLE;`);
    } finally {
      await db.end();
    }
  });

  it("3. Executes encrypted PostgreSQL 17 backup outside OneDrive and restores into a separate disposable database with full invariant verification", async () => {
    const sourceUri = `postgresql://postgres:password@localhost:${PG_PORT}/${SYNTHETIC_DB}`;
    const targetUri = `postgresql://postgres:password@localhost:${PG_PORT}/${RESTORE_DB}`;

    // 3a. Run encrypted backup of synthetic database
    backupManifest = runEncryptedBackup({
      connectionUri: sourceUri,
      passphrase: TEST_PASSPHRASE,
      label: "synthetic_gate_a_test",
    });

    assert.ok(!backupManifest.backupDirectory.toLowerCase().includes("onedrive"), "Backup directory must be outside OneDrive");
    assert.ok(backupManifest.tocEntryCount > 40, `Expected >40 TOC entries, got ${backupManifest.tocEntryCount}`);
    assert.ok(fs.existsSync(backupManifest.artifacts.customDump.encryptedPath));
    assert.ok(fs.existsSync(backupManifest.artifacts.sqlDump.encryptedPath));

    // Prepare target disposable DB with only platform base schemas (auth, storage)
    const targetDb = new Client({ connectionString: targetUri });
    await targetDb.connect();

    try {
      await targetDb.query(SUPABASE_PLATFORM_BOOTSTRAP_SQL);
      // Seed the two auth.users referenced by FK in restored public tables
      const srcDb = new Client({ connectionString: sourceUri });
      await srcDb.connect();
      const usersRes = await srcDb.query(`SELECT id, email, created_at FROM auth.users;`);
      for (const u of usersRes.rows) {
        await targetDb.query(
          `INSERT INTO auth.users (id, email, created_at) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING;`,
          [u.id, u.email, u.created_at]
        );
      }
      await srcDb.end();

      // 3b. Decrypt, verify SHA-256 checksums, and restore into disposable target DB
      const manifestPath = path.join(
        backupManifest.backupDirectory,
        `${backupManifest.backupId}.manifest.json`
      );
      const restoreRes = verifyAndRestoreEncryptedBackup({
        manifestPath,
        passphrase: TEST_PASSPHRASE,
        targetConnectionUri: targetUri,
      });
      assert.strictEqual(restoreRes.restored, true);

      // 3c. Verify restored counts, constraints, privileges, and financial invariants
      const countsRes = await targetDb.query(`
        SELECT
          (SELECT count(*)::int FROM supabase_migrations.schema_migrations) AS migrations_cnt,
          (SELECT count(*)::int FROM public.client_profiles) AS profiles_cnt,
          (SELECT count(*)::int FROM public.client_subscriptions) AS subs_cnt,
          (SELECT count(*)::int FROM public.billing_invoices) AS invoices_cnt,
          (SELECT count(*)::int FROM public.billing_payments) AS payments_cnt,
          (SELECT count(*)::int FROM public.billing_invoice_allocations) AS allocations_cnt,
          (SELECT count(*)::int FROM public.manual_payment_submissions WHERE status = 'verified') AS verified_submissions_cnt,
          (SELECT count(*)::int FROM public.stripe_sync_checkpoints) AS checkpoints_cnt,
          (SELECT count(*)::int FROM public.admin_audit_logs) AS audit_cnt;
      `);
      const counts = countsRes.rows[0];
      assert.strictEqual(counts.migrations_cnt, 16);
      assert.strictEqual(counts.profiles_cnt, 1);
      assert.strictEqual(counts.subs_cnt, 1);
      assert.strictEqual(counts.invoices_cnt, 1);
      assert.strictEqual(counts.payments_cnt, 1);
      assert.strictEqual(counts.allocations_cnt, 1);
      assert.strictEqual(counts.verified_submissions_cnt, 1);
      assert.strictEqual(counts.checkpoints_cnt, 5);
      assert.strictEqual(counts.audit_cnt, 3);

      // Verify financial ledger invariants in restored DB
      const invCheck = await targetDb.query(`
        SELECT status, total_amount_cents::int, amount_paid_cents::int, amount_due_cents::int
        FROM public.billing_invoices LIMIT 1;
      `);
      assert.strictEqual(invCheck.rows[0].status, "paid");
      assert.strictEqual(invCheck.rows[0].total_amount_cents, 494700);
      assert.strictEqual(invCheck.rows[0].amount_paid_cents, 494700);
      assert.strictEqual(invCheck.rows[0].amount_due_cents, 0);

      // Verify constraint chk_billing_invoices_balance is active in restored DB
      await assert.rejects(
        () =>
          targetDb.query(`
            UPDATE public.billing_invoices SET amount_due_cents = 100;
          `),
        /chk_billing_invoices_balance/
      );

      // Verify privileges and RLS policies survived restoration
      const policyCount = await targetDb.query(`
        SELECT count(*)::int AS cnt FROM pg_policies WHERE schemaname = 'public';
      `);
      assert.ok(policyCount.rows[0].cnt >= 25, `Expected >=25 public RLS policies, got ${policyCount.rows[0].cnt}`);

      const fnPriv = await targetDb.query(`
        SELECT has_function_privilege(
          'anon',
          'public.record_payment_transaction(uuid,bigint,bigint,text,text,text,text,text,text,timestamptz,jsonb,text,jsonb,uuid,uuid)',
          'EXECUTE'
        ) AS anon_exec;
      `);
      assert.strictEqual(fnPriv.rows[0].anon_exec, false);
    } finally {
      await targetDb.end();
    }
  });
});
