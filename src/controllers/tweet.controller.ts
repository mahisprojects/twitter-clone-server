import { Request, Response } from "express";
import { mediaModel } from "models/media.model";
import { BadRequestError } from "../common/errors/bad-request-error";
import { tweetModel } from "../models/tweet.model";
import { userModel } from "../models/user.model";
import { sortByKey } from "../utils/array";
import { likeModel } from "../models/like.model";
import {
  createNotification,
  deleteNotificationForUser,
} from "./user.controller";

// user new tweeet
export async function createTweetHandler(req: Request, res: Response) {
  const body = req.body;

  try {
    let newTweet = await tweetModel.create({
      ...body,
      owner: req["_user"].id,
    });

    newTweet = await newTweet.populate("attachments");
    await newTweet.populate("owner");
    await newTweet.populate({
      path: "parentTweet",
      populate: [{ path: "owner" }, { path: "attachments" }],
    });

    res.status(201).send(newTweet.toJSON());
  } catch (e: any) {
    res.status(500).send({ status: "ERROR", message: e });
  }
}
// retweet/quote tweet/undo tweet
export async function tweetReTweetHandler(req: Request, res: Response) {
  const body = req.body;
  const { id: tweetID } = req.params;
  const isQuoteTweet = body["content"] && body["content"]?.trim !== "";
  const userID = req["_user"]?.id;
  try {
    // check for tweet is already tweeted or not for RETWEET only
    const retweetCheck = await tweetModel.findOne({
      parentTweet: tweetID,
      type: "RETWEET",
      owner: userID,
    });

    // delete retweet, if exits
    if (retweetCheck) {
      await retweetCheck.deletePermanently();
      return res.status(204).end();
    }

    let reTweet = await tweetModel.create({
      ...body,
      parentTweet: tweetID,
      type: isQuoteTweet ? "QUOTE_RETWEET" : "RETWEET",
      owner: userID,
    });

    reTweet = await reTweet.populate({
      path: "parentTweet",
      populate: [{ path: "owner" }, { path: "attachments" }],
    });
    await reTweet.populate("owner");

    res.status(201).send(reTweet.toJSON());
  } catch (e: any) {
    res.status(500).send({ status: "ERROR", message: e });
  }
}

// create tweet reply
export async function createTweetReplyHandler(req: Request, res: Response) {
  const body = req.body;
  const { id: tweetID } = req.params;
  const userID = req["_user"]?.id;
  try {
    const tweet = await tweetModel.findById(tweetID);
    if (!tweet) throw new Error("Tweet not found!");

    let newTweetReply = await tweetModel.create({
      ...body,
      isReply: true,
      parentTweet: tweetID,
      owner: userID,
    });

    newTweetReply = await newTweetReply.populate("attachments");
    await newTweetReply.populate("owner");

    // fetch & save replies count
    const replies = await tweetModel.count({ parentTweet: tweetID });
    tweet.replyCount = replies;
    tweet.save();

    //create notification for tweet owner
    await createNotification(userID, tweet.owner, "REPLY", tweetID);

    res.status(201).send(newTweetReply.toJSON());
  } catch (e: any) {
    res.status(500).send({ status: "ERROR", message: e });
  }
}

// get for you tweets AI logic
export async function getForYouTweets(req: Request, res: Response) {
  const listMode = req.query?.["list"];
  const includeID = req.query?.["id"];
  //TODO : for getting tweets from followings only
  const following = req.query?.["following"];

  const userID = req["_user"]?.id;
  const projection = {
    ...(listMode && { content: 1, _id: includeID ? 1 : 0 }),
  };
  try {
    // check user exists or not

    //TODO: get recent top tweets from followings
    const fetchedTweets = await tweetModel
      .find(
        {
          $or: [{ isReply: { $exists: false } }, { isReply: false }],
        },
        projection
      )
      .populate("owner")
      .populate("attachments", "id path url mimetype")
      .populate({
        path: "parentTweet",
        populate: [{ path: "owner" }, { path: "attachments" }],
      });
    const _tweets = sortByKey(fetchedTweets, "createdAt", { reverse: true });

    // get stat for tweet is liked or not by session user
    const tweets: any = [];
    for await (const tweet of _tweets) {
      const liked = userID
        ? await isTweetLikedByUser(tweet.id, req["_user"].id)
        : false;
      tweets.push({ ...tweet.toJSON(), liked });
    }
    res.send(tweets);
  } catch (e: any) {
    res.status(500).send({ status: "ERROR", message: e });
  }
}

