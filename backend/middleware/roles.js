// Why: protect answers "who are you", this answers "are you allowed".
// Usage: authorize('admin') or authorize('admin', 'instructor').
function authorize(...roles) {
  return function checkRole(req, res, next) {
    if (!req.user || !roles.includes(req.user.role)) {
      const error = new Error('You do not have permission to do this.');
      error.statusCode = 403;
      return next(error);
    }

    next();
  };
}

module.exports = { authorize };
