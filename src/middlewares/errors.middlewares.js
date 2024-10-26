// import { logger } from "../app.js";
import { ApiError } from "../utils/ApiError.js";

const notFound = (req, res, next) => {
  throw new ApiError(404, "404 not found " + req.originalUrl);
};

const errorMiddleware = (err, req, res, next) => {
  const statusCode = err.statusCode >= 400 ? err.statusCode : 500;
  // logger.error(`${err.statusCode} ${err.message} ${req.originalUrl}`)
  res.status(Number(statusCode));
  res.json({
    statusCode: statusCode,
    message: err.message,
    success: false,
    stack: process.env.NODE_ENV == "prod" ? null : err.stack,
  });
};

export { notFound, errorMiddleware };
