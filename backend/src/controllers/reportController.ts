import { Request, Response, NextFunction } from 'express';
import StockMovement from '../models/StockMovement';
import Product from '../models/Product';
import AppError from '../utils/AppError';
import * as XLSX from 'xlsx';

const parsePositiveInt = (value: unknown, fallback: number): number => {
    const parsed = parseInt(String(value), 10);
    if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
    return parsed;
};

/**
 * GET /api/reports/movements
 * Returns filtered stock movement history for the Reports page.
 * Supports: ?startDate, ?endDate, ?type, ?productCode, ?page, ?limit
 */
export const getMovementsReport = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { startDate, endDate, type, productCode, page = '1', limit = '50' } = req.query;

        const query: Record<string, unknown> = {};

        // Date range filter
        if (startDate || endDate) {
            const dateFilter: Record<string, Date> = {};
            if (startDate) dateFilter.$gte = new Date(startDate as string);
            if (endDate) {
                const end = new Date(endDate as string);
                end.setHours(23, 59, 59, 999);
                dateFilter.$lte = end;
            }
            query.createdAt = dateFilter;
        }

        // Movement type filter
        if (type && ['INBOUND', 'OUTBOUND'].includes(type as string)) {
            query.type = type;
        } else if (type) {
            next(new AppError('type must be INBOUND or OUTBOUND', 400));
            return;
        }

        // Product code filter
        if (productCode) {
            const product = await Product.findOne({
                productCode: (productCode as string).toUpperCase(),
            }).select('_id');
            if (!product) {
                next(new AppError(`Product "${productCode}" not found`, 404));
                return;
            }
            query.product = product._id;
        }

        const pageNum = parsePositiveInt(page, 1);
        const limitNum = parsePositiveInt(limit, 50);
        const skip = (pageNum - 1) * limitNum;

        const [movements, total, summary] = await Promise.all([
            StockMovement.find(query)
                .populate('product', 'productName productCode')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),

            StockMovement.countDocuments(query),

            // Aggregated summary for the filtered period
            StockMovement.aggregate([
                { $match: query },
                {
                    $group: {
                        _id: '$type',
                        count: { $sum: 1 },
                    },
                },
            ]),
        ]);

        // Build summary object
        const inboundSummary = summary.find((s) => s._id === 'INBOUND');
        const outboundSummary = summary.find((s) => s._id === 'OUTBOUND');

        res.status(200).json({
            status: 'success',
            results: movements.length,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum),
            },
            summary: {
                inboundCount: inboundSummary?.count ?? 0,
                outboundCount: outboundSummary?.count ?? 0,
            },
            data: { movements },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/reports/low-stock
 * Returns all products below a configurable threshold.
 * Supports: ?threshold (default: 10)
 */
export const getLowStockReport = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const threshold = parsePositiveInt(req.query.threshold, 10);

        const products = await Product.find({ currentStock: { $lt: threshold } })
            .select('productName productCode currentStock weight')
            .sort({ currentStock: 1 })
            .lean();

        res.status(200).json({
            status: 'success',
            threshold,
            results: products.length,
            data: { products },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/reports/export
 * Returns movement data formatted for Excel export.
 */
export const exportReport = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { startDate, endDate, type } = req.query;
        const query: Record<string, unknown> = {};

        if (startDate || endDate) {
            const dateFilter: Record<string, Date> = {};
            if (startDate) dateFilter.$gte = new Date(startDate as string);
            if (endDate) {
                const end = new Date(endDate as string);
                end.setHours(23, 59, 59, 999);
                dateFilter.$lte = end;
            }
            query.createdAt = dateFilter;
        }

        if (type && ['INBOUND', 'OUTBOUND'].includes(type as string)) {
            query.type = type;
        }

        const movements = await StockMovement.find(query)
            .populate('product', 'productName productCode')
            .sort({ createdAt: -1 })
            .lean();

        // Shape data for Excel
        const rows = movements.map((m) => {
            const product = m.product as unknown as Record<string, string>;
            return {
                Date: new Date(m.createdAt).toLocaleString(),
                'Product Name': product?.productName ?? '',
                'Product Code': product?.productCode ?? '',
                Type: m.type,
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock Report');

        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Disposition', `attachment; filename="Stock_Report_${new Date().toISOString().split('T')[0]}.xlsx"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
    } catch (error) {
        next(error);
    }
};

