import {
  getModelForClass,
  modelOptions,
  prop,
  Ref,
} from "@typegoose/typegoose";
import { User } from "./user.model";

export type notificationType = "FOLLOW" | "LIKE" | "REPLY";

// follow connections
@modelOptions({
  schemaOptions: {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      },
    },
  },
})
export class Notification {
  @prop({ ref: () => User, required: false })
  public from?: Ref<User>;

  @prop({ ref: () => User, required: false })
  public to?: Ref<User> | Ref<User[]>;

  @prop({ required: false })
  public tweet?: String; // tweetID for tweet/reply/like notification

  @prop({ default: null })
  public type?: notificationType;
}

export const notificationModel = getModelForClass(Notification);
