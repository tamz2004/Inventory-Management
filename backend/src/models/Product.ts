import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
    productName: string;
    productCode: string;
    weight: number;
    currentStock: number;
    createdAt: Date;
    updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
    {
        productName: {
            type: String,
            required: [true, 'Product name is required'],
            trim: true,
            maxlength: [200, 'Product name must be at most 200 characters'],
        },
        productCode: {
            type: String,
            required: [true, 'Product code is required'],
            unique: true,
            uppercase: true,
            trim: true,
            match: [
                /^[A-Z0-9_-]+$/,
                'Product code can only contain letters, numbers, hyphens, and underscores',
            ],
            maxlength: [50, 'Product code must be at most 50 characters'],
        },
        weight: {
            type: Number,
            required: [true, 'Weight is required'],
            min: [0, 'Weight cannot be negative'],
        },
        currentStock: {
            type: Number,
            default: 0,
            min: [0, 'Stock cannot be negative'],
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// productCode has a fast lookup index via unique: true
// Additional text index for name-based search
productSchema.index({ productName: 'text' });

const Product = mongoose.model<IProduct>('Product', productSchema);

export default Product;
