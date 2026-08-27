// Stamps the release version into the publishable manifests in this checkout.
// The git tag is the version; nothing is committed back to main.
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SEMVER =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(-(0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(\.(0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*)?(\+[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?$/;

const version = process.argv[2];
if (!version || !SEMVER.test(version)) {
  console.error(`usage: stamp-version.mjs <semver> (got ${JSON.stringify(version)})`);
  process.exit(1);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
for (const dir of ['packages/core', 'packages/cli']) {
  const file = path.join(root, dir, 'package.json');
  const pkg = JSON.parse(readFileSync(file, 'utf8'));
  pkg.version = version;
  writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`);
  console.log(`${pkg.name}@${version}`);
}