// retrieve session user tweets
export async function getMyTweets(req: Request, res: Response) {
  const listMode = req.query?.["list"];
  const includeID = req.query?.["id"];

  const userId = req["_user"].id;
  const projection = {
    ...(listMode && { content: 1, _id: includeID ? 1 : 0 }),
  };
  try {
    const userTweets = await tweetModel.find(
      {
        owner: userId,
        $or: [{ isReply: { $exists: false } }, { isReply: false }],
      },
      projection
    );
    res.send(userTweets);
  } catch (e: any) {
    res.status(500).send({ status: "ERROR", message: e });
  }
}

// get all tweets by username
export async function getUserTweetsByUsername(
  req: Request,
  res: Response,
  next
) {
  const { username } = req.params;
  const userID = req["_user"]?.id;
  try {
    // find userID by username
    const tweetUser = await userModel.findOne({ username });
    const userTweets = await tweetModel
      .find({
        owner: tweetUser?.id,
        $or: [{ isReply: { $exists: false } }, { isReply: false }],
      })
      .populate("owner")
      .populate("attachments")
      .populate({
        path: "parentTweet",
        populate: [{ path: "owner" }, { path: "attachments" }],
      });

    const _tweets = sortByKey(userTweets, "createdAt", { reverse: true });

    // get stat for tweet is liked or not by session user
    const tweets: any = [];
    for await (const tweet of _tweets) {
      const liked = userID
        ? await isTweetLikedByUser(tweet.id, req["_user"].id)
        : false;
      tweets.push({ ...tweet.toJSON(), liked });
    }

    res.send(tweets);
  } catch (e: any) {
    next(new BadRequestError("Failed to fetch user tweets"));
  }
}
export async function getLikedTweetsByUser(req: Request, res: Response, next) {
  const { username } = req.params;
  try {
    // find userID by username
    const tweetUser = await userModel.findOne({ username });
    const userTweets = await likeModel
      .find({ likedBy: tweetUser?.id, type: "TWEET" })
      .populate({
        path: "tweet",
        populate: [{ path: "owner" }, { path: "attachments" }],
      });
    const likedTweets = sortByKey(userTweets, "createdAt", { reverse: true });
    const tweets: any = [];
    for (const tweet of likedTweets) tweets.push(tweet?.toJSON()?.tweet);
    res.send(tweets);
  } catch (error) {
    next(new BadRequestError("Failed to fetch user tweets"));
  }
}

// get stat for tweet is liked or not by user
async function isTweetLikedByUser(tweet, likedBy) {
  const isLiked = await likeModel.exists({ tweet, likedBy });
  if (!isLiked) return false;
  return true;
}

async function isTweetRetweetByUser(tweet, owner) {
  const isRetweeted = await tweetModel.exists({ parentTweet: tweet, owner });
  if (!isRetweeted) return false;
  return true;
}

async function getRelativeRetweetData(tweet, owner) {
  const isRetweeted = await tweetModel.exists({ parentTweet: tweet, owner });
  if (!isRetweeted) return false;
  return true;
}

export async function getTweetById(req: Request, res: Response) {
  const userID = req["_user"]?.id;
  try {
    const { id } = req.params;
    const tweet = await tweetModel
      .findById(id)
      .populate("owner")
      .populate("attachments")
      .populate({
        path: "parentTweet",
        populate: [{ path: "owner" }, { path: "attachments" }],
      });

    if (!tweet) throw new Error("Tweet not found!");

    // check tweet is retweet or not

    const liked = userID ? await isTweetLikedByUser(tweet.id, userID) : false;

    // find tweet replies

    // get tweet retweet data from followings data

    res.send({ ...tweet.toJSON(), liked });
  } catch (error) {
    res.status(404).send({ message: "Tweet doesn't exists!" });
  }
}

