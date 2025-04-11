import { ErrorRequestHandler, Response } from "express";
import { z } from "zod";

import { HTTPSTATUS } from "../config/http.config";
import { AppError } from "../common/utils/AppError";
import {
  clearAuthenticationCookies,
  REFRESH_PATH,
} from "../common/utils/cookie";

const formatZodError = (res: Response, error: z.ZodError) => {
  const errors = error?.issues?.map((err) => ({
    field: err.path.join("."),
    message: err.message,
  }));

  return res.status(HTTPSTATUS.BAD_REQUEST).json({
    message: "Validation failed",
    errors: errors,
  });
};

export const errorHandler: ErrorRequestHandler = (
  error,
  req,
  res,
  next
): any => {
  console.log(`Error occurred on Path: ${req.path} with error: ${error}`);

  if (req.path === REFRESH_PATH) {
    clearAuthenticationCookies(res);
  }

  if (error instanceof SyntaxError) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      message: "Invalid json format, please check your request body",
    });
  }

  if (error instanceof z.ZodError) {
    return formatZodError(res, error);
  }

  if (error instanceof AppError) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      message: error.message,
      errorCode: error.errorCode,
    });
  }

  res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
    message: "Internal Server Error",
    error: error.message || "Something went wrong",
  });
};
