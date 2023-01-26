import multer, { Multer } from "multer";
import fs from "fs/promises";
import { BadRequestError } from "common/errors/bad-request-error";
// import fs from "fs";
class MediaStorage {
  protected uploadDir: string = "";
  private storage;
  public store: Multer;
  public constructor({ uploadDir = "" }) {
    this.uploadDir = uploadDir;
    this.setupStorage();
    this.store = multer({ storage: this.storage });
  }

  protected setupStorage() {
    this.storage = multer.diskStorage({
      destination: async (req, file, cb) => {
        try {
          const dir = `.${process.env.UPLOAD_CONTENT_DIR ?? "/content"}/${
            req.currentUser?.id
          }/${this.uploadDir}/`;
          try {
            await fs.access(dir);
            return cb(null, dir);
          } catch (error: any) {
            return await fs
              .mkdir(dir, { recursive: true })
              .then(() => cb(null, dir))
              .catch((err) => {
                cb(new BadRequestError("Storage initialization failed!"), "");
              });
          }
        } catch (error) {
          cb(new BadRequestError("Invalid file!"), "");
        }
      },
      filename: (req, file, cb) => {
        var ext = file.originalname.substring(
          file.originalname.lastIndexOf(".")
        );

        cb(null, "tm__" + file.fieldname + "_" + Date.now() + ext);
      },
    });
  }
}
export default MediaStorage;
