import fs from "fs/promises";
import { User } from "./user.model";
import {
  DocumentType,
  getModelForClass,
  modelOptions,
  prop,
  Ref,
} from "@typegoose/typegoose";

type UploadMediaType = "IMAGE" | "GIF" | "VIDEO";
type STORETYPE = "MBCLOUD" | "LOCAL" | "AWS";

@modelOptions({
  schemaOptions: {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.originalname;
      },
    },
  },
  options: {
    enableMergeHooks: true, // needs to be set, because by default typegoose does not need de-duplication
  },
})
export class Media {
  @prop({ required: true })
  public filename!: string;

  @prop({ required: false })
  public originalname?: string;

  @prop({ required: false })
  public path?: string;

  @prop({ required: false, default: "UnknOwn" })
  public mimetype?: string;

  @prop({ required: false, default: null })
  public type?: UploadMediaType;

  @prop({ default: 0 })
  public size?: number;

  @prop({ ref: () => User, required: false })
  public user?: Ref<User>;

  //extra field
  @prop({ default: "LOCAL" })
  public store: STORETYPE;

  public async deletePermanently(this: DocumentType<Media>) {
    await fs.rm(this.path!, { force: true });
    await this.delete();
  }
}

export const mediaModel = getModelForClass(Media);
