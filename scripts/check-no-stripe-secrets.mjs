#!/usr/bin/env node
/**
 * Fails CI/local checks when Stripe secret or literal publishable keys appear in source.
 * Allows documentation placeholders such as pk_live_**** / sk_test_****.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOT = process.cwd();

const SKIP_DIR_NAMES = new Set([
  '.git',
  '.expo',
  'node_modules',
  'android',
  'ios',
  'dist',
  'web-build',
  'coverage',
  '.expo-export-test',
  '.expo-web-export-test',
  'dist-web-test',
]);

const TEXT_EXT = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.json',
  '.md',
  '.yml',
  '.yaml',
  '.xml',
  '.plist',
  '.env',
  '.txt',
  '.gradle',
  '.properties',
  '.kt',
  '.java',
  '.swift',
  '.m',
  '.mm',
  '.rb',
  '.sh',
  '.ps1',
]);

/** Real Stripe material — placeholders with only * after the prefix are allowed. */
const FORBIDDEN = [
  { id: 'sk_test', re: /\bsk_test_[A-Za-z0-9]+/g },
  { id: 'sk_live', re: /\bsk_live_[A-Za-z0-9]+/g },
  { id: 'rk_test', re: /\brk_test_[A-Za-z0-9]+/g },
  { id: 'rk_live', re: /\brk_live_[A-Za-z0-9]+/g },
  { id: 'whsec', re: /\bwhsec_[A-Za-z0-9]+/g },
  { id: 'pk_test', re: /\bpk_test_[A-Za-z0-9]+/g },
  { id: 'pk_live', re: /\bpk_live_[A-Za-z0-9]+/g },
];

function isPlaceholder(match) {
  // e.g. pk_live_**** or sk_test_****abcd documentation samples with only stars
  const body = match.replace(/^(pk|sk|rk)_(test|live)_|^whsec_/, '');
  return /^\*+[A-Za-z0-9]{0,4}$/.test(body) || body === '****';
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIR_NAMES.has(name)) continue;
    const full = join(dir, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      walk(full, out);
      continue;
    }
    const lower = name.toLowerCase();
    const dot = lower.lastIndexOf('.');
    const ext = dot >= 0 ? lower.slice(dot) : '';
    if (
      TEXT_EXT.has(ext) ||
      lower === 'dockerfile' ||
      lower.startsWith('.env') ||
      name === 'app.json' ||
      name === 'eas.json'
    ) {
      out.push(full);
    }
  }
  return out;
}

function redact(match) {
  if (match.length <= 12) return `${match.slice(0, 7)}****`;
  return `${match.slice(0, 8)}****${match.slice(-4)}`;
}

const files = walk(ROOT);
const findings = [];

for (const file of files) {
  const rel = relative(ROOT, file).split(sep).join('/');
  if (rel === 'scripts/check-no-stripe-secrets.mjs') continue;

  let text;
  try {
    text = readFileSync(file, 'utf8');
  } catch {
    continue;
  }

  for (const { id, re } of FORBIDDEN) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text))) {
      const match = m[0];
      if (isPlaceholder(match)) continue;
      const line = text.slice(0, m.index).split(/\r?\n/).length;
      findings.push({ file: rel, line, id, sample: redact(match) });
    }
  }
}

if (findings.length) {
  console.error('Stripe credential patterns found in source (redacted):');
  for (const f of findings) {
    console.error(`  ${f.file}:${f.line} [${f.id}] ${f.sample}`);
  }
  console.error('\nRemove hardcoded Stripe keys. Use backend-issued Checkout URLs only.');
  process.exit(1);
}

console.log('OK: no Stripe secret/publishable key literals found in source.');
