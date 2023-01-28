import { Request, Response, NextFunction } from "express";
import { connectionModel } from "../models/connection.model";
import { BadRequestError } from "../common/errors/bad-request-error";
import { Mongoose, MongooseError } from "mongoose";
import { userModel } from "../models/user.model";

export const checkIsFollowing = async (a, b) => {
  const existConnection = await connectionModel.findOne({
    from: a,
    to: b,
  });
  if (existConnection) return true;
  return false;
};

export const fetchFollowConnectionBetweenAB = async (a, b) => {
  const existConnection = await connectionModel.findOne({
    ...(a !== b && {
      $or: [
        { from: a, to: b },
        { from: b, to: a },
      ],
    }),
    // ...(a == b && { participants: { $eq: [a] } }),
  });
  if (existConnection) return existConnection;
  return false;
};

export const followConnection = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { to: toFollowUser } = req.params;
  const userID = req["_user"].id;
  try {
    if (!toFollowUser || toFollowUser === userID)
      throw new Error("Invalid input!");
    // check for whether requesting user is already following to follow user or not
    const alreadyFollowing = await checkIsFollowing(userID, toFollowUser);
    if (alreadyFollowing) throw new Error("Already following!");

    const newConnection = await connectionModel.create({
      from: userID,
      to: toFollowUser,
    });

    // update user follwer data
    const followers = await connectionModel.count({ to: toFollowUser });
    const _user = await userModel.findById(toFollowUser);
    _user!.count = { ..._user?.count, followers };
    _user?.save();

    const sessionUser = await userModel.findById(userID);
    const following = await connectionModel.count({ from: userID });
    sessionUser!.count = { ...sessionUser?.count, following };
    sessionUser?.save();

    // TODO: create follow notification

    res.send(newConnection.toJSON());
  } catch (error) {
    next(new BadRequestError("Error whilte establishing Connection!"));
  }
};

export async function getFollowers(req: Request, res: Response, next) {
  try {
    const { userId } = req.params;
    const user = userId ?? req["_user"].id;
    const connections = await connectionModel
      .find({ to: user, blocked: false })
      .populate("from", "username name profile membership");
    res.send(connections);
  } catch (error: any) {
    if (error instanceof BadRequestError) next(error);
    else next(new BadRequestError("Invalid connection!"));
  }
}

export const getFollowing = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { userId } = req.params;
  const user = userId ?? req["_user"].id;
  try {
    const connections = await connectionModel
      .find({ from: user, blocked: false })
      .populate("to", "username name profile membership");
    res.send(connections);
  } catch (error) {
    next(new BadRequestError("Error whilte fetching followings!"));
  }
};

export const removeFollower = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  try {
    const connection = await connectionModel.findOne({
      from: id,
      to: req["_user"].id,
    });
    if (connection) connection.delete();

    res.end();
  } catch (error) {
    next(new BadRequestError("Error while removing follower!"));
  }
};

export async function unfollowConnection(req: Request, res: Response, next) {
  const { id: toUnFollowUser } = req.params;
  try {
    const userID = req["_user"].id;
    const connection = await connectionModel.findOne({
      from: userID,
      to: toUnFollowUser,
    });
    if (connection) connection.delete();

    // update user follwer data
    const followers = await connectionModel.count({ to: toUnFollowUser });
    const _user = await userModel.findById(toUnFollowUser);
    _user!.count = { ..._user?.count, followers };
    _user?.save();

    const sessionUser = await userModel.findById(userID);
    const following = await connectionModel.count({ from: userID });
    sessionUser!.count = { ...sessionUser?.count, following };
    sessionUser?.save();

    res.end();
  } catch (error) {
    next(new BadRequestError("Connection couldn't delete!"));
  }
}
