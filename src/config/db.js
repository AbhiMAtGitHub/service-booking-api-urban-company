const mongoose = require('mongoose');
const { MONGO_URI } = require('./constants');

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ DB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = { connectDB };
