import express from 'express';

import {
  sendReportEmail,
  sendWelcome,
  getEmailStatus
} from './email.controller.js';

import { authMiddleware } from '../../core/middlewares/auth.middleware.js';

const router = express.Router();

// ======================================================
// AUTHENTICATION
// ======================================================

// All email routes require authentication
router.use(authMiddleware);

// ======================================================
// SEND TEST REPORT EMAIL
// POST /api/v1/email/report/:projectId
// ======================================================

router.post('/report/:projectId', sendReportEmail);

// ======================================================
// SEND WELCOME EMAIL
// POST /api/v1/email/welcome
// ======================================================

router.post('/welcome', sendWelcome);

// ======================================================
// EMAIL STATUS
// GET /api/v1/email/status
// ======================================================

router.get('/status', getEmailStatus);

export default router;
