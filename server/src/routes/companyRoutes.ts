import { Router } from 'express';
import { companyController } from '../controllers/companyController';
import { authenticate, authorizeRoles } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { updateCompanySchema } from '../validators/companyValidators';
import { ROLES } from '../config/constants';

const router = Router();

router.get('/all', authenticate, authorizeRoles(ROLES.SUPER_ADMIN), companyController.getAllCompanies);
router.get('/', authenticate, companyController.getCompany);
router.get('/:id', companyController.getCompany);

router.patch(
  '/',
  authenticate,
  authorizeRoles(ROLES.RECRUITER, ROLES.SUPER_ADMIN),
  validateBody(updateCompanySchema),
  companyController.updateCompany
);

router.patch(
  '/:id',
  authenticate,
  authorizeRoles(ROLES.RECRUITER, ROLES.SUPER_ADMIN),
  validateBody(updateCompanySchema),
  companyController.updateCompany
);

export default router;
