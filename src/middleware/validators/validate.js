// generic validator middleware
module.exports = (schema, source = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[source], { abortEarly: false, stripUnknown: true });
  if (error) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      details: error.details.map(d => ({ message: d.message, path: d.path }))
    });
  }
  req[source] = value;
  next();
};
