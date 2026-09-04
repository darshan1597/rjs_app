import mongoose from 'mongoose';
import { env } from './env.js';

async function connectDatabase() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.MONGODB_URL, {
    serverSelectionTimeoutMS: 10000,
  });
}

async function disconnectDatabase() {
  await mongoose.disconnect();
}

export { connectDatabase, disconnectDatabase };
