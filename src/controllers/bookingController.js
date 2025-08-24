const Booking = require("../models/Booking");
const Service = require("../models/Service");
const AddOn = require("../models/AddOn");
const ProProfile = require("../models/ProProfile");
const mongoose = require("mongoose");

// helper to compute haversine distance (km)
const haversineKm = (lat1, lon1, lat2, lon2) => {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

// reuse calculatePrice from previous implementation (or import if you moved it)
const calculatePrice = async (serviceId, addOnIds, slot) => {
  const service = await Service.findById(serviceId);
  if (!service) throw new Error("Service not found");

  let price = service.basePrice;
  if (addOnIds && addOnIds.length) {
    const addOns = await AddOn.find({ _id: { $in: addOnIds } });
    price += addOns.reduce((sum, a) => sum + a.extraPrice, 0);
  }

  const day = new Date(slot).getDay();
  if (day === 0 || day === 6) {
    price = price * 1.1;
  }

  return Math.round(price);
};

const createBooking = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      service,
      addOns = [],
      slot,
      pro,
      pincode,
      customerLocation,
    } = req.body;
    // customerLocation optional: { lat, lng }
    const idempotencyKey =
      req.headers["idempotency-key"] || req.headers["Idempotency-Key"];

    if (!idempotencyKey) {
      await session.abortTransaction();
      return res.status(400).json({ error: "MISSING_IDEMPOTENCY_KEY" });
    }

    // idempotency check
    const existing = await Booking.findOne({ idempotencyKey });
    if (existing) {
      await session.abortTransaction();
      return res.status(200).json(existing);
    }

    // verify pro profile & coverage
    const proProfile = await ProProfile.findOne({ user: pro });
    if (!proProfile) {
      await session.abortTransaction();
      return res.status(400).json({ error: "PRO_PROFILE_NOT_FOUND" });
    }

    // check pincode coverage if provided
    if (pincode) {
      if (!(proProfile.pincodes || []).includes(pincode)) {
        // fallback to geo-check (if customer location provided)
        if (
          !customerLocation ||
          !customerLocation.lat ||
          !customerLocation.lng
        ) {
          await session.abortTransaction();
          return res.status(400).json({ error: "PRO_DOES_NOT_SERVE_PINCODE" });
        }
      }
    }

    // If customerLocation provided and pro has location, check distance
    if (
      customerLocation &&
      proProfile.location &&
      proProfile.location.coordinates
    ) {
      const [proLng, proLat] = proProfile.location.coordinates;
      const distKm = haversineKm(
        customerLocation.lat,
        customerLocation.lng,
        proLat,
        proLng
      );
      if (distKm > (proProfile.coverageRadiusKm || 20)) {
        await session.abortTransaction();
        return res
          .status(400)
          .json({ error: "PRO_OUT_OF_COVERAGE_RADIUS", details: { distKm } });
      }
    } else if (
      pincode &&
      proProfile.pincodes &&
      !proProfile.pincodes.includes(pincode)
    ) {
      // if no location given and pincode not matched
      await session.abortTransaction();
      return res.status(400).json({ error: "PRO_DOES_NOT_SERVE_PINCODE" });
    }

    // check service provided by pro
    if (service) {
      const services = proProfile.servicesProvided.map((s) => s.toString());
      if (services.length && !services.includes(service.toString())) {
        await session.abortTransaction();
        return res.status(400).json({ error: "PRO_DOES_NOT_OFFER_SERVICE" });
      }
    }

    // check that requested slot is within one of the availabilitySlots
    const reqSlotStart = new Date(slot);
    const slotOk = (proProfile.availabilitySlots || []).some((av) => {
      const avStart = new Date(av.start);
      const avEnd = new Date(
        avStart.getTime() + (av.duration || 60) * 60 * 1000
      );
      // require exact start alignment or that requested start is inside block
      return reqSlotStart >= avStart && reqSlotStart < avEnd;
    });

    if (!slotOk) {
      await session.abortTransaction();
      return res
        .status(400)
        .json({
          error: "SLOT_NOT_AVAILABLE",
          message: "Requested slot not within pro availability",
        });
    }

    // calculate price
    const price = await calculatePrice(service, addOns, slot);

    // create booking (this uses unique index on pro+slot to avoid double-booking)
    const booking = await Booking.create(
      [
        {
          customer: req.user.id,
          pro,
          service,
          addOns,
          slot,
          price,
          idempotencyKey,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    res.status(201).json(booking[0]);
  } catch (err) {
    await session.abortTransaction();
    if (err.code === 11000) {
      return res.status(409).json({ error: "SLOT_ALREADY_BOOKED" });
    }
    console.error(err);
    res.status(500).json({ error: "BOOKING_FAILED", message: err.message });
  } finally {
    session.endSession();
  }
};

const getMyBookings = async (req, res) => {
  const bookings = await Booking.find({ customer: req.user.id })
    .populate('service')
    .populate('addOns')
    .populate('pro', 'name email');
  res.json(bookings);
};

const updateBookingStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const allowed = ['CONFIRMED', 'CANCELLED', 'COMPLETED'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: 'INVALID_STATUS' });
  }

  const booking = await Booking.findByIdAndUpdate(id, { status }, { new: true });
  if (!booking) return res.status(404).json({ error: 'BOOKING_NOT_FOUND' });

  res.json(booking);
};

module.exports = { createBooking, calculatePrice, haversineKm, getMyBookings, updateBookingStatus };
