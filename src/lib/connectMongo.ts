import mongoose from "mongoose";

export async function connectMongo() {
  try {
    // to suppress mongoose warning
    mongoose.set("strictQuery", true);
    await mongoose.connect(
      process.env.MONGO_DB_URL! ?? process.env.MONGO_DB_URL!
    );
  } catch (err) {
    console.log("Database connection failed!", err);
    process.exit();
  }
}
