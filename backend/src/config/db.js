import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lab_management';
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000 // Timeout quickly to activate mock database fallback
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    global.isMockDB = false;
  } catch (error) {
    console.warn('\x1b[33m%s\x1b[0m', `⚠️ MongoDB Connection Failed: ${error.message}`);
    console.warn('\x1b[36m%s\x1b[0m', 'ℹ️ Switching to local In-Memory Mock Database for seamless operation.');
    global.isMockDB = true;
  }
};
