// lint-staged config — CJS so we can delegate ESLint per-workspace.
//
// Background (2026-04-25): the previous .lintstagedrc.json invoked
// `eslint --fix` from the repo root. ESLint v9 looks for config in CWD
// (defaults to eslint.config.js). The repo has per-app configs at
// apps/{web,api,admin,mobile}/eslint.config.mjs and
// packages/{ui,billing-sdk}/eslint.config.mjs but none at the root, so
// every commit failed with "ESLint couldn't find an eslint.config file."
//
// Fix: invoke each touched workspace's own `lint` script via pnpm filter.
// Each package's script knows where its config lives and how to scope
// the lint correctly.

/**
 * Group files by their owning workspace (apps/<name> or packages/<name>)
 * and return one `pnpm -F ./<pkg> lint --fix` invocation per workspace
 * that has touched files. Files outside any workspace are skipped (they
 * shouldn't match this glob anyway).
 */
function lintByWorkspace(files) {
  const byPkg = new Map();
  for (const f of files) {
    const m = f.match(/^(apps|packages)\/([^/]+)\//);
    if (!m) continue;
    const pkg = `${m[1]}/${m[2]}`;
    if (!byPkg.has(pkg)) byPkg.set(pkg, []);
    byPkg.get(pkg).push(f);
  }
  return Array.from(byPkg.keys()).map(
    (pkg) => `pnpm -F "./${pkg}" lint --fix`
  );
}

module.exports = {
  'apps/**/*.{ts,tsx}': (files) => [
    ...lintByWorkspace(files),
    `prettier --write ${files.map((f) => `"${f}"`).join(' ')}`,
  ],
  'packages/**/*.{ts,tsx}': (files) =>
    `prettier --write ${files.map((f) => `"${f}"`).join(' ')}`,
  '*.{js,jsx}': (files) =>
    `prettier --write ${files.map((f) => `"${f}"`).join(' ')}`,
  '*.{json,md,mdx,css,scss}': (files) =>
    `prettier --write ${files.map((f) => `"${f}"`).join(' ')}`,
  '*.prisma': (files) => files.map((f) => `npx prisma format --schema "${f}"`),
};
