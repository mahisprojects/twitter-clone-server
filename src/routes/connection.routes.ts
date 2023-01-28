import express from "express";
import { verifyToken } from "../common/middleware/verifyToken";
import { requireAuthentication } from "../common/middleware/require-auth";
import { authenticateIfUser } from "../common/middleware/authenticate-if-user";

import {
  followConnection,
  getFollowers,
  getFollowing,
  unfollowConnection,
  removeFollower,
} from "../controllers/connection.controller";

const router = express.Router();

const userAreaHandler = [verifyToken, requireAuthentication];

// get current user followers/fowllowings
router.get("/me/followings", userAreaHandler, getFollowing);
router.get("/me/followers", userAreaHandler, getFollowers);

// get user follower/followings
router.get("/:userId/followings", userAreaHandler, getFollowing);
router.get("/:userId/followers", userAreaHandler, getFollowers);

// follow user
router.post("/follow/:to", userAreaHandler, followConnection);

// delete follower
router.delete("/follower/:id", userAreaHandler, removeFollower);
// unfollow
router.delete("/follow/:id", userAreaHandler, unfollowConnection);

// // block follower
// router.patch("/follow/:id", userAreaHandler, follo);

export default router;
