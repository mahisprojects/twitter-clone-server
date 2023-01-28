import { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "../errors/unauthorized-error";
export const authorization =
  (roles: any[]) => (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req!["_user"]!.role!)) {
      next(new UnauthorizedError());
    }
    next();
  };
