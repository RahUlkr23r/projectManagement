import { Router } from 'express';
import { taskController } from '../controllers/task.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/role.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import {
  createTaskSchema,
  updateTaskStatusSchema,
  taskQuerySchema,
} from '../validators/task.validator';

const router = Router();

router.use(authenticate);

// List tasks with URL query parameter filters
router.get('/', validateRequest(taskQuerySchema), (req, res, next) =>
  taskController.getAll(req, res, next)
);

// Get single task by ID
router.get('/:id', (req, res, next) => taskController.getById(req, res, next));

// Create task: ADMIN and PROJECT_MANAGER only
router.post(
  '/',
  authorizeRoles('ADMIN', 'PROJECT_MANAGER'),
  validateRequest(createTaskSchema),
  (req, res, next) => taskController.create(req, res, next)
);

// Update task status (available to assigned DEV, project PM, or ADMIN)
router.patch(
  '/:id/status',
  validateRequest(updateTaskStatusSchema),
  (req, res, next) => taskController.updateStatus(req, res, next)
);

export const taskRoutes = router;
