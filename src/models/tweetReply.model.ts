import { User } from "./user.model";
import {
  DocumentType,
  getModelForClass,
  modelOptions,
  pre,
  prop,
  Ref,
} from "@typegoose/typegoose";
import { Tweet } from "./tweet.model";

type tweetType = "NORMAL" | "IMAGE" | "POLL";
@modelOptions({
  schemaOptions: {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        // ret.url =
        //   "http://localhost:1234/" + ret.path?.replace("content/", "cdn/");
        if (!ret.url) ret.url = "/" + ret.path?.replace("content/", "cdn/"); // with VITE LOCAL DEV
        delete ret._id;
        delete ret.__v;
        delete ret.path;
        // delete ret.name;
        delete ret.deleted;
      },
    },
  },
  options: {
    enableMergeHooks: true, // needs to be set, because by default typegoose does not need de-duplication
  },
})
export class TweetReply {
  @prop({ ref: () => Tweet, required: true })
  public tweet?: Ref<Tweet>;

  @prop({ ref: () => Tweet, required: false })
  public replyTo?: Ref<TweetReply>;

  @prop({ required: true })
  public content: string;

  @prop({ required: false, default: null })
  public type?: tweetType;

  @prop({ ref: () => User, required: true })
  public owner?: Ref<User>;

  @prop({ default: 0 })
  public likeCount: number;

  @prop({ default: 0 })
  public viewCount: number;

  public async deleteReply(this: DocumentType<TweetReply>) {
    console.log("dlete tweet reply here");

    // await fs.rm(this.path!, { force: true });
    // await this.delete();
  }

  public isAdmin(this: DocumentType<TweetReply>, userID: String) {
    if (this.owner != null) return this.owner?.toString() === userID;
    return false;
  }
}

export const tweetReplyModel = getModelForClass(TweetReply);
