import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/role.middleware';

const router = Router();

router.use(authenticate);

// Get developers for task assignments (PM & Admin)
router.get('/developers', authorizeRoles('ADMIN', 'PROJECT_MANAGER'), (req, res, next) =>
  userController.getDevelopers(req, res, next)
);

// Get all users (Admin only)
router.get('/', authorizeRoles('ADMIN'), (req, res, next) =>
  userController.getAll(req, res, next)
);

export const userRoutes = router;
