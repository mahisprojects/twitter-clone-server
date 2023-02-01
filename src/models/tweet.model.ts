import { User } from "./user.model";
import {
  DocumentType,
  getModelForClass,
  modelOptions,
  pre,
  prop,
  Ref,
} from "@typegoose/typegoose";
import { Media, mediaModel } from "./media.model";

type tweetType = "RETWEET" | "QUOTE_RETWEET" | "NORMAL" | "IMAGE" | "POLL"; // Not Implemented
type ReplyMode = "PUBLIC" | "FOLLOWING" | "MENTIONED"; // Not Implemented
@modelOptions({
  schemaOptions: {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.deleted;
        // move count fields to count
        ret.count = {
          likes: ret.likeCount,
          views: ret.viewCount,
          retweets: ret.retweetCount,
          replies: ret.replyCount,
        };
        // delete ret.likeCount;
        // delete ret.viewCount;
        // delete ret.retweetCount;
        // delete ret.replyCount;
      },
    },
  },
  options: {
    enableMergeHooks: true, // needs to be set, because by default typegoose does not need de-duplication
  },
})
export class Tweet {
  @prop({ required: false })
  public content: string;

  @prop({ ref: () => Media, default: [], required: false })
  public attachments?: Ref<Media>[] | string[];

  @prop({ required: false, default: "NORMAL" })
  public type?: tweetType;

  @prop({ ref: () => User, required: true })
  public owner?: Ref<User>;

  @prop({ required: false })
  public replyMode: ReplyMode;

  // tweet stats
  @prop({ default: 0 })
  public likeCount: number;
  @prop({ default: 0 })
  public viewCount: number;
  @prop({ default: 0 })
  public retweetCount: number;
  @prop({ default: 0 })
  public replyCount: number;

  // is Tweet is Reply ?
  @prop({ default: false })
  public isReply: boolean;

  @prop({ ref: () => Tweet, required: false })
  public parentTweet?: Ref<Tweet>;

  // delete tweet & related attachments
  public async deletePermanently(this: DocumentType<Tweet>) {
    for await (const mediaID of this.attachments!) {
      const media = await mediaModel.findById(mediaID);
      if (media) await media.deletePermanently();
    }
    await this?.delete();
  }

  public isAdmin(this: DocumentType<Tweet>, userID: String) {
    if (this.owner != null) return this.owner?.toString() === userID;
    return false;
  }
}

export const tweetModel = getModelForClass(Tweet);
