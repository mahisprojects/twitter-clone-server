import {
  getModelForClass,
  modelOptions,
  prop,
  Ref,
} from "@typegoose/typegoose";
import { User } from "./user.model";

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
export class Connection {
  @prop({ ref: () => User, required: false })
  public from?: Ref<User>;

  @prop({ ref: () => User, required: false })
  public to?: Ref<User>;

  @prop({ default: false })
  public muted?: boolean;

  @prop({ default: false })
  public blocked?: boolean;

  // Extra feature
  @prop({ default: null })
  public feature?: typeFeature;
}

type typeFeature = {
  showRetweets: boolean;
};

export const connectionModel = getModelForClass(Connection);
