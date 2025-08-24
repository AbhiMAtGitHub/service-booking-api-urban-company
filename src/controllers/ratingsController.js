const Rating = require("../models/Rating");
const Booking = require("../models/Booking");
const ProProfile = require("../models/ProProfile");
const mongoose = require("mongoose");

// helper: recompute and persist avg + count for a pro
async function recomputeProAggregates(proId) {
  const agg = await Rating.aggregate([
    { $match: { pro: new mongoose.Types.ObjectId(proId) } },
    { $group: { _id: "$pro", avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);

  const avg = agg.length ? Number(agg[0].avg.toFixed(2)) : 0;
  const count = agg.length ? agg[0].count : 0;

  await ProProfile.findOneAndUpdate(
    { user: proId },
    { avgRating: avg, ratingsCount: count },
    { new: true }
  );
}

/**
 * POST /api/v1/ratings
 * body: { bookingId, rating (1-5), review? }
 * only customer who owns a COMPLETED booking can rate.
 */
exports.createRating = async (req, res) => {
  const { bookingId, rating, review = "" } = req.body;
  const customerId = req.user.id;

  // verify booking
  const booking = await Booking.findById(bookingId);
  if (!booking) return res.status(404).json({ error: "BOOKING_NOT_FOUND" });

  if (booking.customer.toString() !== customerId) {
    return res.status(403).json({ error: "FORBIDDEN_NOT_BOOK_OWNER" });
  }

  if (booking.status !== "COMPLETED") {
    return res
      .status(400)
      .json({ error: "BOOKING_NOT_COMPLETED", message: "Rate only after completion." });
  }

  // upsert protection: unique index (booking, customer)
  const exists = await Rating.findOne({
    booking: bookingId,
    customer: customerId,
  });
  if (exists) {
    return res.status(409).json({ error: "RATING_ALREADY_EXISTS" });
  }

  const doc = await Rating.create({
    booking: bookingId,
    customer: customerId,
    pro: booking.pro,
    rating,
    review,
  });

  await recomputeProAggregates(booking.pro);

  res.status(201).json(doc);
};

/**
 * PATCH /api/v1/ratings/:id
 * body: { rating?, review? }
 * only rating owner can edit.
 */
exports.updateRating = async (req, res) => {
  const { id } = req.params;
  const { rating, review } = req.body;

  const doc = await Rating.findById(id);
  if (!doc) return res.status(404).json({ error: "RATING_NOT_FOUND" });

  if (doc.customer.toString() !== req.user.id) {
    return res.status(403).json({ error: "FORBIDDEN_NOT_OWNER" });
  }

  if (typeof rating === "number") doc.rating = rating;
  if (typeof review === "string") doc.review = review;

  await doc.save();
  await recomputeProAggregates(doc.pro);

  res.json(doc);
};

/**
 * DELETE /api/v1/ratings/:id
 * only rating owner (or admin if you add role check) can delete.
 */
exports.deleteRating = async (req, res) => {
  const { id } = req.params;
  const doc = await Rating.findById(id);
  if (!doc) return res.status(404).json({ error: "RATING_NOT_FOUND" });

  if (doc.customer.toString() !== req.user.id) {
    return res.status(403).json({ error: "FORBIDDEN_NOT_OWNER" });
  }

  await Rating.findByIdAndDelete(id);
  await recomputeProAggregates(doc.pro);

  res.json({ success: true });
};

/**
 * GET /api/v1/ratings/pro/:proId?skip=0&limit=20
 * public listing of ratings for a pro
 */
exports.listForPro = async (req, res) => {
  const { proId } = req.params;
  const skip = Math.max(0, parseInt(req.query.skip, 10) || 0);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));

  const [items, totals] = await Promise.all([
    Rating.find({ pro: proId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("customer", "name")
      .lean(),
    ProProfile.findOne({ user: proId }).select("avgRating ratingsCount").lean(),
  ]);

  res.json({
    meta: {
      skip,
      limit,
      total: totals?.ratingsCount ?? items.length,
      avgRating: totals?.avgRating ?? 0,
      ratingsCount: totals?.ratingsCount ?? items.length,
    },
    items,
  });
};

/**
 * GET /api/v1/ratings/me
 * customer’s own ratings
 */
exports.myRatings = async (req, res) => {
  const items = await Rating.find({ customer: req.user.id })
    .sort({ createdAt: -1 })
    .populate("pro", "name email")
    .populate({
      path: "booking",
      select: "service slot status",
      populate: { path: "service", select: "name" },
    })
    .lean();

  res.json(items);
};
