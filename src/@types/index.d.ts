import { Request } from "express";

import { UserDocument } from "../database/models/user.model";

// This will add the User type to the Express Request object
declare global {
  namespace Express {
    interface User extends UserDocument {}
    interface Request {
      sessionId?: string;
    }
  }
}
