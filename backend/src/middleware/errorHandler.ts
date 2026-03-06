import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import AppError from '../utils/AppError';

type RawError = Error & {
    statusCode?: number;
    status?: string;
    isOperational?: boolean;
    code?: number;
    keyValue?: Record<string, unknown>;
};

const sendErrorDev = (err: AppError, res: Response): void => {
    res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        stack: err.stack,
        error: err,
    });
};

const sendErrorProd = (err: AppError, res: Response): void => {
    if (err.isOperational) {
        res.status(err.statusCode).json({ status: err.status, message: err.message });
    } else {
        console.error('💥 UNHANDLED ERROR:', err);
        res.status(500).json({ status: 'error', message: 'Something went wrong.' });
    }
};

const errorHandler = (
    err: RawError,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    let error: AppError;

    if (err.name === 'CastError') {
        const castErr = err as unknown as mongoose.Error.CastError;
        error = new AppError(`Invalid ${castErr.path}: ${castErr.value}`, 400);
    } else if (err.code === 11000 && err.keyValue) {
        const value = Object.values(err.keyValue)[0];
        error = new AppError(`Duplicate value: "${value}". Use a different value.`, 409);
    } else if (err.name === 'ValidationError') {
        const valErr = err as unknown as mongoose.Error.ValidationError;
        const msgs = Object.values(valErr.errors).map((e) => e.message);
        error = new AppError(`Validation failed: ${msgs.join('. ')}`, 422);
    } else if (err.name === 'JsonWebTokenError') {
        error = new AppError('Invalid token. Please log in again.', 401);
    } else if (err.name === 'TokenExpiredError') {
        error = new AppError('Token expired. Please log in again.', 401);
    } else {
        error = new AppError(
            err.message || 'Internal server error',
            err.statusCode ?? 500
        );
        (error as unknown as Record<string, unknown>)['isOperational'] =
            err.isOperational ?? false;
    }

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(error, res);
    } else {
        sendErrorProd(error, res);
    }
};

export default errorHandler;
