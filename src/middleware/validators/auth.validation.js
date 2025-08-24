const Joi = require('joi');
const { ROLES } = require('../../config/constants');

const signupSchema = Joi.object({
  name: Joi.string().min(2).max(80).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(128).required(),
  role: Joi.string().valid(ROLES.CUSTOMER, ROLES.PRO, ROLES.ADMIN).default(ROLES.CUSTOMER)
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(128).required()
});

module.exports = { signupSchema, loginSchema };
