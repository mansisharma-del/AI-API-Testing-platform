import dotenv from 'dotenv';

dotenv.config();

console.log('========================================');
console.log('📧 Email Config Debug:');
console.log('📧 SMTP_USER:', process.env.SMTP_USER || '❌ Not Set');
console.log('📧 SMTP_PASS:', process.env.SMTP_PASS ? '✅ Set' : '❌ Missing');
console.log('📧 EMAIL_ENABLED:', process.env.EMAIL_ENABLED || '❌ Not Set');
console.log('========================================');

const config = {
  port: parseInt(process.env.PORT || '8001'),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  database: {
    url: process.env.DATABASE_URL
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: '7d'
  },
  
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo'
  },
  
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || '',
    enabled: process.env.EMAIL_ENABLED === 'true'
  }
};

console.log('📧 Config Email Object:', {
  host: config.email.host,
  port: config.email.port,
  user: config.email.user || '❌ Empty',
  pass: config.email.pass ? '✅ Set' : '❌ Empty',
  enabled: config.email.enabled
});

export default config;