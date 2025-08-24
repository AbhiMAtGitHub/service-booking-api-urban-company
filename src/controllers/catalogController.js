const Category = require('../models/Category');
const Service = require('../models/Service');
const AddOn = require('../models/AddOn');

// Category CRUD
exports.createCategory = async (req, res) => {
  const category = await Category.create(req.body);
  res.status(201).json(category);
};
exports.getCategories = async (req, res) => {
  const categories = await Category.find();
  res.json(categories);
};

// Service CRUD
exports.createService = async (req, res) => {
  const service = await Service.create(req.body);
  res.status(201).json(service);
};
exports.getServices = async (req, res) => {
  const services = await Service.find().populate('category');
  res.json(services);
};

// AddOn CRUD
exports.createAddOn = async (req, res) => {
  const addOn = await AddOn.create(req.body);
  res.status(201).json(addOn);
};
exports.getAddOns = async (req, res) => {
  const addOns = await AddOn.find().populate('service');
  res.json(addOns);
};
