// Dependency-free checks: JavaScript syntax, manifest shape, locale messages and version consistency.
const { execFileSync } = require('node:child_process');
const { readFileSync, readdirSync } = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const ext = path.join(root, 'extension');
const fail = message => { console.error(`lint: ${message}`); process.exitCode = 1; };

for (const dir of ['extension', 'test', 'scripts']) {
  for (const file of readdirSync(path.join(root, dir))) {
    if (/\.c?js$/.test(file)) execFileSync(process.execPath, ['--check', path.join(root, dir, file)]);
  }
}

const manifest = JSON.parse(readFileSync(path.join(ext, 'manifest.json'), 'utf8'));
const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
if (manifest.manifest_version !== 3) fail('manifest_version must be 3');
if (manifest.version !== pkg.version) fail(`manifest version ${manifest.version} differs from package.json ${pkg.version}`);
for (const file of [manifest.background.service_worker, manifest.action.default_popup]) {
  try { readFileSync(path.join(ext, file)); } catch { fail(`manifest references missing file ${file}`); }
}
const locales = readdirSync(path.join(ext, '_locales'));
if (!locales.includes(manifest.default_locale)) fail(`default_locale ${manifest.default_locale} has no _locales folder`);
for (const locale of locales) {
  const messages = JSON.parse(readFileSync(path.join(ext, '_locales', locale, 'messages.json'), 'utf8'));
  for (const [, key] of JSON.stringify(manifest).matchAll(/__MSG_(\w+)__/g)) {
    if (!messages[key]) fail(`_locales/${locale} is missing message ${key}`);
  }
}
if (!process.exitCode) console.log('lint: ok');
