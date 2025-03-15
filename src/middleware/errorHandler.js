/**
 * Error Handler Middleware
 * 
 * Global error handling for the application.
 */

/**
 * Error handling middleware
 * Catches errors from the request handlers and formats them for the response
 */
const errorHandler = (err, req, res, next) => {
  // Log the error for debugging
  console.error(`[ERROR] ${new Date().toISOString()}:`, err);
  
  // Set appropriate status code
  const statusCode = err.statusCode || 500;
  
  // Send error response
  res.status(statusCode).json({
    error: err.message || 'Internal server error'
  });
};

/**
 * Not found middleware
 * Handles requests to endpoints that don't exist
 */
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

module.exports = {
  errorHandler,
  notFound
};