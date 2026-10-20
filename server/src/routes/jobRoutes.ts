import { Router } from 'express';
import { jobController } from '../controllers/jobController';
import { authenticate, authorizeRoles, optionalAuth } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validate';
import { createJobSchema, updateJobSchema, queryJobsSchema } from '../validators/jobValidators';
import { ROLES } from '../config/constants';

const router = Router();

router.get('/', optionalAuth, validateQuery(queryJobsSchema), jobController.queryJobs);
router.get('/:id', optionalAuth, jobController.getJobById);

// Recruiter & Super Admin Job CRUD
router.post(
  '/',
  authenticate,
  authorizeRoles(ROLES.RECRUITER, ROLES.SUPER_ADMIN),
  validateBody(createJobSchema),
  jobController.createJob
);

router.patch(
  '/:id',
  authenticate,
  authorizeRoles(ROLES.RECRUITER, ROLES.SUPER_ADMIN),
  validateBody(updateJobSchema),
  jobController.updateJob
);

router.post(
  '/:id/publish',
  authenticate,
  authorizeRoles(ROLES.RECRUITER, ROLES.SUPER_ADMIN),
  jobController.publishJob
);

router.post(
  '/:id/unpublish',
  authenticate,
  authorizeRoles(ROLES.RECRUITER, ROLES.SUPER_ADMIN),
  jobController.unpublishJob
);

router.delete(
  '/:id',
  authenticate,
  authorizeRoles(ROLES.RECRUITER, ROLES.SUPER_ADMIN),
  jobController.deleteJob
);

export default router;
