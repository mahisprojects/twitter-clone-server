import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { userModel } from "models/user.model";
import { UserPayload } from "./verifyToken";
export const authenticateIfUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.headers && req.headers.authorization) {
    const jwtToken = req.headers.authorization.split(" ")[1];

    try {
      const payload = jwt.verify(
        jwtToken,
        process.env.JWT_ENCRYPTION_KEY!
      ) as unknown as UserPayload;

      if (payload) {
        req["currentUser"] = payload;
        const user = await userModel.findById(payload.id);
        // .projection({ email: 1, role: 1, uid: 1 });
        if (user) {
          req["_user"] = user;
        }
      }
    } catch (error) {
      // stop throw error
    }
  }
  next();
};
