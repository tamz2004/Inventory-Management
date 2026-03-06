import { Router } from 'express';
import {
    getMovementsReport,
    getLowStockReport,
    exportReport,
} from '../controllers/reportController';

const router = Router();

/**
 * @route  GET /api/reports/movements
 * @desc   Filtered movement history with aggregated summary
 * @query  startDate, endDate, type, productCode, page, limit
 */
router.get('/movements', getMovementsReport);

/**
 * @route  GET /api/reports/low-stock
 * @desc   Products below threshold (default: 10)
 * @query  threshold
 */
router.get('/low-stock', getLowStockReport);

/**
 * @route  GET /api/reports/export
 * @desc   Downloads filtered movements as .xlsx file
 * @query  startDate, endDate, type
 */
router.get('/export', exportReport);

export default router;
