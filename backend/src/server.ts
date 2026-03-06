import 'dotenv/config';
import app from './app';
import { connectDatabase, disconnectDatabase } from './config/database';

const PORT = Number(process.env.PORT) || 5000;

const gracefulShutdown = async (signal: string): Promise<void> => {
    try {
        await disconnectDatabase();
        process.exit(0);
    } catch (err) {
        console.error(`Shutdown error on ${signal}:`, err);
        process.exit(1);
    }
};

const bootstrap = async (): Promise<void> => {
    try {
        await connectDatabase();

        const server = app.listen(PORT);

        process.on('unhandledRejection', (err: Error) => {
            console.error('UNHANDLED REJECTION:', err.name, err.message);
            server.close(async () => {
                await disconnectDatabase();
                process.exit(1);
            });
        });

        process.on('uncaughtException', (err: Error) => {
            console.error('UNCAUGHT EXCEPTION:', err.name, err.message);
            process.exit(1);
        });

        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
};

bootstrap();
