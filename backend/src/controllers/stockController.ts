import { Request, Response, NextFunction } from 'express';
import * as stockService from '../services/stockService';
import { MovementType } from '../models/StockMovement';

// ─── Validation helper ────────────────────────────────────────────────────────

/**
 * Validates that the request body contains a non-empty string `code`.
 * Returns the normalised code on success, or sends a 400 and returns null.
 */
const validateScanBody = (
    req: Request,
    res: Response
): string | null => {
    const { code } = req.body;

    if (!code || typeof code !== 'string' || code.trim() === '') {
        res.status(400).json({
            status: 'fail',
            message: '`code` is required and must be a non-empty string',
        });
        return null;
    }

    return code.trim();
};

// ─── POST /api/stock/inbound/scan ─────────────────────────────────────────────

/**
 * Scan a product code for inbound.
 * Increments currentStock by 1 and records an INBOUND movement.
 */
export const scanInbound = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const code = validateScanBody(req, res);
        if (code === null) return;

        const result = await stockService.processInboundScan({ code });

        res.status(201).json({
            status: 'success',
            message: `1 unit added for product "${result.product.productCode}"`,
            data: {
                movement: result.movement,
                product: {
                    productCode: result.product.productCode,
                    productName: result.product.productName,
                    currentStock: result.product.currentStock,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

// ─── POST /api/stock/outbound/scan ────────────────────────────────────────────

/**
 * Scan a product code for outbound.
 * Decrements currentStock by 1 and records an OUTBOUND movement.
 * Returns 400 if currentStock is 0.
 */
export const scanOutbound = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const code = validateScanBody(req, res);
        if (code === null) return;

        const result = await stockService.processOutboundScan({ code });

        res.status(200).json({
            status: 'success',
            message: `1 unit removed for product "${result.product.productCode}"`,
            data: {
                movement: result.movement,
                product: {
                    productCode: result.product.productCode,
                    productName: result.product.productName,
                    currentStock: result.product.currentStock,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

// ─── GET /api/stock/history ───────────────────────────────────────────────────

/**
 * Paginated movement history — used by Reports & Stock History views.
 * Supports: ?productCode, ?type, ?page, ?limit
 */
export const getMovementHistory = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { productCode, type, page = '1', limit = '20' } = req.query;

        if (type && !['INBOUND', 'OUTBOUND'].includes(type as string)) {
            res.status(400).json({
                status: 'fail',
                message: '`type` must be either INBOUND or OUTBOUND',
            });
            return;
        }

        const result = await stockService.getMovementHistory({
            productCode: productCode as string | undefined,
            type: type as MovementType | undefined,
            page: parseInt(page as string, 10),
            limit: parseInt(limit as string, 10),
        });

        res.status(200).json({
            status: 'success',
            results: result.movements.length,
            pagination: {
                total: result.total,
                page: result.page,
                limit: result.limit,
                totalPages: result.totalPages,
            },
            data: { movements: result.movements },
        });
    } catch (error) {
        next(error);
    }
};
