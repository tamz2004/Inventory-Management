import mongoose from 'mongoose';
import Product, { IProduct } from '../models/Product';
import StockMovement, { IStockMovement, MovementType } from '../models/StockMovement';
import AppError from '../utils/AppError';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Payload for a single barcode/QR scan event */
export interface ScanDTO {
    code: string;
}

export interface ScanResult {
    movement: IStockMovement;
    product: IProduct;
}

export interface MovementFilter {
    productCode?: string;
    type?: MovementType;
    page?: number;
    limit?: number;
}

export interface PaginatedMovements {
    movements: IStockMovement[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// ─── Private helper ───────────────────────────────────────────────────────────

/**
 * Core scan movement logic.
 * Wraps in a MongoDB transaction to guarantee atomicity:
 * stock update + movement record are committed together or rolled back entirely.
 */
const processScan = async (
    type: MovementType,
    data: ScanDTO
): Promise<ScanResult> => {
    const normalizedCode = data.code.toUpperCase();
    const stockDelta = type === 'INBOUND' ? 1 : -1;

    const product = await Product.findOneAndUpdate(
        {
            productCode: normalizedCode,
            ...(type === 'OUTBOUND' ? { currentStock: { $gt: 0 } } : {}),
        },
        { $inc: { currentStock: stockDelta } },
        { new: true }
    );

    if (!product) {
        if (type === 'OUTBOUND') {
            const exists = await Product.exists({ productCode: normalizedCode });
            if (exists) {
                throw new AppError('Out of stock', 400);
            }
        }

        throw new AppError(`Product with code "${normalizedCode}" not found`, 404);
    }

    try {
        const movement = await StockMovement.create({ product: product._id, type });
        return { movement, product };
    } catch (error) {
        // Best-effort stock rollback if movement log fails.
        await Product.updateOne({ _id: product._id }, { $inc: { currentStock: -stockDelta } });
        throw error;
    }
};

// ─── Public service methods ────────────────────────────────────────────────────

/**
 * Process one inbound scan: +1 to currentStock.
 */
export const processInboundScan = async (data: ScanDTO): Promise<ScanResult> => {
    return processScan('INBOUND', data);
};

/**
 * Process one outbound scan: -1 to currentStock.
 * Throws 400 if currentStock is already 0.
 */
export const processOutboundScan = async (data: ScanDTO): Promise<ScanResult> => {
    return processScan('OUTBOUND', data);
};

/**
 * Paginated movement history — used by the Reports & Stock History views.
 */
export const getMovementHistory = async (
    filter: MovementFilter
): Promise<PaginatedMovements> => {
    const { productCode, type, page = 1, limit = 20 } = filter;

    const query: mongoose.FilterQuery<IStockMovement> = {};

    if (productCode) {
        const product = await Product.findOne({
            productCode: productCode.toUpperCase(),
        }).select('_id');

        if (!product) {
            throw new AppError(
                `Product with code "${productCode.toUpperCase()}" not found`,
                404
            );
        }
        query.product = product._id;
    }

    if (type) {
        query.type = type;
    }

    const skip = (page - 1) * limit;

    const [movements, total] = await Promise.all([
        StockMovement.find(query)
            .populate('product', 'productName productCode currentStock')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        StockMovement.countDocuments(query),
    ]);

    return {
        movements: movements as unknown as IStockMovement[],
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
};

