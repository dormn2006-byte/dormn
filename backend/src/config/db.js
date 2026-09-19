import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

export const MONGO_DB_NAME = process.env.MONGO_DB_NAME || "dormn";

export const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return mongoose.connection;

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not set. Add it to your .env file.");
  }

  await mongoose.connect(process.env.MONGO_URI, {
    dbName: MONGO_DB_NAME,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10000,
  });

  console.log(
    `MongoDB Connected Successfully: ${mongoose.connection.host}/${mongoose.connection.name}`
  );

  return mongoose.connection;
};

export const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
};

export default connectDB;
