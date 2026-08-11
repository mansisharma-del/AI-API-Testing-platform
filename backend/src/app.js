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


// ======================================================
// CORS
// ======================================================

const allowedOrigins = [
  'https://ai-api-testing-platform-kkup.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests without an Origin header
      // (Postman, server-to-server, health checks, etc.)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log('❌ CORS blocked origin:', origin);
      return callback(new Error('Not allowed by CORS'));
    },

    credentials: true,

    methods: [
      'GET',
      'POST',
      'PUT',
      'DELETE',
      'PATCH',
      'OPTIONS'
    ],

    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Cache-Control'
    ]
  })
);


// ======================================================
// MIDDLEWARE
// ======================================================

app.use(helmet());

app.use(express.json());


// ======================================================
// API ROUTES
// ======================================================

app.use('/api/v1/auth', authRoutes);

app.use('/api/v1/projects', projectRoutes);

app.use('/api/v1/tests', testRoutes);

app.use('/api/v1/reports', reportRoutes);

app.use('/api/v1/email', emailRoutes);


// ======================================================
// HEALTH CHECK
// ======================================================

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'Backend is running',
    timestamp: new Date().toISOString()
  });
});


// ======================================================
// ROOT
// ======================================================

app.get('/', (req, res) => {
  res.json({
    name: 'AI API Testing Platform',
    version: '1.0.0',
    status: 'online'
  });
});


// ======================================================
// ERROR HANDLER
// MUST BE LAST
// ======================================================

app.use(errorHandler);


export default app;
