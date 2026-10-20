import { Router } from 'express';
import { interviewController } from '../controllers/interviewController';
import { authenticate, authorizeRoles } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import {
  scheduleInterviewSchema,
  updateInterviewSchema,
} from '../validators/interviewValidators';
import { ROLES } from '../config/constants';

const router = Router();

router.get('/', authenticate, interviewController.getInterviews);
router.get('/:id', authenticate, interviewController.getInterviewById);

router.post(
  '/',
  authenticate,
  authorizeRoles(ROLES.RECRUITER, ROLES.SUPER_ADMIN),
  validateBody(scheduleInterviewSchema),
  interviewController.scheduleInterview
);

router.patch(
  '/:id',
  authenticate,
  authorizeRoles(ROLES.RECRUITER, ROLES.SUPER_ADMIN),
  validateBody(updateInterviewSchema),
  interviewController.updateInterview
);

router.delete(
  '/:id',
  authenticate,
  authorizeRoles(ROLES.RECRUITER, ROLES.SUPER_ADMIN),
  interviewController.deleteInterview
);

export default router;
