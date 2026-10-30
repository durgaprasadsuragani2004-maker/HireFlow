import { Router } from 'express';
import { companyController } from '../controllers/companyController';
import { authenticate, authorizeRoles } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createCompanySchema, updateCompanySchema } from '../validators/companyValidators';
import { ROLES } from '../config/constants';

const router = Router();

// Super Admin view all organizations
router.get('/all', authenticate, authorizeRoles(ROLES.SUPER_ADMIN), companyController.getAllCompanies);

// Recruiter or Super Admin get single company
router.get('/', authenticate, companyController.getCompany);
router.get('/:id', authenticate, companyController.getCompany);

// Company-specific recruitment funnel analytics
router.get('/:id/analytics', authenticate, companyController.getCompanyAnalytics);

// Super Admin create organization
router.post(
  '/',
  authenticate,
  authorizeRoles(ROLES.SUPER_ADMIN),
  validateBody(createCompanySchema),
  companyController.createCompany
);

// Recruiter update their own company profile or Super Admin update any
router.patch(
  '/',
  authenticate,
  authorizeRoles(ROLES.RECRUITER, ROLES.SUPER_ADMIN, ROLES.COMPANY),
  validateBody(updateCompanySchema),
  companyController.updateCompany
);

router.patch(
  '/:id',
  authenticate,
  authorizeRoles(ROLES.RECRUITER, ROLES.SUPER_ADMIN, ROLES.COMPANY),
  validateBody(updateCompanySchema),
  companyController.updateCompany
);

// Super Admin delete organization (with historical data preservation safety)
router.delete(
  '/:id',
  authenticate,
  authorizeRoles(ROLES.SUPER_ADMIN),
  companyController.deleteCompany
);

export default router;
