import express from 'express';
import { 
  generateTests, 
  getTests, 
  runTests, 
  getTestResults, 
  deleteTests 
} from './tests.controller.js';
import { authMiddleware } from '../../core/middlewares/auth.middleware.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/generate/:projectId', generateTests);
router.get('/:projectId', getTests);
router.post('/run/:projectId', runTests);
router.get('/results/:projectId', getTestResults);
router.delete('/:projectId', deleteTests);

export default router;