import { Router } from 'express';
import { getDashboardSummary } from '../controllers/dashboardController';

const router = Router();

/**
 * @route  GET /api/dashboard/summary
 * @desc   Returns totalProducts, stockValue, lowStockCount,
 *         inbound/outbound today, recentMovements, lowStockProducts
 */
router.get('/summary', getDashboardSummary);

export default router;
