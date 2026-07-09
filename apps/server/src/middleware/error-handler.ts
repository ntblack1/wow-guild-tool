import type { ErrorRequestHandler } from "express";

import { HttpError } from "../lib/http-error.js";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const knownError = error instanceof HttpError;
  const statusCode = knownError ? error.statusCode : 500;
  const code = knownError ? error.code : "INTERNAL_ERROR";
  const message = knownError ? error.message : "Unexpected server error";

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      code
    }
  });
};
