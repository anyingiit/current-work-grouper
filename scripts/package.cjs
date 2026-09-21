// Builds dist/current-work-grouper-v<version>.zip from the extension/ folder.
const { execFileSync } = require('node:child_process');
const { mkdirSync, readFileSync, rmSync } = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const { version } = JSON.parse(readFileSync(path.join(root, 'extension', 'manifest.json'), 'utf8'));
const out = path.join(root, 'dist', `current-work-grouper-v${version}.zip`);
mkdirSync(path.dirname(out), { recursive: true });
rmSync(out, { force: true });
execFileSync('zip', ['-r', '-X', out, '.', '-x', '.*'], { cwd: path.join(root, 'extension'), stdio: 'inherit' });
console.log(out);
