import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs/promises';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), devLessonsPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

// Dev-only middleware: provide GET/POST /api/lessons to read/write data/lessons.json
function devLessonsPlugin() {
  return {
    name: 'dev-lessons-api',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (!req.url || !req.url.startsWith('/api/lessons')) return next();

        const file = path.resolve(process.cwd(), 'data', 'lessons.json');

        try {
          if (req.method === 'GET') {
            const raw = await fs.readFile(file, 'utf-8').catch(() => '[]');
            res.setHeader('Content-Type', 'application/json');
            res.end(raw);
            return;
          }

          if (req.method === 'POST') {
            let body = '';
            for await (const chunk of req) body += chunk;
            const parsed = JSON.parse(body || '[]');
            await fs.mkdir(path.dirname(file), { recursive: true });
            await fs.writeFile(file, JSON.stringify(parsed, null, 2), 'utf-8');
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true }));
            return;
          }

          res.statusCode = 405;
          res.end();
        } catch (e) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: String(e) }));
        }
      });
    },
  };
}

// Inject dev plugin into exported config
const _old = undefined; // placeholder to keep patch context
