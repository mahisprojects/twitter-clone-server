import { Request, Response } from "express";
import { userModel } from "models/user.model";
import { sign } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { BadRequestError } from "../common/errors/bad-request-error";
import { checkIsFollowing } from "./connection.controller";
import {
  notificationModel,
  notificationType,
} from "../models/notification.model";
import { sortByKey } from "utils/array";
import { UnauthorizedError } from "../common/errors/unauthorized-error";
import { postTweetFromTwitterVerified } from "./tweet.controller";

const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Invalid input!" });
    }

    const existUser = await userModel.findOne({ email });

    if (!existUser || !existUser?.comparePassword(password)) {
      return res.status(401).send({ message: "Invalid credentials!" });
    }

    const userJwt = sign(
      { id: existUser.id, email: existUser.email },
      process.env.JWT_ENCRYPTION_KEY!,
      {
        expiresIn: "7days",
      }
    );

    return res.json({ _token: userJwt });
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: error.message || "INTERNAL_SERVER_ERROR" });
  }
};

const registerUser = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (process.env.JOIN_NEW_USER === "false") {
      return res
        .status(500)
        .json({ message: "Registration is disabled for public users!" });
    }

    if (!email || !password) {
      return res.status(400).json({ message: "Invalid input!" });
    }

    await userModel.create({
      name,
      email,
      password: bcrypt.hashSync(password, 8),
      role: "user",
    });

    res.json({ message: "Thank you for joining Twitter Clone." });
  } catch (error: any) {
    if (error?.keyPattern?.email == 1)
      return res
        .status(500)
        .json({ message: "Account already exits with provided email!" });
    res.status(500).json({ message: "Account creation failed!" });
  }
};
// verify password endpoint function, only for logged user
const confirmPassword = async (req: Request, res: Response, next) => {
  try {
    const { password } = req.body;

    if (!password) next(new BadRequestError("Invalid input!"));

    const existUser = await userModel.findById(req["_user"]?.id);

    if (!existUser || !existUser?.comparePassword(password)) {
      next(new UnauthorizedError("Invalid password!"));
    }

    res.json({ confirmed: true });
  } catch (error: any) {
    next(new BadRequestError("Verification Failed!"));
  }
};

const currentUserHandler = async (req: Request, res: Response) => {
  const userId = req["currentUser"]!.id;
  const user = await userModel.findById(userId);

  res.json({ currentUser: user?.toObject() });
};

const updateUser = async (req: Request, res: Response) => {
  try {
    const userId = req["currentUser"]!.id;
    var update = req.body;
    if (update.email) delete update.email;

    await userModel.findByIdAndUpdate(userId, { $set: update });
    const updatedUser = await userModel.findById(userId);
    res.send(updatedUser);
  } catch (error) {
    res
      .status(403)
      .json({ message: "Something went wrong while updating user!" });
  }
};

const getUsers = async (req: Request, res: Response) => {
  try {
    const query: Record<string, any> = {};
    if (req.query?.["pro"]) {
      query["pro"] = true;
    }
    const users = await userModel.find(query);
    res.send(users);
  } catch (error) {
    res.status(403).json({ message: "Something went wrong!" });
  }
};

const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // delete user related //media

    await userModel.findByIdAndDelete(id);
    res.end();
  } catch (error) {
    res.status(403).json({ message: "Something went wrong while deleting!" });
  }
};

export async function getUserById(req: Request, res: Response, next) {
  try {
    const { id } = req.params;
    const user = await userModel.findById(id);
    res.send(user?.toObject());
  } catch (error) {
    next(new BadRequestError("User doesn't exists!"));
  }
}
async function getUserByUsername(req: Request, res: Response, next) {
  const sessionUser = req["_user"]?.id;
  try {
    const { username } = req.params;
    const user = await userModel.findOne(
      { username },
      "name username subscription profile profileCover count bio location url createdAt"
    );
    if (!user) return next(new BadRequestError("User doesn't exists!"));
    if (sessionUser) {
      // get following data
      const following = await checkIsFollowing(sessionUser, user?.id);
      const follows = await checkIsFollowing(user?.id, sessionUser);
      return res.send({ ...user?.toJSON(), following, follows });
    }
    res.send({ ...user?.toJSON(), following: false, follows: false });
  } catch (error) {
    next(new BadRequestError("User doesn't exists!"));
  }
}

// search for user by name or username
async function searchUserByQuery(req: Request, res: Response, next) {
  //
  const { query } = req.params;
  const userID = req["_user"].id;
  try {
    const usersList = await userModel.find(
      {
        $or: [
          { name: { $regex: new RegExp(query?.toString(), "i") } },
          { username: { $regex: new RegExp(query?.toString(), "i") } },
        ],
      },
      "id name username bio count membership profile"
    );
    let users: any[] = [];
    for await (const user of usersList) {
      const following = await checkIsFollowing(userID, user.id);
      users.push({ ...user.toJSON(), following });
    }

    res.send(users);
  } catch (error) {
    next(new BadRequestError(`Something went wrong while searching ${query}!`));
  }
}

// Notification
export async function createNotification(
  from,
  to,
  type: notificationType,
  tweet?: string // to save tweet/like/reply notification
) {
  await notificationModel.create({ from, to, type, tweet });
}

export async function deleteNotification(req: Request, res: Response, next) {
  const { id } = req.params;
  try {
    await notificationModel.findByIdAndDelete(id);
  } catch (error) {}
  res.end();
}

export async function deleteNotificationForUser(
  from,
  to,
  type: notificationType,
  tweet?: string
) {
  try {
    await notificationModel.deleteOne({ from, to, type, tweet });
  } catch (error) {}
}

// fetch user notifications
export async function getNoficationsForUser(req: Request, res: Response, next) {
  try {
    const userID = req["_user"]?.id;
    const notificationsRes = await notificationModel
      .find({ to: userID })
      .populate("from", "name username profile bio count");

    const notifications = sortByKey(notificationsRes, "createdAt", {
      reverse: true,
    });
    res.send(notifications);
  } catch (error) {
    res.status(400).send({ message: "Error while fetching notifications" });
  }
}

export async function getBlueVerified(req: Request, res: Response, next) {
  try {
    const { accountType } = req.body;
    const user = req["_user"];

    await userModel.findByIdAndUpdate(user.id, {
      $set: {
        subscription: {
          type: accountType,
          legacy: true,
          verified: true,
        },
      },
    });

    await postTweetFromTwitterVerified(
      `Congrats @${user?.username}, You're verified.`
    );
    res.send({ verified: true });
  } catch (error) {
    next(new BadRequestError("Verification failed!"));
  }
}

export default {
  loginUser,
  registerUser,
  confirmPassword,
  // resetPassword,
  currentUserHandler,
  getUserByUsername,
  searchUserByQuery,
  // admin route
  getUsers,
  updateUser,
  deleteUser,
};
