import bcrypt from "bcryptjs";
import {
  DocumentType,
  getModelForClass,
  modelOptions,
  pre,
  prop,
  Ref,
  Severity,
} from "@typegoose/typegoose";

type AccountType = "Person" | "Business" | "Government";

type Membership = {
  type: AccountType;
  validTill: number;
  verified: boolean;
  legacy?: boolean;
};

@modelOptions({
  schemaOptions: {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.password;
      },
    },
  },
  options: {
    allowMixed: Severity.ALLOW,
    enableMergeHooks: true, // needs to be set, because by default typegoose does not need de-duplication
  },
})
export class User {
  @prop({})
  public uid!: string; // for social login purpose only - TODO

  @prop({ required: true })
  public name!: string;

  @prop({ required: true, unique: true })
  public email!: string;

  @prop({ required: true })
  public password!: string;

  @prop({ required: false, unique: true })
  public username?: string;

  @prop({ required: false })
  public profile?: string;

  @prop({ required: false, default: "user" })
  public role?: string;

  // extra fields - Not Implemented
  @prop({ required: false, default: null })
  public membership?: Membership;
  // number of tweet limit per day
  @prop({ default: 10, required: false })
  public tweetLimit: number;

  // user profile meta
  @prop({ required: false, default: { followers: 0, following: 0 } })
  public count?: ProfileCount;

  // profile data
  @prop({ required: false, default: "" })
  public bio?: string;
  @prop({ required: false })
  public location?: string;
  @prop({ required: false })
  public url?: string;

  // the "this" definition is required to have the correct types
  public comparePassword(this: DocumentType<User>, inputPassword: string) {
    return bcrypt.compareSync(inputPassword, this.password);
  }
}

interface ProfileCount {
  followers?: number;
  following?: number;
}

export const userModel = getModelForClass(User);
