// Bundles the worker (and the TS workspace packages) into a single runnable file.
import { build } from 'esbuild';
import { readFileSync } from 'node:fs';

// Externalize npm deps (native modules, prisma engines, playwright) but INLINE the @frostflow/* TS workspace packages
const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));
const external = [
  ...Object.keys(pkg.dependencies).filter((d) => !d.startsWith('@frostflow/')),
  '@prisma/client', 'pdfkit', 'uploadthing',
].flatMap((d) => [d, `${d}/*`]);

await build({
  entryPoints: ['src/index.ts'],
  outfile: 'dist/index.js',
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  sourcemap: true,
  // Keep npm dependencies external (native modules, prisma engines, playwright); inline only workspace TS packages
  external,
  banner: { js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);" },
});
console.log('✓ worker built → dist/index.js');
