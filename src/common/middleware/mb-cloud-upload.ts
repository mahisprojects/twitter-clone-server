import { BadRequestError } from "common/errors/bad-request-error";
import { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "../errors/unauthorized-error";
import axios from "axios";
import concat from "concat-stream";
import FormData from "form-data";
import { directoryModel } from "models/directory.model";
export const MBCloudStorage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const file = req.files!["file"];
    if (!file) {
      next(new BadRequestError("No file is provided"));
      return;
    }

    const { directory, encrypted } = req.body;

    // get directoru first
    var dir: string | undefined;
    if (directory) {
      dir = (await directoryModel.findById(directory, { path: 1 }))?.path;
    }
    const http = axios.create({ baseURL: process.env.MB_CLOUD_SERVER });

    const body = new FormData();
    dir && body.append("dir", dir);
    body.append("file", file, "voltz_demo.xyz");
    // const res = body.submit(
    //   {
    //     host: process.env.MB_CLOUD_SERVER,
    //     method: "POST",
    //   },
    //   (err, res) => {
    //     console.log(res.statusCode);
    //   }
    // );

    body.pipe(
      concat(async (data) => {
        const { data: cloudFile } = await http.post("file/upload", body);

        console.log("mb cloud upload here");
      })
    );
    // console.log(cloudFile);

    res.end();
    //   next();
  } catch (error) {
    console.log("error with mb cloud");
    console.log(error);
  }
};
