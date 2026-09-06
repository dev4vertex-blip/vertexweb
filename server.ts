import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { seedDatabase } from './src/db/seed.js';
import authRouter from './src/server/routes/auth.js';
import usersRouter from './src/server/routes/users.js';
import metadataRouter from './src/server/routes/metadata.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', async (req, res) => {
    try {
      const { testDatabaseConnection } = await import('./src/db/client.js');
      const dbStatus = await testDatabaseConnection();
      res.json({
        status: 'ok',
        engine: 'VERTEX Enterprise Express',
        database: {
          provider: 'Supabase PostgreSQL',
          connected: dbStatus.connected,
          message: dbStatus.message,
        },
        timestamp: new Date().toISOString(),
      });
    } catch {
      res.json({
        status: 'ok',
        engine: 'VERTEX Enterprise Express',
        database: {
          provider: 'Supabase PostgreSQL',
          connected: false,
          message: 'Unable to connect to database.',
        },
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Verify Supabase PostgreSQL connection and run migrations
  try {
    const { testDatabaseConnection } = await import('./src/db/client.js');
    const dbTest = await testDatabaseConnection();
    if (dbTest.connected) {
      await seedDatabase();
      console.log('[Supabase PostgreSQL] Database successfully initialized.');
    } else {
      console.log(`[Supabase PostgreSQL] Status: ${dbTest.message}`);
    }
  } catch (dbErr: any) {
    console.log('[Supabase PostgreSQL] Database bootstrap notice:', dbErr?.message || 'Ready in resilient mode.');
  }

  // Mount API endpoints FIRST
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/users', usersRouter);
  app.use('/api/v1', metadataRouter);

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VERTEX Enterprise Server listening on port ${PORT}`);
  });
}

startServer();
