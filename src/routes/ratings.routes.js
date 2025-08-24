const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const permit = require("../middleware/roles");
const validate = require("../middleware/validators/validate");

const {
  createRatingRules,
  updateRatingRules,
  listForProRules,
} = require("../middleware/validators/ratings.validation");

const {
  createRating,
  updateRating,
  deleteRating,
  listForPro,
  myRatings,
} = require("../controllers/ratingsController");

// Public: list ratings for a pro
router.get("/ratings/pro/:proId", validate(listForProRules), listForPro);

// Auth: my ratings (customer only)
router.get("/ratings/me", auth(), permit("customer"), myRatings);

// Auth: create rating -> only customer, after COMPLETED booking
router.post(
  "/ratings",
  auth(),
  permit("customer"),
  validate(createRatingRules),
  createRating
);

// Auth: update own rating
router.patch(
  "/ratings/:id",
  auth(),
  permit("customer"),
  validate(updateRatingRules),
  updateRating
);

// Auth: delete own rating
router.delete(
  "/ratings/:id",
  auth(),
  permit("customer"),
  updateRatingRules[0], // param("id").isMongoId()
  deleteRating
);

module.exports = router;
