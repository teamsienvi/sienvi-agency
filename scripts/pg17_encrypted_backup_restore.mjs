#!/usr/bin/env node
/**
 * SIENVI AGENCY: ZERO-COST POSTGRESQL 17 ENCRYPTED BACKUP & RESTORE ENGINE
 *
 * Uses local PostgreSQL 17.6 client utilities (pg_dump, pg_restore, psql) to:
 * 1. Capture full logical schema + data (public, billing_internal, supabase_migrations),
 *    including tables, constraints, sequences, functions, triggers, RLS policies, and grants.
 * 2. Validate backup completeness (exit code, TOC inspection via pg_restore --list,
 *    and SQL trailer verification).
 * 3. Encrypt backup artifacts at rest using AES-256-GCM in a protected local directory
 *    outside OneDrive (C:\Users\Iris\.local\sienvi-backups) with restricted NTFS ACLs.
 * 4. Record plaintext and ciphertext SHA-256 integrity checksums in a manifest.
 * 5. Decrypt, verify checksums, and restore into an isolated target database.
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const DEFAULT_PG_BIN_DIR = path.join(os.homedir(), ".local", "pgsql-17", "bin");
const DEFAULT_BACKUP_DIR = path.join(os.homedir(), ".local", "sienvi-backups");

export function resolvePgBinary(binName) {
  const exeName = process.platform === "win32" && !binName.endsWith(".exe") ? `${binName}.exe` : binName;
  const localCandidate = path.join(DEFAULT_PG_BIN_DIR, exeName);
  if (fs.existsSync(localCandidate)) {
    return localCandidate;
  }
  return exeName;
}

export function ensureProtectedBackupDir(backupDir = DEFAULT_BACKUP_DIR) {
  const resolved = path.resolve(backupDir);
  if (resolved.toLowerCase().includes("onedrive")) {
    throw new Error(`SECURITY VIOLATION: Backup destination (${resolved}) must not reside inside OneDrive.`);
  }
  fs.mkdirSync(resolved, { recursive: true });

  if (process.platform === "win32") {
    const username = os.userInfo().username;
    try {
      execFileSync(
        "icacls.exe",
        [resolved, "/inheritance:r", "/grant:r", `${username}:(OI)(CI)F`],
        { stdio: "pipe" }
      );
    } catch (err) {
      throw new Error(`Failed to enforce restrictive NTFS ACL on ${resolved}: ${err.message}`);
    }
  } else {
    fs.chmodSync(resolved, 0o700);
  }
  return resolved;
}

export function deriveAes256Key(passphrase, salt) {
  if (!passphrase || passphrase.length < 16) {
    throw new Error("Backup encryption passphrase must be at least 16 characters.");
  }
  return crypto.pbkdf2Sync(passphrase, salt, 210000, 32, "sha256");
}

export function encryptBufferAes256Gcm(plaintextBuffer, passphrase) {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = deriveAes256Key(passphrase, salt);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintextBuffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Header: Magic "SVBK" (4B) + Version 1 (1B) + Salt (16B) + IV (12B) + AuthTag (16B) + Ciphertext
  const header = Buffer.from([0x53, 0x56, 0x42, 0x4b, 0x01]);
  return Buffer.concat([header, salt, iv, authTag, encrypted]);
}

export function decryptBufferAes256Gcm(encryptedBuffer, passphrase) {
  if (encryptedBuffer.length < 49) {
    throw new Error("Corrupted encrypted backup: buffer shorter than AES-256-GCM header.");
  }
  const magic = encryptedBuffer.subarray(0, 4).toString("ascii");
  const version = encryptedBuffer[4];
  if (magic !== "SVBK" || version !== 1) {
    throw new Error(`Unsupported backup container header: ${magic} v${version}`);
  }
  const salt = encryptedBuffer.subarray(5, 21);
  const iv = encryptedBuffer.subarray(21, 33);
  const authTag = encryptedBuffer.subarray(33, 49);
  const ciphertext = encryptedBuffer.subarray(49);

  const key = deriveAes256Key(passphrase, salt);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

function sha256Hex(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex").toUpperCase();
}

function secureUnlink(filePath) {
  if (fs.existsSync(filePath)) {
    const stat = fs.statSync(filePath);
    if (stat.size > 0) {
      fs.writeFileSync(filePath, crypto.randomBytes(stat.size));
    }
    fs.unlinkSync(filePath);
  }
}

export function runEncryptedBackup({
  connectionUri,
  passphrase,
  backupDir = DEFAULT_BACKUP_DIR,
  label = "pg17_backup",
  schemas = ["public", "billing_internal", "supabase_migrations"],
}) {
  const safeDir = ensureProtectedBackupDir(backupDir);
  const pgDump = resolvePgBinary("pg_dump");
  const pgRestore = resolvePgBinary("pg_restore");

  const versionOut = execFileSync(pgDump, ["--version"], { encoding: "utf8" }).trim();
  if (!versionOut.includes("17.")) {
    throw new Error(`Expected pg_dump 17.x, got: ${versionOut}`);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const baseName = `${label}_${timestamp}`;
  const tmpCustomPath = path.join(safeDir, `.tmp_${baseName}.dump`);
  const tmpPlainPath = path.join(safeDir, `.tmp_${baseName}.sql`);

  const encCustomPath = path.join(safeDir, `${baseName}.dump.enc`);
  const encPlainPath = path.join(safeDir, `${baseName}.sql.enc`);
  const manifestPath = path.join(safeDir, `${baseName}.manifest.json`);

  const schemaArgs = schemas.flatMap((s) => ["--schema", s]);

  try {
    // 1. Custom format dump (for pg_restore TOC inspection and selective/transactional restore)
    execFileSync(
      pgDump,
      [
        "--dbname",
        connectionUri,
        "--format=custom",
        "--no-owner",
        ...schemaArgs,
        "--file",
        tmpCustomPath,
      ],
      { stdio: "pipe" }
    );

    // 2. Plain SQL dump (for full human-auditable DDL + COPY data + ACLs + RLS policies)
    execFileSync(
      pgDump,
      [
        "--dbname",
        connectionUri,
        "--format=plain",
        "--no-owner",
        ...schemaArgs,
        "--file",
        tmpPlainPath,
      ],
      { stdio: "pipe" }
    );

    // Ensure idempotent schema recreation for clean ON_ERROR_STOP=1 restore
    let rawSql = fs.readFileSync(tmpPlainPath, "utf8");
    rawSql =
      "DROP SCHEMA IF EXISTS billing_internal CASCADE;\nDROP SCHEMA IF EXISTS supabase_migrations CASCADE;\n" +
      rawSql.replace(/^CREATE SCHEMA (public|billing_internal|supabase_migrations);/gm, "CREATE SCHEMA IF NOT EXISTS $1;");
    fs.writeFileSync(tmpPlainPath, rawSql, "utf8");

    // 3. Incomplete-backup detection & validation
    if (!fs.existsSync(tmpCustomPath) || fs.statSync(tmpCustomPath).size === 0) {
      throw new Error("Incomplete backup: custom dump file is missing or zero bytes.");
    }
    if (!fs.existsSync(tmpPlainPath) || fs.statSync(tmpPlainPath).size === 0) {
      throw new Error("Incomplete backup: plain SQL dump file is missing or zero bytes.");
    }

    const plainText = fs.readFileSync(tmpPlainPath, "utf8");
    if (!plainText.includes("-- PostgreSQL database dump complete")) {
      throw new Error("Incomplete backup: SQL dump is missing '-- PostgreSQL database dump complete' trailer.");
    }

    const tocOutput = execFileSync(pgRestore, ["--list", tmpCustomPath], { encoding: "utf8" });
    const tocLines = tocOutput
      .split(/\r?\n/)
      .filter((l) => l.trim() && !l.trim().startsWith(";"));
    if (tocLines.length === 0) {
      throw new Error("Incomplete backup: pg_restore --list returned 0 TOC entries.");
    }

    // 4. Encrypt both dumps in memory and write .enc containers
    const customBuf = fs.readFileSync(tmpCustomPath);
    const plainBuf = fs.readFileSync(tmpPlainPath);

    const encCustomBuf = encryptBufferAes256Gcm(customBuf, passphrase);
    const encPlainBuf = encryptBufferAes256Gcm(plainBuf, passphrase);

    fs.writeFileSync(encCustomPath, encCustomBuf);
    fs.writeFileSync(encPlainPath, encPlainBuf);

    const manifest = {
      backupId: baseName,
      createdAt: new Date().toISOString(),
      pgClientVersion: versionOut,
      encryption: "AES-256-GCM (PBKDF2-HMAC-SHA256, 210000 iterations)",
      backupDirectory: safeDir,
      schemasCovered: schemas,
      tocEntryCount: tocLines.length,
      artifacts: {
        customDump: {
          encryptedPath: encCustomPath,
          plaintextBytes: customBuf.length,
          encryptedBytes: encCustomBuf.length,
          plaintextSha256: sha256Hex(customBuf),
          encryptedSha256: sha256Hex(encCustomBuf),
        },
        sqlDump: {
          encryptedPath: encPlainPath,
          plaintextBytes: plainBuf.length,
          encryptedBytes: encPlainBuf.length,
          plaintextSha256: sha256Hex(plainBuf),
          encryptedSha256: sha256Hex(encPlainBuf),
        },
      },
    };

    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
    return manifest;
  } finally {
    // Always wipe plaintext staging files
    secureUnlink(tmpCustomPath);
    secureUnlink(tmpPlainPath);
  }
}

export function verifyAndRestoreEncryptedBackup({
  manifestPath,
  passphrase,
  targetConnectionUri,
}) {
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifest not found: ${manifestPath}`);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const { encryptedPath, encryptedSha256, plaintextSha256 } = manifest.artifacts.sqlDump;

  const encBuf = fs.readFileSync(encryptedPath);
  const actualEncSha = sha256Hex(encBuf);
  if (actualEncSha !== encryptedSha256) {
    throw new Error(`Ciphertext SHA-256 mismatch! Expected ${encryptedSha256}, got ${actualEncSha}`);
  }

  const decryptedBuf = decryptBufferAes256Gcm(encBuf, passphrase);
  const actualPlainSha = sha256Hex(decryptedBuf);
  if (actualPlainSha !== plaintextSha256) {
    throw new Error(`Plaintext SHA-256 mismatch! Expected ${plaintextSha256}, got ${actualPlainSha}`);
  }

  const tmpRestoreSql = path.join(path.dirname(manifestPath), `.tmp_restore_${Date.now()}.sql`);
  const psql = resolvePgBinary("psql");

  try {
    fs.writeFileSync(tmpRestoreSql, decryptedBuf);
    execFileSync(
      psql,
      [
        "--dbname",
        targetConnectionUri,
        "--set",
        "ON_ERROR_STOP=1",
        "--file",
        tmpRestoreSql,
      ],
      { stdio: "pipe" }
    );
    return {
      restored: true,
      verifiedEncryptedSha256: actualEncSha,
      verifiedPlaintextSha256: actualPlainSha,
      tocEntryCount: manifest.tocEntryCount,
    };
  } finally {
    secureUnlink(tmpRestoreSql);
  }
}

// CLI entrypoint for standalone execution
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}`) {
  const mode = process.argv[2];
  if (mode === "--check-tools") {
    const pgDump = resolvePgBinary("pg_dump");
    const pgRestore = resolvePgBinary("pg_restore");
    const psql = resolvePgBinary("psql");
    console.log("pg_dump:", execFileSync(pgDump, ["--version"], { encoding: "utf8" }).trim());
    console.log("pg_restore:", execFileSync(pgRestore, ["--version"], { encoding: "utf8" }).trim());
    console.log("psql:", execFileSync(psql, ["--version"], { encoding: "utf8" }).trim());
  } else if (mode === "--backup-production") {
    const dbUrl = process.env.PRODUCTION_DB_URL;
    const passphrase = process.env.BACKUP_ENCRYPTION_PASSPHRASE;
    if (!dbUrl || !passphrase) {
      console.error("ERROR: PRODUCTION_DB_URL and BACKUP_ENCRYPTION_PASSPHRASE env vars are required.");
      process.exit(1);
    }
    const manifest = runEncryptedBackup({
      connectionUri: dbUrl,
      passphrase,
      label: "sienvi_prod_gate_a",
    });
    console.log("Encrypted production backup completed:", JSON.stringify(manifest, null, 2));
  } else {
    console.log("Usage: node scripts/pg17_encrypted_backup_restore.mjs [--check-tools | --backup-production]");
  }
}
