import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not defined');
}

class Database {
    private static instance: Database;
    private isConnected = false;

    private constructor() { }

    static getInstance(): Database {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }

    async connect(): Promise<void> {
        if (this.isConnected) {
            return;
        }
        try {
            mongoose.set('strictQuery', true);
            await mongoose.connect(MONGODB_URI, {
                autoIndex: true,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            });
            this.isConnected = true;
            const db = mongoose.connection;
            db.on('error', (err) => {
                console.error('MongoDB error:', err);
                this.isConnected = false;
            });
            db.on('disconnected', () => {
                this.isConnected = false;
            });

        } catch (error) {
            console.error('❌ MongoDB connection failed:', error);
            process.exit(1);
        }
    }

    async disconnect(): Promise<void> {
        if (!this.isConnected) return;
        await mongoose.connection.close();
        this.isConnected = false;
    }
}

export const connectDatabase = async (): Promise<void> => {
    await Database.getInstance().connect();
};

export const disconnectDatabase = async (): Promise<void> => {
    await Database.getInstance().disconnect();
};
