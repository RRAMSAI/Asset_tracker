const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) return; // already connected (serverless warm reuse)
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // Don't process.exit(1) in serverless — it kills the function before sending a response
    throw error;
  }
};

module.exports = connectDB;
