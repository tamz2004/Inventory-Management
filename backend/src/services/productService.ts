import mongoose from 'mongoose';
import Product, { IProduct } from '../models/Product';
import AppError from '../utils/AppError';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateProductDTO {
    productName: string;
    productCode: string;
    weight: number;
    currentStock?: number;
}

export interface UpdateProductDTO {
    productName?: string;
    weight?: number;
}

export interface ProductFilter {
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface PaginatedProducts {
    products: IProduct[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const createProduct = async (
    data: CreateProductDTO
): Promise<IProduct> => {
    const existing = await Product.findOne({
        productCode: data.productCode.toUpperCase(),
    });
    if (existing) {
        throw new AppError(
            `Product with code "${data.productCode.toUpperCase()}" already exists`,
            409
        );
    }

    const product = await Product.create(data);
    return product;
};

export const getAllProducts = async (
    filter: ProductFilter
): Promise<PaginatedProducts> => {
    const { search, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = filter;

    const query: mongoose.FilterQuery<IProduct> = {};

    if (search) {
        query.$or = [
            { productName: { $regex: search, $options: 'i' } },
            { productCode: { $regex: search, $options: 'i' } },
        ];
    }

    const sortDir = sortOrder === 'asc' ? 1 : -1;
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
        Product.find(query)
            .sort({ [sortBy]: sortDir })
            .skip(skip)
            .limit(limit)
            .lean(),
        Product.countDocuments(query),
    ]);

    return {
        products: products as unknown as IProduct[],
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
};

export const getProductByCode = async (
    productCode: string
): Promise<IProduct> => {
    const product = await Product.findOne({
        productCode: productCode.toUpperCase(),
    });
    if (!product) {
        throw new AppError(
            `Product with code "${productCode.toUpperCase()}" not found`,
            404
        );
    }
    return product;
};

export const updateProduct = async (
    productCode: string,
    data: UpdateProductDTO
): Promise<IProduct> => {
    const product = await Product.findOneAndUpdate(
        { productCode: productCode.toUpperCase() },
        { $set: data },
        { new: true, runValidators: true }
    );

    if (!product) {
        throw new AppError(
            `Product with code "${productCode.toUpperCase()}" not found`,
            404
        );
    }
    return product;
};

export const deleteProduct = async (productCode: string): Promise<void> => {
    const product = await Product.findOneAndDelete({
        productCode: productCode.toUpperCase(),
    });
    if (!product) {
        throw new AppError(
            `Product with code "${productCode.toUpperCase()}" not found`,
            404
        );
    }
};
