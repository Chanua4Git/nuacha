import { defineConfig } from 'vitest/config';
import path from 'path';

process.env.TZ = 'America/Port_of_Spain';

export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  test: { include: ['src/**/*.test.ts'], environment: 'node' },
});
