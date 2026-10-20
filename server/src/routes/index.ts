import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import jobRoutes from './jobRoutes';
import applicationRoutes from './applicationRoutes';
import candidateRoutes from './candidateRoutes';
import interviewRoutes from './interviewRoutes';
import notificationRoutes from './notificationRoutes';
import dashboardRoutes from './dashboardRoutes';
import companyRoutes from './companyRoutes';
import auditRoutes from './auditRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/jobs', jobRoutes);
router.use('/applications', applicationRoutes);
router.use('/candidates', candidateRoutes);
router.use('/interviews', interviewRoutes);
router.use('/notifications', notificationRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/companies', companyRoutes);
router.use('/audit', auditRoutes);

// Resume download direct route alias
router.use('/', candidateRoutes);

export default router;
