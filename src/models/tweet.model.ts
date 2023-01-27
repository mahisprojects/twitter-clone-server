import { User } from "./user.model";
import {
  DocumentType,
  getModelForClass,
  modelOptions,
  pre,
  prop,
  Ref,
} from "@typegoose/typegoose";
import { Media } from "./media.model";

type tweetType = "NORMAL" | "IMAGE" | "POLL";
type ReplyMode = "PUBLIC" | "FOLLOWING" | "MENTIONED";
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
export class Tweet {
  @prop({ required: true })
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

  @prop({ default: false })
  public trash: boolean;

  public async moveToTrash(this: DocumentType<Tweet>) {
    this.trash = true;
    return await this.save();
  }

  public async restoreFromTrash(this: DocumentType<Tweet>) {
    this.trash = false;
    return await this.save();
  }

  public async deletePermanently(this: DocumentType<Tweet>) {
    // await fs.rm(this.path!, { force: true });
    // await this.delete();
  }

  public isAdmin(this: DocumentType<Tweet>, userID: String) {
    if (this.owner != null) return this.owner?.toString() === userID;
    return false;
  }
}

export const tweetModel = getModelForClass(Tweet);
