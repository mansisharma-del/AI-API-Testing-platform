
// import config from './core/config/index.js';
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
