import { Request, Response, NextFunction } from 'express';
import * as productService from '../services/productService';

const parsePositiveInt = (value: unknown, fallback: number): number => {
    const parsed = parseInt(String(value), 10);
    if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
    return parsed;
};

// POST /api/products
export const createProduct = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { productName, productCode, weight, currentStock } = req.body;

        if (!productName || !productCode || weight === undefined) {
            res.status(400).json({
                status: 'fail',
                message: 'productName, productCode, and weight are required',
            });
            return;
        }

        if (typeof weight !== 'number' || weight < 0) {
            res.status(400).json({ status: 'fail', message: 'weight must be a non-negative number' });
            return;
        }

        const product = await productService.createProduct({
            productName,
            productCode,
            weight,
            currentStock,
        });

        res.status(201).json({
            status: 'success',
            message: 'Product created successfully',
            data: { product },
        });
    } catch (error) {
        next(error);
    }
};

// GET /api/products
export const getAllProducts = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const {
            search,
            page = '1',
            limit = '20',
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = req.query;

        const result = await productService.getAllProducts({
            search: search as string | undefined,
            page: parsePositiveInt(page, 1),
            limit: parsePositiveInt(limit, 20),
            sortBy: sortBy as string,
            sortOrder: sortOrder as 'asc' | 'desc',
        });

        res.status(200).json({
            status: 'success',
            results: result.products.length,
            pagination: {
                total: result.total,
                page: result.page,
                limit: result.limit,
                totalPages: result.totalPages,
            },
            data: { products: result.products },
        });
    } catch (error) {
        next(error);
    }
};

// GET /api/products/:code
export const getProductByCode = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const product = await productService.getProductByCode(req.params.code);
        res.status(200).json({
            status: 'success',
            data: { product },
        });
    } catch (error) {
        next(error);
    }
};

// PUT /api/products/:code
export const updateProduct = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { productName, weight } = req.body;

        if (weight !== undefined && (typeof weight !== 'number' || weight < 0)) {
            res.status(400).json({ status: 'fail', message: 'weight must be a non-negative number' });
            return;
        }

        const product = await productService.updateProduct(req.params.code, {
            productName,
            weight,
        });

        res.status(200).json({
            status: 'success',
            message: 'Product updated successfully',
            data: { product },
        });
    } catch (error) {
        next(error);
    }
};

// DELETE /api/products/:code
export const deleteProduct = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        await productService.deleteProduct(req.params.code);
        res.status(200).json({
            status: 'success',
            message: `Product "${req.params.code.toUpperCase()}" deleted successfully`,
            data: null,
        });
    } catch (error) {
        next(error);
    }
};

