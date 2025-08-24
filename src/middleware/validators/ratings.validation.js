const { body, param, query } = require("express-validator");

exports.createRatingRules = [
  body("bookingId").isMongoId().withMessage("bookingId required"),
  body("rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("rating must be an integer between 1 and 5"),
  body("review").optional().isString().isLength({ max: 1000 }),
];

exports.updateRatingRules = [
  param("id").isMongoId(),
  body("rating").optional().isInt({ min: 1, max: 5 }),
  body("review").optional().isString().isLength({ max: 1000 }),
];

exports.listForProRules = [
  param("proId").isMongoId(),
  query("skip").optional().isInt({ min: 0 }),
  query("limit").optional().isInt({ min: 1, max: 50 }),
];
