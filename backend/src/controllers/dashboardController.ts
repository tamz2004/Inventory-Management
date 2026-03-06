import { Request, Response, NextFunction } from 'express';
import Product from '../models/Product';
import StockMovement from '../models/StockMovement';

/**
 * GET /api/dashboard/summary
 * Returns aggregated stats used by the Dashboard page.
 */
export const getDashboardSummary = async (
    _req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const LOW_STOCK_THRESHOLD = 10;

        // Run all DB queries in parallel for performance
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const [
            totalProducts,
            stockValueAgg,
            lowStockCount,
            inboundToday,
            outboundToday,
            recentMovements,
            lowStockProducts,
        ] = await Promise.all([
            // Total product count
            Product.countDocuments(),

            // Total stock units: sum of all currentStock
            Product.aggregate([
                {
                    $group: {
                        _id: null,
                        totalValue: { $sum: '$currentStock' },
                    },
                },
            ]),

            // Products below threshold
            Product.countDocuments({ currentStock: { $lt: LOW_STOCK_THRESHOLD } }),

            // Total inbound scans today (each scan = 1 unit)
            StockMovement.aggregate([
                { $match: { type: 'INBOUND', createdAt: { $gte: todayStart } } },
                { $group: { _id: null, total: { $sum: 1 } } },
            ]),

            // Total outbound scans today (each scan = 1 unit)
            StockMovement.aggregate([
                { $match: { type: 'OUTBOUND', createdAt: { $gte: todayStart } } },
                { $group: { _id: null, total: { $sum: 1 } } },
            ]),

            // Last 5 movements with product info
            StockMovement.find()
                .populate('product', 'productName productCode')
                .sort({ createdAt: -1 })
                .limit(5)
                .lean(),

            // Low stock products list
            Product.find({ currentStock: { $lt: LOW_STOCK_THRESHOLD } })
                .select('productName productCode currentStock weight')
                .sort({ currentStock: 1 })
                .limit(10)
                .lean(),
        ]);

        res.status(200).json({
            status: 'success',
            data: {
                summary: {
                    totalProducts,
                    totalStockUnits: stockValueAgg[0]?.totalValue ?? 0,
                    lowStockCount,
                    inboundToday: inboundToday[0]?.total ?? 0,
                    outboundToday: outboundToday[0]?.total ?? 0,
                },
                recentMovements,
                lowStockProducts,
            },
        });
    } catch (error) {
        next(error);
    }
};
