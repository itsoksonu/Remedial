import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimit';
// import { auditLog } from './middleware/audit';

// Import Routes
import authRoutes from './routes/auth.routes';
import claimsRoutes from './routes/claims.routes';
import denialsRoutes from './routes/denials.routes';
import appealsRoutes from './routes/appeals.routes';
import paymentsRoutes from './routes/payments.routes';
import analyticsRoutes from './routes/analytics.routes';
// import usersRoutes from './routes/users.routes';
// import organizationsRoutes from './routes/organizations.routes';
// import filesRoutes from './routes/files.routes';
// import notificationsRoutes from './routes/notifications.routes';
import aiRoutes from './routes/ai.routes';
// import webhooksRoutes from './routes/webhooks.routes';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(apiLimiter);
// app.use(auditLog); // Error: auditLog is a factory that requires arguments (e.g., auditLog('action', 'entity')). Apply it to specific routes instead.

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/claims', claimsRoutes);
app.use('/api/denials', denialsRoutes);
app.use('/api/appeals', appealsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/analytics', analyticsRoutes);
// app.use('/api/users', usersRoutes);
// app.use('/api/organizations', organizationsRoutes);
// app.use('/api/files', filesRoutes);
// app.use('/api/notifications', notificationsRoutes);
app.use('/api/ai', aiRoutes);
// app.use('/webhooks', webhooksRoutes);

// Error Handling
app.use(errorHandler);

export default app;