// get tweet replies
export async function getTweetReplies(req: Request, res: Response) {
  const userID = req["_user"]?.id;
  try {
    const { id } = req.params;
    const tweet = await tweetModel.findById(id);

    if (!tweet) throw new Error("Tweet not found!");

    const tweetReplies = await tweetModel
      .find({ isReply: true, parentTweet: id })
      .populate("owner")
      .populate("attachments");

    // filter by tweet likes @v1
    const _replies = sortByKey(tweetReplies, "likeCount", { reverse: true });

    // get stat for tweet is liked or not by session user
    const replies: any = [];
    for await (const reply of _replies) {
      const liked = userID ? await isTweetLikedByUser(reply.id, userID) : false;
      replies.push({ ...reply.toJSON(), liked });
    }

    res.send(replies);
  } catch (error) {
    res.status(404).send({ message: "Tweet doesn't exists!" });
  }
}

export async function updateTweetHandler(req: Request, res: Response) {
  const { id } = req.params;
  const tweet = await tweetModel.findById(id);
  if (!tweet) {
    return res
      .status(404)
      .send({ status: "ERROR", message: "Tweet doesn't exists!" });
  }

  await tweetModel.findByIdAndUpdate(id, { $set: req.body });
  const updatedTweet = await tweetModel
    .findById(id)
    .populate("owner")
    .populate("attachments", "id path url mimetype");

  const liked = await isTweetLikedByUser(id, req["_user"].id);

  return res.send({ ...updatedTweet?.toJSON(), liked });
}

export async function toggleTweetLike(req: Request, res: Response, next) {
  const { id } = req.params;
  const tweet = await tweetModel.findById(id);

  if (!tweet) return next(new BadRequestError("Tweet doesn't exists!"));
  const userID = req["_user"]?.id;
  try {
    // find tweet is already liked or not
    const isLiked = await likeModel.findOne({
      tweet: id,
      likedBy: userID,
    });

    if (isLiked) {
      await isLiked?.delete();
      // delete notification
      await deleteNotificationForUser(userID, tweet.owner, "LIKE", id);
    } else {
      await likeModel.create({ tweet: id, likedBy: userID });
      // create like notification
      await createNotification(userID, tweet?.owner, "LIKE", id);
    }

    // count tweet likes & save count to tweet
    const likes = await likeModel.count({ tweet: id });
    tweet.likeCount = likes;
    tweet.save();

    res.send({ likes });
  } catch (error) {
    next(new BadRequestError("Tweet couldn't like!"));
  }
}

export async function deleteTweetHandler(req: Request, res: Response, next) {
  const { id } = req.params;
  try {
    const tweet = await tweetModel.findById(id);
    if (!tweet) return next(new BadRequestError("Tweet doesn't exists"));

    // throw error for invalid tweet owner
    if (!tweet?.isAdmin(req["_user"]?.id))
      next(new BadRequestError("Invalid authorization!"));

    if (tweet?.isReply) {
      // if tweet is reply update parent tweet replyCount
      // fetch & save replies count
      const replyCount = await tweetModel.count({
        parentTweet: tweet.parentTweet,
      });
      await tweetModel.findByIdAndUpdate(tweet.parentTweet, {
        $set: { replyCount },
      });
      // TODO: delete replies notifications
    }

    if (!tweet?.isReply) {
      // delete tweet replies/retweets
      const replies = await tweetModel.find({ parentTweet: id });
      for await (const tweetReply of replies) {
        await tweetReply.deletePermanently();
      }
    }
    //TODO: delete tweet notifications
    // await deleteNotification(userID, tweet.owner, "REPLY");

    await tweet?.deletePermanently();

    res.end();
  } catch (error) {
    next(new BadRequestError("Tweet couldn't delete!"));
  }
}

// ==================== TODO ===================

// get following/following user liked tweets/recommended tweets
export async function getTweetForMe(req: Request, res: Response, next) {
  try {
  } catch (error) {
    next(new BadRequestError("Couldn't fetch tweet for you!"));
  }
}

// tweets from followings as well as retweets
export async function getMyTweetFeed(req: Request, res: Response, next) {
  try {
  } catch (error) {
    next(new BadRequestError("Couldn't get my tweet feed!"));
  }
}

/// tweets from following list without any retweets
export async function getFollowingTweets(req: Request, res: Response, next) {}

// tweet by @verified on getting verified
export async function postTweetFromTwitterVerified(tweet) {
  // find @verified account
  const verifiedAccount = await userModel.findOne({
    $or: [{ username: "Verified" }, { username: "verified" }],
  });
  if (!verifiedAccount) return;
  await tweetModel.create({ content: tweet, owner: verifiedAccount?.id });
}
