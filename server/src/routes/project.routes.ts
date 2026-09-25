import { Router } from 'express';
import { projectController } from '../controllers/project.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/role.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { createProjectSchema } from '../validators/project.validator';

const router = Router();

router.use(authenticate);

// View projects (filtered by role inside service)
router.get('/', (req, res, next) => projectController.getAll(req, res, next));

// View single project
router.get('/:id', (req, res, next) => projectController.getById(req, res, next));

// Create project: restricted to ADMIN and PROJECT_MANAGER
router.post(
  '/',
  authorizeRoles('ADMIN', 'PROJECT_MANAGER'),
  validateRequest(createProjectSchema),
  (req, res, next) => projectController.create(req, res, next)
);

export const projectRoutes = router;
