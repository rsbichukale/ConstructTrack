function requestLogger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[API ${req.method}] ${req.originalUrl} -> Status ${res.statusCode} (${duration}ms)`);
  });
  next();
}

module.exports = requestLogger;
