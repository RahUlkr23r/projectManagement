import { Router } from 'express';
import { clientController } from '../controllers/client.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/role.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { createClientSchema } from '../validators/client.validator';

const router = Router();

// All client routes require authentication
router.use(authenticate);

// Admin and PM can view clients
router.get('/', authorizeRoles('ADMIN', 'PROJECT_MANAGER'), (req, res, next) =>
  clientController.getAll(req, res, next)
);

// Admin and PM can create clients
router.post(
  '/',
  authorizeRoles('ADMIN', 'PROJECT_MANAGER'),
  validateRequest(createClientSchema),
  (req, res, next) => clientController.create(req, res, next)
);

export const clientRoutes = router;
