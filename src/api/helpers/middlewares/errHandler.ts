import { ErrorRequestHandler, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { MongoServerError } from "mongodb";
import { MongooseError } from "mongoose";
import { Error as MongooseDocumentError } from "mongoose";

import AppError from "@/utils/appErrors";

const globalErrorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
) => {
  const e = new Error();
  let statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
  let message = e.message;
  let isOperational = false;

  if (err instanceof AppError) {
    statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
    message = err.message;
    isOperational = err.isOperational || false;

    // Mongoose: Document not found (e.g. findOneOrFail / orFail())
  } else if (err instanceof MongooseDocumentError.DocumentNotFoundError) {
    statusCode = StatusCodes.NOT_FOUND;
    message = "Resource not found";
    isOperational = true;

    // Mongoose: Validation error (e.g. required fields, enum mismatches)
  } else if (err instanceof MongooseDocumentError.ValidationError) {
    statusCode = StatusCodes.UNPROCESSABLE_ENTITY;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
    isOperational = true;

    // Mongoose: Cast error (e.g. invalid ObjectId format)
  } else if (err instanceof MongooseDocumentError.CastError) {
    statusCode = StatusCodes.BAD_REQUEST;
    message = `Invalid value for field "${err.path}": ${err.value}`;
    isOperational = true;

    // MongoDB driver: Server-level errors (duplicates, timeouts, etc.)
  } else if (err instanceof MongoServerError) {
    switch (true) {
      case err.code === 11000: // Duplicate key
        statusCode = StatusCodes.CONFLICT;
        message = `Duplicate entry: "${Object.keys(err.keyValue ?? {}).join(", ")}" already exists`;
        isOperational = true;
        break;

      case err.message.includes("timeout"):
        statusCode = StatusCodes.REQUEST_TIMEOUT;
        message = "Database request timed out";
        isOperational = true;
        break;

      case err.message.includes("Authentication failed"):
        statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
        message = "Database authentication failed";
        isOperational = false;
        break;

      default:
        statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
        message = "Database operation failed";
        isOperational = false;
        break;
    }

    // Mongoose: General connection/operational errors
  } else if (err instanceof MongooseError) {
    statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
    message = "Database connection error";
    isOperational = false;
  } else if (err instanceof SyntaxError) {
    statusCode = StatusCodes.BAD_REQUEST;
    message = "Invalid JSON payload";
    isOperational = true;
  }

  // Log errors based on severity
  if (isOperational) {
    log.warn(
      {
        statusCode,
        path: req.path,
        method: req.method,
      },
      `⚠️ Operational Error: ${message}`,
    );
  } else {
    log.error(
      {
        statusCode,
        path: req.path,
        method: req.method,
      },
      `💥 Critical Error: ${err.message}`,
    );
  }

  log.error({ error: err }, `🚨 ERROR: ${message}`);

  const response: Record<string, any> = {
    status: statusCode >= 500 ? "error" : "fail",
    message,
  };

  if (process.env.NODE_ENV === "development") {
    response.stack = err.stack;
    response.error = err.name;
  }

  res.status(statusCode).json(response);
};

export default globalErrorHandler;
