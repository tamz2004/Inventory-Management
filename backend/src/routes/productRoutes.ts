import { Router } from 'express';
import {
    createProduct,
    getAllProducts,
    getProductByCode,
    updateProduct,
    deleteProduct,
} from '../controllers/productController';

const router = Router();

/**
 * @route   POST /api/products
 * @desc    Create a new product
 */
router.post('/', createProduct);

/**
 * @route   GET /api/products
 * @desc    List all products (supports ?search, ?page, ?limit, ?sortBy, ?sortOrder)
 */
router.get('/', getAllProducts);

/**
 * @route   GET /api/products/:code
 * @desc    Get product by productCode
 */
router.get('/:code', getProductByCode);

/**
 * @route   PUT /api/products/:code
 * @desc    Update product by productCode (name, price, weight only)
 */
router.put('/:code', updateProduct);

/**
 * @route   DELETE /api/products/:code
 * @desc    Delete product by productCode
 */
router.delete('/:code', deleteProduct);

export default router;
