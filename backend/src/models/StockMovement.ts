import mongoose, { Document, Schema, Types } from 'mongoose';

export type MovementType = 'INBOUND' | 'OUTBOUND';

export interface IStockMovement extends Document {
    product: Types.ObjectId;
    type: MovementType;
    createdAt: Date;
    updatedAt: Date;
}

const stockMovementSchema = new Schema<IStockMovement>(
    {
        product: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: [true, 'Product reference is required'],
            index: true,
        },
        type: {
            type: String,
            enum: {
                values: ['INBOUND', 'OUTBOUND'],
                message: 'Movement type must be either INBOUND or OUTBOUND',
            },
            required: [true, 'Movement type is required'],
            index: true,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Composite index for common query patterns
stockMovementSchema.index({ product: 1, createdAt: -1 });
stockMovementSchema.index({ createdAt: -1 });

const StockMovement = mongoose.model<IStockMovement>(
    'StockMovement',
    stockMovementSchema
);

export default StockMovement;
