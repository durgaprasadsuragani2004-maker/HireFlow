import { Router } from 'express';
import { authController } from '../controllers/authController';
import { authenticate, authorizeRoles } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  updateMeSchema,
  adminCreateUserSchema,
  adminUpdateUserSchema,
} from '../validators/authValidators';
import { ROLES } from '../config/constants';

const router = Router();

router.post('/register', validateBody(registerSchema), authController.register);
router.post('/login', validateBody(loginSchema), authController.login);
router.post('/refresh', validateBody(refreshTokenSchema), authController.refresh);
router.post('/logout', authController.logout);

router.get('/me', authenticate, authController.getMe);
router.patch('/me', authenticate, validateBody(updateMeSchema), authController.updateMe);

// Admin-only user management
router.get('/admin/users', authenticate, authorizeRoles(ROLES.SUPER_ADMIN), authController.adminGetUsers);
router.post(
  '/admin/users',
  authenticate,
  authorizeRoles(ROLES.SUPER_ADMIN),
  validateBody(adminCreateUserSchema),
  authController.adminCreateUser
);
router.get('/admin/users/:id', authenticate, authorizeRoles(ROLES.SUPER_ADMIN), authController.adminGetUserById);
router.patch(
  '/admin/users/:id',
  authenticate,
  authorizeRoles(ROLES.SUPER_ADMIN),
  validateBody(adminUpdateUserSchema),
  authController.adminUpdateUser
);
router.patch(
  '/admin/users/:id/status',
  authenticate,
  authorizeRoles(ROLES.SUPER_ADMIN),
  authController.adminUpdateUserStatus
);
router.delete(
  '/admin/users/:id',
  authenticate,
  authorizeRoles(ROLES.SUPER_ADMIN),
  authController.adminDeleteUser
);

export default router;
