/**
 * Database Reset Script
 * Clears all Products and StockMovements from the database.
 * Run with: npx ts-node -r dotenv/config scripts/resetDb.ts
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not set in .env');
    process.exit(1);
}

async function reset() {
    console.log('🔌 Connecting to MongoDB…');
    await mongoose.connect(MONGODB_URI);
    const db = mongoose.connection.db!;

    const collections = await db.listCollections().toArray();
    const names = collections.map((c) => c.name);
    console.log('📦 Found collections:', names.join(', ') || '(none)');

    for (const name of names) {
        await db.collection(name).deleteMany({});
        console.log(`🗑️  Cleared: ${name}`);
    }

    console.log('\n✅ Database reset complete. All collections are now empty.');
    await mongoose.disconnect();
    process.exit(0);
}

reset().catch((err) => {
    console.error('❌ Reset failed:', err);
    process.exit(1);
});
