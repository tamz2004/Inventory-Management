import 'dotenv/config';
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import routes from './routes';
import notFound from './middleware/notFound';
import errorHandler from './middleware/errorHandler';

const app: Application = express();

// ─── Security ─────────────────────────────────────────────────────────────────
app.use(helmet());

app.use(
    cors({
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    })
);

const limiter = rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX) || 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { status: 'fail', message: 'Too many requests. Please try again later.' },
});
app.use('/api', limiter);

// ─── Parsing ──────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api', routes);

app.get('/api/health', (_req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'API is healthy',
        timestamp: new Date().toISOString(),
    });
});

app.get('/', (_req, res) => {
    res.json({
        message: '🚀 Inventory Management System API',
        version: '1.0.0',
        endpoints: {
            health: 'GET /api/health',
            products: '/api/products',
            stock: '/api/stock',
        },
    });
});

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;

