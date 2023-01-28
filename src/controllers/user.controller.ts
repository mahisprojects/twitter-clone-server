import { Request, Response } from "express";
import { userModel } from "models/user.model";
import { sign } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { BadRequestError } from "../common/errors/bad-request-error";
import { checkIsFollowing } from "./connection.controller";

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

const currentUserHandler = async (req: Request, res: Response) => {
  const userId = req["currentUser"]!.id;
  const user = await userModel.findById(userId);

  // check if user is pro to determine whether subs is expired or not
  if (user?.pro && !user?.forever) {
    if (
      !user?.membership?.validTill ||
      user?.membership?.validTill < Date.now()
    ) {
      // update pro to non pro
      await userModel.findByIdAndUpdate(userId, { $set: { pro: false } });
    }
  }

  res.json({ currentUser: user });
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
    const user = await userModel.findById(id, {
      email: 1,
      name: 1,
      username: 1,
      profile: 1,
      status: 1,
      role: 1,
      lastActivity: 1,
    });
    res.send(user);
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
      {
        name: 1,
        username: 1,
        membership: 1,
        profile: 1,
        count: 1,
        bio: 1,
        location: 1,
        url: 1,
        createdAt: 1,
      }
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

export default {
  loginUser,
  registerUser,
  // resetPassword,
  currentUserHandler,
  getUserByUsername,
  searchUserByQuery,
  // admin route
  getUsers,
  updateUser,
  deleteUser,
};
