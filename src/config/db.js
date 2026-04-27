const mongoose = require('mongoose');
const env = require('./env');

mongoose.set('strictQuery', true);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGO_URI);

    console.log(`[db] MongoDB Connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error(`[db] MongoDB connection error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[db] MongoDB disconnected');
    });

    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('[db] MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error(`[db] Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = { connectDB, mongoose };
