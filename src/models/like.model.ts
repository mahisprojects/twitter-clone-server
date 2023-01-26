import { User } from "./user.model";
import {
  DocumentType,
  getModelForClass,
  modelOptions,
  prop,
  Ref,
} from "@typegoose/typegoose";

import { Tweet } from "./tweet.model";
import { TweetReply } from "./tweetReply.model";

type likeType = "TWEET" | "REPLY";
@modelOptions({
  schemaOptions: {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.deleted;
      },
    },
  },
  options: {
    enableMergeHooks: true, // needs to be set, because by default typegoose does not need de-duplication
  },
})
export class Like {
  @prop({ ref: () => Tweet, required: false })
  public tweet?: Ref<Tweet>;

  @prop({ ref: () => TweetReply, required: false })
  public tweetReply?: Ref<TweetReply>;

  @prop({ required: false, default: "TWEET" })
  public type?: likeType;

  @prop({ ref: () => User, required: true })
  public likedBy?: Ref<User>;

  public isAdmin(this: DocumentType<Tweet>, userID: String) {
    if (this.owner != null) return this.owner?.toString() === userID;
    return false;
  }
}

export const likeModel = getModelForClass(Like);
