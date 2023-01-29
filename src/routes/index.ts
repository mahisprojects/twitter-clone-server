import { Router } from "express";
import { NotFoundError } from "common/errors/not-found-error";
import { errorHandler } from "common/middleware/error-handler";

import AccountRouter from "./account.routes";
import UserRouter from "./user.routes";
import ConnectionRoutes from "./connection.routes";
import TweetRoutes from "./tweet.routes";
import MediaRoutes from "./media.routes";
import express from "express";

const Routes = Router();

Routes.use("/content", express.static("./content"));

Routes.use("/api/account", AccountRouter);
Routes.use("/api", UserRouter);
Routes.use("/api", ConnectionRoutes);
Routes.use("/api", TweetRoutes);
Routes.use("/api", MediaRoutes);

Routes.all("/", async (req, res) => {
  res.send({
    server: {
      name: "Twitter Clone Server",
      status: "Running",
      version: process.env.npm_package_version ?? "1.0.0",
      nodeVersion: `NodeJS - ${process.versions.node}`,
    },
  });
});

Routes.all("*", (req, res) => {
  throw new NotFoundError();
});

Routes.use(errorHandler);

export default Routes;
