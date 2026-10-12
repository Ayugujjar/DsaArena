const mongoose = require('mongoose');
require('dotenv').config();

const resetDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/dsa_tracker';
    const databaseHost = new URL(mongoUri).hostname;
    const isLocalDatabase = ['localhost', '127.0.0.1', '[::1]', '::1'].includes(databaseHost);
    if (process.env.NODE_ENV !== 'development' || process.env.ALLOW_DESTRUCTIVE_DEV_DB !== 'true' || !isLocalDatabase) {
      throw new Error(
        'Database reset refused. Set NODE_ENV=development and ALLOW_DESTRUCTIVE_DEV_DB=true, and use a local MongoDB URI.'
      );
    }

    await mongoose.connect(mongoUri);
    console.log('[Database Reset] Connected to local development MongoDB');

    const collections = await mongoose.connection.db.collections();
    for (const collection of collections) {
      await collection.deleteMany({});
      console.log(`[Database Reset] Purged collection: ${collection.collectionName}`);
    }

    console.log('\n[Database Reset] All collections emptied successfully.');
    console.log('[Database Reset] Database state: 0 Students, 0 Admins, 0 Batches, 0 Records.\n');
    process.exit(0);
  } catch (error) {
    console.error('[Database Reset] Error:', error.message);
    process.exit(1);
  }
};

resetDatabase();
