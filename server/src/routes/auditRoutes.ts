import { Router } from 'express';
import { auditController } from '../controllers/auditController';
import { authenticate, authorizeRoles } from '../middleware/auth';
import { ROLES } from '../config/constants';

const router = Router();

router.get(
  '/',
  authenticate,
  authorizeRoles(ROLES.SUPER_ADMIN),
  auditController.getLogs
);

export default router;
