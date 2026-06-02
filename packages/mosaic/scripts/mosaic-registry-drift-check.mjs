#!/usr/bin/env node
/**
 * mosaic-registry-drift-check
 *
 * Enforces Pattern 3 (YAML registry ↔ filesystem ↔ i18n locales coherence).
 * Algorithm (per spec §4 Pattern 3):
 *   1. Parse registry.yaml → extract names, zodExports, i18nKeys.
 *   2. Walk src/components/{category}/*.schema.ts → extract exported const names.
 *   3. Diff names ↔ filesystem (both directions).
 *   4. For each component, verify the declared zodExport symbol is exported.
 *   5. Verify every i18nKey is present in both en.json and fr.json (from mosaic-i18n).
 *   6. Exit 1 on any mismatch (file:line format), exit 0 otherwise.
 *
 * No external YAML dep — we ship a minimal parser sufficient for our
 * well-known shape (version, components[]). Keeps install footprint small.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = resolve(__dirname, "..");
const REPO_ROOT = resolve(PKG_ROOT, "..", "..");
const REGISTRY_PATH = join(PKG_ROOT, "registry.yaml");
const COMPONENTS_DIR = join(PKG_ROOT, "src", "components");
const EN_LOCALE = join(REPO_ROOT, "packages", "mosaic-i18n", "src", "locales", "en.json");
const FR_LOCALE = join(REPO_ROOT, "packages", "mosaic-i18n", "src", "locales", "fr.json");

const errors = [];
const rel = (p) => relative(REPO_ROOT, p);

function fail(msg) {
  errors.push(msg);
}

/* ------------------------------ YAML parse ------------------------------ */
/**
 * Minimal YAML loader for the registry shape:
 *   version: "x"
 *   components:
 *     - name: X
 *       category: y
 *       schema: path
 *       i18nKeys: ["a", "b"]
 *       zodExport: Z
 */
function parseRegistry(src) {
  const lines = src.split(/\r?\n/);
  const registry = { version: null, components: [] };
  let current = null;
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.replace(/#.*$/, "").trimEnd();
    if (!line.trim()) continue;
    const topMatch = line.match(/^(version|components):\s*(.*)$/);
    if (topMatch) {
      if (topMatch[1] === "version") {
        registry.version = topMatch[2].replace(/^["']|["']$/g, "").trim() || null;
      }
      continue;
    }
    const itemStart = line.match(/^\s*-\s*name:\s*(.+)$/);
    if (itemStart) {
      current = {
        name: itemStart[1].trim().replace(/^["']|["']$/g, ""),
        line: i + 1,
      };
      registry.components.push(current);
      continue;
    }
    if (!current) continue;
    const kv = line.match(/^\s+([A-Za-z0-9_]+):\s*(.*)$/);
    if (!kv) continue;
    const key = kv[1];
    const value = kv[2].trim();
    if (key === "i18nKeys") {
      const arr = value.match(/^\[(.*)\]$/);
      if (arr) {
        current.i18nKeys = arr[1]
          .split(",")
          .map((s) => s.trim().replace(/^["']|["']$/g, ""))
          .filter(Boolean);
      } else {
        current.i18nKeys = [];
      }
    } else {
      current[key] = value.replace(/^["']|["']$/g, "");
    }
  }
  return registry;
}

/* --------------------------- Filesystem walk --------------------------- */
function walkSchemaFiles(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const s = statSync(full);
    if (s.isDirectory()) {
      out.push(...walkSchemaFiles(full));
    } else if (entry.endsWith(".schema.ts")) {
      out.push(full);
    }
  }
  return out;
}

function extractExports(filePath) {
  const src = readFileSync(filePath, "utf8");
  const names = new Set();
  const re = /export\s+(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/g;
  for (const match of src.matchAll(re)) {
    names.add(match[1]);
  }
  return names;
}

/* ------------------------------ Locales ------------------------------ */
function flattenKeys(obj, prefix = "") {
  const keys = new Set();
  if (obj === null || typeof obj !== "object") return keys;
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      for (const nested of flattenKeys(v, path)) keys.add(nested);
    } else {
      keys.add(path);
    }
  }
  return keys;
}

function loadLocaleKeys(path) {
  if (!existsSync(path)) return new Set();
  try {
    return flattenKeys(JSON.parse(readFileSync(path, "utf8")));
  } catch (err) {
    fail(`${rel(path)}: invalid JSON — ${err.message}`);
    return new Set();
  }
}

/* ------------------------------ Main ------------------------------ */
if (!existsSync(REGISTRY_PATH)) {
  fail(`${rel(REGISTRY_PATH)}: not found`);
} else {
  const registry = parseRegistry(readFileSync(REGISTRY_PATH, "utf8"));
  const declaredByName = new Map();
  for (const c of registry.components) declaredByName.set(c.name, c);

  // Filesystem schema files
  const schemaFiles = walkSchemaFiles(COMPONENTS_DIR);
  const schemaFileByExpected = new Map();
  for (const c of registry.components) {
    if (!c.schema) {
      fail(`registry.yaml:${c.line}: missing 'schema' for ${c.name}`);
      continue;
    }
    schemaFileByExpected.set(resolve(PKG_ROOT, c.schema), c);
  }

  // 3a. registered → filesystem
  for (const [expected, c] of schemaFileByExpected) {
    if (!existsSync(expected)) {
      fail(`registry.yaml:${c.line}: ${c.name} not found at expected path ${rel(expected)}`);
    }
  }
  // 3b. filesystem → registered
  for (const f of schemaFiles) {
    if (!schemaFileByExpected.has(f)) {
      fail(`${rel(f)}: schema.ts exists but not registered in registry.yaml`);
    }
  }

  // 5. zodExport symbol present
  for (const [path, c] of schemaFileByExpected) {
    if (!c.zodExport) {
      fail(`registry.yaml:${c.line}: ${c.name} missing 'zodExport'`);
      continue;
    }
    if (!existsSync(path)) continue;
    const exports = extractExports(path);
    if (!exports.has(c.zodExport)) {
      fail(`${rel(path)}: zodExport '${c.zodExport}' not exported`);
    }
  }

  // 6. i18n key coverage
  const enKeys = loadLocaleKeys(EN_LOCALE);
  const frKeys = loadLocaleKeys(FR_LOCALE);
  for (const c of registry.components) {
    if (!Array.isArray(c.i18nKeys)) continue;
    for (const key of c.i18nKeys) {
      if (!enKeys.has(key)) fail(`${rel(EN_LOCALE)}: missing i18nKey '${key}' (used by ${c.name})`);
      if (!frKeys.has(key)) fail(`${rel(FR_LOCALE)}: missing i18nKey '${key}' (used by ${c.name})`);
    }
  }
}

if (errors.length > 0) {
  for (const e of errors) console.error(e);
  console.error(`\nregistry-drift: ${errors.length} mismatch(es).`);
  process.exit(1);
}
console.log("registry-drift: OK (no mismatch).");
process.exit(0);
