import mongoose from "mongoose";
import { config } from "../config/app.config";

const connectDB = async () => {
  try {
    await mongoose.connect(config.MONGO_URI);
    console.log("Database connected successfully");
  } catch (error) {
    console.error(console.log("error connecting to database", error));
    process.exit(1);
  }
};

export default connectDB;
