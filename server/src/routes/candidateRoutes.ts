import { Router } from 'express';
import { candidateController } from '../controllers/candidateController';
import { authenticate, authorizeRoles } from '../middleware/auth';
import { uploadResume } from '../middleware/upload';
import { ROLES } from '../config/constants';

const router = Router();

router.get(
  '/',
  authenticate,
  authorizeRoles(ROLES.RECRUITER, ROLES.SUPER_ADMIN),
  candidateController.queryCandidates
);

router.get('/:id', authenticate, candidateController.getCandidateProfile);

router.post(
  '/resume/upload',
  authenticate,
  authorizeRoles(ROLES.APPLICANT),
  uploadResume.single('resume'),
  candidateController.uploadResume
);

router.post(
  '/skills',
  authenticate,
  authorizeRoles(ROLES.APPLICANT),
  candidateController.updateSkills
);

// Secure authenticated resume download route with BOLA RBAC protection
router.get('/resumes/:filename', authenticate, candidateController.downloadResume);

export default router;
