import mongoose from "mongoose";

const connectDB = async (retries = 3, delay = 5000) => {
  for (let i = 1; i <= retries; i++) {
    try {
      await mongoose.connect(process.env.MONGO_URI);
      console.log(`MongoDB Connected: ${mongoose.connection.host}`);
      return;
    } catch (error) {
      console.error(`MongoDB Connection Attempt ${i}/${retries} Failed: ${error.message}`);
      if (i < retries) {
        console.log(`Retrying in ${delay / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  console.error("MongoDB: All connection attempts failed. Server will keep running but database operations will fail.");
};

export default connectDB;