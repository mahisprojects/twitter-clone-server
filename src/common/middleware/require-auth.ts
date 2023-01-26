import { Request, Response, NextFunction } from "express";
import { userModel } from "models/user.model";
import { UnauthorizedError } from "../errors/unauthorized-error";
export const requireAuthentication = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req["currentUser"]) {
    next(new UnauthorizedError("Not authorized!"));
    return;
    // return res.status(401).json({ error: "Not authorized!" });
  }
  const user = await userModel.findById(req["currentUser"].id);
  // .projection({ email: 1, role: 1, uid: 1 });

  if (!user) {
    next(new UnauthorizedError("Invalid User!"));
  }
  req["_user"] = user;
  next();
};
