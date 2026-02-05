// backend/src/config/datadog.ts
import { tracer } from 'dd-trace';

if (process.env.NODE_ENV === 'production') {
  tracer.init({
    service: 'denial-management-backend',
    env: process.env.NODE_ENV,
    version: process.env.APP_VERSION,
    logInjection: true,
  });
}

export default tracer;