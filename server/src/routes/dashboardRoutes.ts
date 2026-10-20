import { Router } from 'express';
import { dashboardController } from '../controllers/dashboardController';
import { authenticate, authorizeRoles } from '../middleware/auth';
import { ROLES } from '../config/constants';

const router = Router();

router.get(
  '/admin',
  authenticate,
  authorizeRoles(ROLES.SUPER_ADMIN),
  dashboardController.getAdminDashboard
);

router.get(
  '/recruiter',
  authenticate,
  authorizeRoles(ROLES.RECRUITER),
  dashboardController.getRecruiterDashboard
);

router.get(
  '/applicant',
  authenticate,
  authorizeRoles(ROLES.APPLICANT),
  dashboardController.getApplicantDashboard
);

export default router;
