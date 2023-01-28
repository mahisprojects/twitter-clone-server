import { User } from "./user.model";
import {
  getModelForClass,
  modelOptions,
  prop,
  Ref,
} from "@typegoose/typegoose";

import { Tweet } from "./tweet.model";

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

  @prop({ ref: () => User, required: true })
  public likedBy?: Ref<User>;

  // extra field
  @prop({ required: false, default: "TWEET" })
  public type?: likeType;
}

export const likeModel = getModelForClass(Like);
