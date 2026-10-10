import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { seedDatabase } from './src/db/seed.js';
import authRouter from './src/server/routes/auth.js';
import usersRouter from './src/server/routes/users.js';
import metadataRouter from './src/server/routes/metadata.js';
import customerRouter from './src/server/routes/customer.js';
import technicianRouter from './src/server/routes/technician.js';
import adminRouter from './src/server/routes/admin.js';
import leadsRouter from './src/server/routes/leads.js';
import paymentsRouter from './src/server/routes/payments.js';
import webhooksRouter from './src/server/routes/webhooks.js';
import uploadsRouter from './src/server/routes/uploads.js';
import servicesRouter from './src/server/routes/services.js';
import amcPlansRouter from './src/server/routes/amcPlans.js';
import partnersRouter from './src/server/routes/partners.js';
import hrRouter from './src/server/routes/hr.js';
import payrollRouter from './src/server/routes/payroll.js';
import promotionsRouter from './src/server/routes/promotions.js';
import locationsRouter from './src/server/routes/locations.js';
import salesRouter from './src/server/routes/sales.js';
import managersRouter from './src/server/routes/managers.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // CORS Configuration: Supports Web, Mobile (Capacitor/Cordova), and Dev environments
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    const isProd = process.env.NODE_ENV === 'production';

    const allowedMobileSchemes = ['capacitor://', 'ionic://', 'http://localhost', 'https://localhost'];
    const isMobileOrigin = origin && allowedMobileSchemes.some((scheme) => origin.startsWith(scheme));

    if (!origin) {
      // Non-browser request (e.g., native mobile HTTP plugins, background jobs)
      // No Origin header is sent; browser CORS restrictions do not apply
    } else if (isMobileOrigin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else if (!isProd) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else {
      // In production, only strictly verified web origins are permitted
      const configuredOrigins = (process.env.ALLOWED_ORIGINS || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (configuredOrigins.length > 0 && configuredOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      }
      // If configuredOrigins is empty or origin is not authorized, CORS header is omitted
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Webhook-Signature, X-Webhook-Timestamp, X-Skip-Rate-Limit');

    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
    next();
  });

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
      console.log('[Supabase PostgreSQL] Database connected and initialized.');
    } else {
      console.log('[VERTEX Core] Database notice: Resilient in-memory mode active.');
    }
  } catch (dbErr: any) {
    console.log('[VERTEX Core] Database notice: Resilient in-memory mode active.');
  }

  // Mount API endpoints FIRST
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/users', usersRouter);
  app.use('/api/v1/customer', customerRouter);
  app.use('/api/v1/technician', technicianRouter);
  app.use('/api/v1/admin', adminRouter);
  app.use('/api/v1/leads', leadsRouter);
  app.use('/api/v1/payments', paymentsRouter);
  app.use('/api/v1/webhooks', webhooksRouter);
  app.use('/api/v1/uploads', uploadsRouter);
  app.use('/api/v1/services', servicesRouter);
  app.use('/api/v1/amc-plans', amcPlansRouter);
  app.use('/api/v1/partners', partnersRouter);
  app.use('/api/v1/promotions', promotionsRouter);
  app.use('/api/v1/locations', locationsRouter);
  app.use('/api/v1/sales', salesRouter);
  app.use('/api/v1/managers', managersRouter);
  app.use('/api/v1/hr', hrRouter);
  app.use('/api/v1/payroll', payrollRouter);
  app.use('/api/v1', metadataRouter);

  // Stale CRM / Lead routes canonical redirection to /crm/leads
  const staleLeadRoutes = [
    '/admin/crm',
    '/admin/leads',
    '/crm',
    '/crm/',
    '/crm-lead',
    '/crm/lead',
    '/crm-leads',
    '/admin/crm-leads',
    '/admin/crm/leads',
    '/leads',
  ];
  app.get(staleLeadRoutes, (req, res) => {
    res.redirect(301, '/crm/leads');
  });

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
