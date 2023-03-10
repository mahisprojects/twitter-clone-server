import express from "express";
import { verifyToken } from "../common/middleware/verifyToken";
import { requireAuthentication } from "../common/middleware/require-auth";
import { authenticateIfUser } from "../common/middleware/authenticate-if-user";

import { mediaUploadHandler } from "../controllers/media.controller";
import MediaStorage from "../common/middleware/storage";
import {
  createTweetHandler,
  createTweetReplyHandler,
  deleteTweetHandler,
  getForYouTweets,
  getLikedTweetsByUser,
  getMyTweets,
  getTweetById,
  getTweetReplies,
  getUserTweetsByUsername,
  toggleTweetLike,
  tweetReTweetHandler,
  updateTweetHandler,
} from "controllers/tweet.controller";
const router = express.Router();

const userAreaHandler = [verifyToken, requireAuthentication];

// get for you tweets
router.get("/tweets", authenticateIfUser, getForYouTweets);

// get current user tweets
router.get("/my-tweets", userAreaHandler, getMyTweets);

// get tweet by tweetID
router.get("/tweet/:id", authenticateIfUser, getTweetById);

router.patch("/tweet/:id/like", userAreaHandler, toggleTweetLike);

// create/post new tweet
router.post("/tweet/new", userAreaHandler, createTweetHandler);

// tweet reply
router.get("/tweet/:id/replies", authenticateIfUser, getTweetReplies);
router.post("/tweet/:id/reply", userAreaHandler, createTweetReplyHandler);

// retweet
router.post("/tweet/:id/retweet", userAreaHandler, tweetReTweetHandler);

// get requested user tweets
router.get("/tweets/u/:username", authenticateIfUser, getUserTweetsByUsername);
router.get("/tweets/u/:username/liked", userAreaHandler, getLikedTweetsByUser);

const storage = new MediaStorage({ uploadDir: "user_tweet_media/" });

// upload tweet media
router.put(
  "/tweet/media",
  [...userAreaHandler, storage.store.single("file")],
  mediaUploadHandler
);

router.patch("/tweet/:id", userAreaHandler, updateTweetHandler);
router.delete("/tweet/:id", userAreaHandler, deleteTweetHandler);

export default router;
