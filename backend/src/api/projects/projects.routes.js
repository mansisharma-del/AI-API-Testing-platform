import express from 'express';
import { 
  createProject, 
  getProjects, 
  getProject, 
  updateProject, 
  deleteProject 
} from './projects.controller.js';
import { authMiddleware } from '../../core/middlewares/auth.middleware.js';

const router = express.Router();

// ✅ All routes are protected
router.use(authMiddleware);

router.post('/', createProject);
router.get('/', getProjects);
router.get('/:id', getProject);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);

export default router;