import { Router } from 'express';
import {
    scanInbound,
    scanOutbound,
    getMovementHistory,
} from '../controllers/stockController';

const router = Router();

/**
 * @route   POST /api/stock/inbound/scan
 * @desc    Scan a product barcode/code for inbound — adds 1 unit to stock
 * @body    { code: string }
 */
router.post('/inbound/scan', scanInbound);

/**
 * @route   POST /api/stock/outbound/scan
 * @desc    Scan a product barcode/code for outbound — removes 1 unit from stock
 * @body    { code: string }
 * @note    Returns 400 { message: "Out of stock" } if currentStock is 0
 */
router.post('/outbound/scan', scanOutbound);

/**
 * @route   GET /api/stock/history
 * @desc    Paginated movement history
 * @query   productCode?, type?, page?, limit?
 */
router.get('/history', getMovementHistory);

export default router;
