const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { RATE_LIMITS } = require('./config/constants');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use(rateLimit({
  windowMs: RATE_LIMITS.GLOBAL.windowMs,
  max: RATE_LIMITS.GLOBAL.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'RATE_LIMIT', message: 'Too many requests. Try again later.' }
}));

app.get('/', (req, res) => res.json({ message: 'Service Booking API is running 🚀' }));

app.use('/api/v1/auth', require('./routes/auth.routes'));
app.use('/api/v1/catalog', require('./routes/catalog.routes'));
app.use('/api/v1/bookings', require('./routes/booking.routes'));
app.use('/api/v1/pros', require('./routes/pro.routes'));


app.use((req, res) => res.status(404).json({ error: 'NOT_FOUND' }));

// central error handler (expand later for Zod/Joi/Winston, etc.)
app.use((err, req, res, next) => {
  console.error(err);
  return res.status(500).json({ error: 'INTERNAL_ERROR' });
});

module.exports = app;
