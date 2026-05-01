/**
 * npm only installs the lightningcss native binding for the host OS. Metro's file
 * crawler can still register other optional platform packages (e.g. android-arm64)
 * when resolving the graph for Android bundles on Windows, then fs.watch() throws
 * ENOENT if that folder is missing. Create minimal empty dirs for any missing
 * optional lightningcss-* packages so watching succeeds.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const nm = path.join(root, 'node_modules');
const lightningPkgPath = path.join(nm, 'lightningcss', 'package.json');

if (!fs.existsSync(lightningPkgPath)) {
  process.exit(0);
}

let optional = {};
try {
  optional = JSON.parse(fs.readFileSync(lightningPkgPath, 'utf8')).optionalDependencies || {};
} catch {
  process.exit(0);
}

for (const name of Object.keys(optional)) {
  if (!name.startsWith('lightningcss-')) continue;
  const dir = path.join(nm, name);
  if (fs.existsSync(dir)) continue;
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, 'package.json'),
    JSON.stringify(
      {
        name,
        version: String(optional[name]),
        private: true,
        description: 'Placeholder directory for Metro file watching (optional native binding not installed on this host).',
      },
      null,
      2
    ) + '\n'
  );
}
