import { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "../errors/unauthorized-error";
export const authorization =
  (roles: any[]) => (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req!["_user"]!.role!)) {
      // return res.status(403).json({ error: "Access Denied." });
      next(new UnauthorizedError());
    }
    next();
  };
