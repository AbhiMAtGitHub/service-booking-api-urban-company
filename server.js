const dotenv = require('dotenv');
dotenv.config();
const app = require('./src/app');
const { connectDB } = require('./src/config/db');
const { PORT } = require('./src/config/constants');

// DB Connection
connectDB();

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
