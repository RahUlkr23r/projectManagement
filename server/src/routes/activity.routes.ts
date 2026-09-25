import { Router } from 'express';
import { activityController } from '../controllers/activity.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

// Get recent activity feed (last 20 events from DB for missed-event catchup)
router.get('/', (req, res, next) => activityController.getRecent(req, res, next));

export const activityRoutes = router;
