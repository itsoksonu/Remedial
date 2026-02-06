import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { authLimiter, standardLimiter, fileLimiter, aiLimiter } from './middleware/rateLimit';
// import { auditLog } from './middleware/audit';

// Import Routes
import authRoutes from './routes/auth.routes';
import claimsRoutes from './routes/claims.routes';
import denialsRoutes from './routes/denials.routes';
import appealsRoutes from './routes/appeals.routes';
import paymentsRoutes from './routes/payments.routes';
import analyticsRoutes from './routes/analytics.routes';
import usersRoutes from './routes/users.routes';
import organizationsRoutes from './routes/organizations.routes';
import filesRoutes from './routes/files.routes';
import notificationRoutes from './routes/notification.routes';
import aiRoutes from './routes/ai.routes';
import webhooksRoutes from './routes/webhooks.routes';

const app = express();

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  }),
);
app.use(morgan('dev'));
// Routes
// Webhooks must be registered before express.json() to allow for raw body parsing of the signature
app.use('/webhooks', express.raw({ type: 'application/json' }), webhooksRoutes);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(auditLog); // Error: auditLog is a factory that requires arguments (e.g., auditLog('action', 'entity')). Apply it to specific routes instead.

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/claims', standardLimiter, claimsRoutes);
app.use('/api/denials', standardLimiter, denialsRoutes);
app.use('/api/appeals', standardLimiter, appealsRoutes);
app.use('/api/payments', standardLimiter, paymentsRoutes);
app.use('/api/analytics', standardLimiter, analyticsRoutes);
app.use('/api/users', standardLimiter, usersRoutes);
app.use('/api/organizations', standardLimiter, organizationsRoutes);
app.use('/api/files', fileLimiter, filesRoutes);
app.use('/api/notifications', standardLimiter, notificationRoutes);
app.use('/api/ai', aiLimiter, aiRoutes);
// app.use('/webhooks', webhooksRoutes); // Removed from here

// Error Handling
app.use(errorHandler);

export default app;
