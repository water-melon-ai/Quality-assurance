import { build } from 'esbuild';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));

// Externalize npm deps but inline @frostflow/* workspace packages
const external = [
  ...Object.keys(pkg.dependencies || {}).filter((d) => !d.startsWith('@frostflow/')),
  ...Object.keys(pkg.devDependencies || {}).filter((d) => !d.startsWith('@frostflow/')),
  '@prisma/client',
].flatMap((d) => [d, `${d}/*`]);

await build({
  entryPoints: ['src/server/index.ts'],
  outfile: 'dist/server/index.js',
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  sourcemap: true,
  external,
  banner: {
    js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
  },
});

console.log('✓ Express server built → dist/server/index.js');
