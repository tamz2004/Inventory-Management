import { Router } from 'express';
import productRoutes from './productRoutes';
import stockRoutes from './stockRoutes';
import dashboardRoutes from './dashboardRoutes';
import reportRoutes from './reportRoutes';

const router = Router();

router.use('/dashboard', dashboardRoutes);
router.use('/products', productRoutes);
router.use('/stock', stockRoutes);
router.use('/reports', reportRoutes);

export default router;
