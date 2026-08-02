import express from 'express';
import config from '../../core/config/index.js';
import { 
  getReport,
  downloadHTMLReport,
  downloadPDFReport,
  getReportsList
} from './reports.controller.js';
import { authMiddleware } from '../../core/middlewares/auth.middleware.js';

const router = express.Router();

// All routes are protected
router.use(authMiddleware);

// Get report data (JSON)
router.get('/:projectId', getReport);

// Download HTML report
router.get('/:projectId/html', downloadHTMLReport);

// Download PDF report
router.get('/:projectId/pdf', downloadPDFReport);

// Get list of all reports
router.get('/:projectId/list', getReportsList);

export default router;  // ✅ Ye line add karein