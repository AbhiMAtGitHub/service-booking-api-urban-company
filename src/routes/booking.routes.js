const express = require('express');
const auth = require('../middleware/auth');
const permit = require('../middleware/roles');
const { ROLES } = require('../config/constants');
const {
  createBooking,
  getMyBookings,
  updateBookingStatus
} = require('../controllers/bookingController');

const router = express.Router();

// customer creates booking
router.post('/', auth(), permit(ROLES.CUSTOMER), createBooking);

// customer fetches own bookings
router.get('/me', auth(), permit(ROLES.CUSTOMER), getMyBookings);

// pro/admin updates booking status
router.patch('/:id/status', auth(), permit(ROLES.PRO, ROLES.ADMIN), updateBookingStatus);

module.exports = router;
