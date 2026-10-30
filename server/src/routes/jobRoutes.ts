import { Router } from 'express';
import { jobController } from '../controllers/jobController';
import { authenticate, authorizeRoles, optionalAuth } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validate';
import { createJobSchema, updateJobSchema, queryJobsSchema } from '../validators/jobValidators';
import { ROLES } from '../config/constants';

const router = Router();

router.get('/', optionalAuth, validateQuery(queryJobsSchema), jobController.queryJobs);
router.get('/:id', optionalAuth, jobController.getJobById);

// Recruiter, Company & Super Admin Job CRUD
router.post(
  '/',
  authenticate,
  authorizeRoles(ROLES.RECRUITER, ROLES.SUPER_ADMIN, ROLES.COMPANY),
  validateBody(createJobSchema),
  jobController.createJob
);

router.patch(
  '/:id',
  authenticate,
  authorizeRoles(ROLES.RECRUITER, ROLES.SUPER_ADMIN, ROLES.COMPANY),
  validateBody(updateJobSchema),
  jobController.updateJob
);

router.put(
  '/:id',
  authenticate,
  authorizeRoles(ROLES.RECRUITER, ROLES.SUPER_ADMIN, ROLES.COMPANY),
  validateBody(updateJobSchema),
  jobController.updateJob
);

router.post(
  '/:id/publish',
  authenticate,
  authorizeRoles(ROLES.RECRUITER, ROLES.SUPER_ADMIN, ROLES.COMPANY),
  jobController.publishJob
);

router.post(
  '/:id/unpublish',
  authenticate,
  authorizeRoles(ROLES.RECRUITER, ROLES.SUPER_ADMIN, ROLES.COMPANY),
  jobController.unpublishJob
);

router.delete(
  '/:id',
  authenticate,
  authorizeRoles(ROLES.RECRUITER, ROLES.SUPER_ADMIN, ROLES.COMPANY),
  jobController.deleteJob
);

export default router;

