
// import config from './core/config/index.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './api/auth/auth.routes.js';
import projectRoutes from './api/projects/projects.routes.js';
import testRoutes from './api/tests/tests.routes.js';
import reportRoutes from './api/reports/reports.routes.js';
import emailRoutes from './api/email/email.routes.js';
import { errorHandler } from './core/middlewares/error.middleware.js';
import config from './core/config/index.js'; 

const app = express();

// ✅ CORS - Pehle
app.use(cors({
  origin: '*',  // ✅ Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS','PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

app.use(helmet());
app.use(express.json());

// ✅ Routes - Middleware ke baad
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/tests', testRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/email', emailRoutes);

// ✅ Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'Backend is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.json({
    name: 'AI API Testing Platform',
    version: '1.0.0',
    status: 'online'
  });
});
app.options('*', cors());
// ✅ Error Handler - SABSE LAST MEIN
app.use(errorHandler);

export default app;
