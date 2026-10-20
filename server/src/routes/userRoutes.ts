import { Router } from 'express';
import { authController } from '../controllers/authController';
import { authenticate, authorizeRoles } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { updateMeSchema } from '../validators/authValidators';
import { ROLES } from '../config/constants';

const router = Router();

// Current user profile aliases
router.get('/me', authenticate, authController.getMe);
router.patch('/me', authenticate, validateBody(updateMeSchema), authController.updateMe);

// Admin-only user management aliases
router.get('/', authenticate, authorizeRoles(ROLES.SUPER_ADMIN), authController.adminGetUsers);
router.patch('/:id/status', authenticate, authorizeRoles(ROLES.SUPER_ADMIN), authController.adminUpdateUserStatus);

export default router;
