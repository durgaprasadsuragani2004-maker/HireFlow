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

// User management routes (Super Admin & Company Organization)
router.get('/', authenticate, authorizeRoles(ROLES.SUPER_ADMIN, ROLES.COMPANY), authController.adminGetUsers);
router.post('/', authenticate, authorizeRoles(ROLES.SUPER_ADMIN, ROLES.COMPANY), validateBody(adminCreateUserSchema), authController.adminCreateUser);
router.get('/:id', authenticate, authorizeRoles(ROLES.SUPER_ADMIN, ROLES.COMPANY), authController.adminGetUserById);
router.patch('/:id', authenticate, authorizeRoles(ROLES.SUPER_ADMIN, ROLES.COMPANY), validateBody(adminUpdateUserSchema), authController.adminUpdateUser);
router.patch('/:id/status', authenticate, authorizeRoles(ROLES.SUPER_ADMIN, ROLES.COMPANY), authController.adminUpdateUserStatus);
router.delete('/:id', authenticate, authorizeRoles(ROLES.SUPER_ADMIN, ROLES.COMPANY), authController.adminDeleteUser);

export default router;
