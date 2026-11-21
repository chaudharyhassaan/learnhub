// Why: controllers can throw and let this wrapper pass the error to errorHandler
// instead of repeating try/catch in every function.
function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
