import { Request, Response } from "express";
import { BadRequestError } from "../common/errors/bad-request-error";
import { mediaModel } from "../models/media.model";
import { NotFoundError } from "../common/errors/not-found-error";

export async function getMediaById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const media = await mediaModel.findById(id);
    res.send(media);
  } catch (error) {
    res.status(404).send({ message: "Media doesn't exists!" });
  }
}

export async function mediaUploadHandler(req: Request, res: Response, next) {
  const user = req.currentUser?.id;
  try {
    const { filename, originalname, path, size, mimetype } = req.file!;
    const uploadedContent = await mediaModel.create({
      ...req.body,
      filename,
      originalname,
      path,
      size,
      mimetype,
      user,
    });

    var serverURL = `${req.protocol}://${req.headers.host}`;
    res.send({
      ...uploadedContent.toJSON(),
      url: `${serverURL}/${path.replace("content/", "cdn/")}`,
    });
  } catch (error) {
    next(new BadRequestError("Failed to upload!"));
  }
}

export async function deleteMediaHandler(req: Request, res: Response, next) {
  const { id } = req.params;
  try {
    const existMedia = await mediaModel.findById(id);
    if (!existMedia) {
      next(new NotFoundError("Resource doesn't exists!"));
      return;
    }
    await existMedia.deletePermanently();

    res.end();
  } catch (error) {
    next(new BadRequestError("Failed to delete!"));
  }
}
