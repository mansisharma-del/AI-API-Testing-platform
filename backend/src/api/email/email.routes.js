import express from 'express';

import {
  sendReportEmail,
  sendWelcome,
  getEmailStatus
} from './email.controller.js';

import { authMiddleware } from '../../core/middlewares/auth.middleware.js';

const router = express.Router();

// All routes are protected
router.use(authMiddleware);

// Send test report via email
router.post('/report/:projectId', sendReportEmail);

// Send welcome email
router.post('/welcome', sendWelcome);

// Check email configuration status
router.get('/status', getEmailStatus);

export default router;
