import mongoose from "mongoose";

const testDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected Successfully");
    mongoose.connection.close();
  } catch (error) {
    console.log("Database Connection Failed");
    console.log(error);
  }
};

testDB();