const ProProfile = require('../models/ProProfile');
const Service = require('../models/Service');
const User = require('../models/User');

/**
 * Create or update Pro profile (upsert)
 * Body: { pincodes: [], location: { coordinates: [lng,lat] }, coverageRadiusKm, servicesProvided: [], availabilitySlots: [] }
 */
exports.upsertProfile = async (req, res) => {
  const userId = req.user.id;
  const payload = req.body;

  const data = {
    ...payload,
    user: userId
  };

  const profile = await ProProfile.findOneAndUpdate(
    { user: userId },
    data,
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).populate('servicesProvided');

  res.json(profile);
};

exports.getMyProfile = async (req, res) => {
  const profile = await ProProfile.findOne({ user: req.user.id }).populate('servicesProvided');
  if (!profile) return res.status(404).json({ error: 'PROFILE_NOT_FOUND' });
  res.json(profile);
};

/**
 * Search pros by:
 * - pincode (exact match), OR
 * - lat,lng + radiusKm (geo query)
 * Optional filter: serviceId
 *
 * Query params:
 * ?pincode=560001
 * OR ?lat=12.9716&lng=77.5946&radiusKm=10
 * Optional: ?serviceId=<id>
 */
exports.searchPros = async (req, res) => {
  const { pincode, lat, lng, radiusKm = 20, serviceId } = req.query;

  let filter = {};

  if (pincode) {
    filter.pincodes = pincode;
  } else if (lat && lng) {
    filter.location = {
      $geoWithin: {
        $centerSphere: [
          [parseFloat(lng), parseFloat(lat)],
          (parseFloat(radiusKm) || 20) / 6378.1 // radius in radians; earth radius ~6378.1 km
        ]
      }
    };
  } else {
    return res.status(400).json({ error: 'MISSING_LOCATION_FILTER', message: 'Provide pincode or lat/lng' });
  }

  if (serviceId) {
    filter.servicesProvided = serviceId;
  }

  const pros = await ProProfile.find(filter).populate('user', 'name email').populate('servicesProvided');
  res.json(pros);
};
