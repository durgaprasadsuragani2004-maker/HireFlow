import { Router } from 'express';
import { applicationController } from '../controllers/applicationController';
import { authenticate, authorizeRoles } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validate';
import {
  applyJobSchema,
  changeStageSchema,
  updateNotesSchema,
  queryApplicationsSchema,
} from '../validators/applicationValidators';
import { ROLES } from '../config/constants';

const router = Router();

// Applicant routes
router.post(
  '/jobs/:jobId/apply',
  authenticate,
  authorizeRoles(ROLES.APPLICANT),
  validateBody(applyJobSchema),
  applicationController.applyJob
);

router.get(
  '/my',
  authenticate,
  authorizeRoles(ROLES.APPLICANT),
  applicationController.getMyApplications
);

// Recruiter / Admin routes
router.get(
  '/',
  authenticate,
  authorizeRoles(ROLES.RECRUITER, ROLES.SUPER_ADMIN),
  validateQuery(queryApplicationsSchema),
  applicationController.queryApplications
);

router.get(
  '/kanban/:jobId',
  authenticate,
  authorizeRoles(ROLES.RECRUITER, ROLES.SUPER_ADMIN),
  applicationController.getKanban
);

router.get('/:id', authenticate, applicationController.getApplicationById);
router.get('/:id/history', authenticate, applicationController.getStageHistory);

router.patch(
  '/:id/stage',
  authenticate,
  authorizeRoles(ROLES.RECRUITER, ROLES.SUPER_ADMIN),
  validateBody(changeStageSchema),
  applicationController.changeStage
);

router.patch(
  '/:id/notes',
  authenticate,
  authorizeRoles(ROLES.RECRUITER, ROLES.SUPER_ADMIN),
  validateBody(updateNotesSchema),
  applicationController.updateNotes
);

export default router;
