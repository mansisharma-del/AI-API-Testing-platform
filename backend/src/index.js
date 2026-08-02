// import express from 'express';
// const app = express();
// const PORT = 8000;

// // Root route
// app.get('/', (req, res) => {
//     res.json({
//         name: 'AI API Testing Platform',
//         version: '1.0.0',
//         status: 'online',
//         endpoints: {
//             health: '/health',
//             auth: '/api/v1/auth'
//         }
//     });
// });

// // Health route
// app.get('/health', (req, res) => {
//     res.json({ 
//         status: 'healthy', 
//         message: 'Backend is running',
//         timestamp: new Date().toISOString()
//     });
// });

// app.listen(PORT, () => {
//     console.log(`🚀 Server running on http://localhost:${PORT}`);
//     console.log(`💚 Health: http://localhost:${PORT}/health`);
//     console.log(`🏠 Home: http://localhost:${PORT}`);
// });

import config from './core/config/index.js';
import app from './app.js';

const PORT = process.env.PORT || 8001;

app.listen(PORT, () => {
  console.log('========================================');
  console.log('🚀 AI API Testing Platform Backend');
  console.log('========================================');
  console.log(`📡 Server: http://localhost:${PORT}`);
  console.log(`💚 Health: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth: http://localhost:${PORT}/api/v1/auth`);
  console.log(`📝 Register: POST /api/v1/auth/register`);
  console.log(`🔑 Login: POST /api/v1/auth/login`);
  console.log('========================================');
});