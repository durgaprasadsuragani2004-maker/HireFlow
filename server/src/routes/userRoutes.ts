import { Router } from 'express';
import { authController } from '../controllers/authController';
import { authenticate, authorizeRoles } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { updateMeSchema, adminCreateUserSchema, adminUpdateUserSchema } from '../validators/authValidators';
import { ROLES } from '../config/constants';

const router = Router();

// Current user profile aliases
router.get('/me', authenticate, authController.getMe);
router.patch('/me', authenticate, validateBody(updateMeSchema), authController.updateMe);

// Admin-only user management routes
router.get('/', authenticate, authorizeRoles(ROLES.SUPER_ADMIN), authController.adminGetUsers);
router.post('/', authenticate, authorizeRoles(ROLES.SUPER_ADMIN), validateBody(adminCreateUserSchema), authController.adminCreateUser);
router.get('/:id', authenticate, authorizeRoles(ROLES.SUPER_ADMIN), authController.adminGetUserById);
router.patch('/:id', authenticate, authorizeRoles(ROLES.SUPER_ADMIN), validateBody(adminUpdateUserSchema), authController.adminUpdateUser);
router.patch('/:id/status', authenticate, authorizeRoles(ROLES.SUPER_ADMIN), authController.adminUpdateUserStatus);
router.delete('/:id', authenticate, authorizeRoles(ROLES.SUPER_ADMIN), authController.adminDeleteUser);

export default router;
