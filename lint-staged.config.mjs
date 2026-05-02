export default {
  '*.{ts,tsx,js,jsx,mjs,cjs}': ['eslint --fix --no-warn-ignored', 'prettier --write'],
  '*.{json,yml,yaml,css,md}': ['prettier --write'],
  // Prisma schema is formatted by the Prisma CLI itself.
  '*.prisma': () => 'pnpm --filter @selyn/api exec prisma format',
};
