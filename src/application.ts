import express, { Express, Request, Response } from "express";
import * as bodyParser from "body-parser";
import { connectMongo } from "./lib/connectMongo";
import Routes from "./routes";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const BODY_PARSER_LIMIT: string = process.env.BODY_PARSER_LIMIT || "15mb";

var allowedOrigins = [
  // 'http://localhost:3000',
  "https://twitter-clone-2023.vercel.app",
];

class Application {
  public express?: express.Application;

  public constructor() {
    this.initialize()
      .then(async () => {
        process.stdout.write("Server started\n");
        await connectMongo();
      })
      .catch((err) => {
        process.stderr.write(err.message);
        process.exit(1);
      });
  }

  protected async initialize(): Promise<void> {
    this.express = express();
    this.express.use(cors());
    this.express.use(bodyParser.json({ limit: BODY_PARSER_LIMIT }));
    this.express.use(
      bodyParser.urlencoded({ limit: BODY_PARSER_LIMIT, extended: true })
    );
    this.express.use(Routes);
  }
}

export default new Application().express;
