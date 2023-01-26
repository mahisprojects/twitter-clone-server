import { Request, Response, NextFunction } from "express";
import jwt, { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { UnauthorizedError } from "../errors/unauthorized-error";

export interface UserPayload {
  id: string;
  email: string;
  iat: string;
  exp: string;
}

declare global {
  namespace Express {
    interface Request {
      currentUser?: UserPayload;
      // _user?: UserDoc;
      _user?: any;
    }
  }
}

export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!(req.headers && req.headers.authorization)) {
    next(new UnauthorizedError("Missing Authorization Token"));
    return;
  }
  const jwtToken = req.headers.authorization.split(" ")[1];

  try {
    const payload = jwt.verify(
      jwtToken,
      process.env.JWT_ENCRYPTION_KEY!
    ) as unknown as UserPayload;

    req!["currentUser"] = payload;
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      next(new UnauthorizedError("Session Expired!"));
    } else next(new UnauthorizedError("Invalid Authorization Token!"));
  } finally {
    next();
  }
};

class yeahH {
  inner: Error;

  constructor(yeah) {}
}
