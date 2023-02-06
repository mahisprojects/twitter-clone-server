import {
  createNPYearProgressTweet,
  getNPYearProgressHandler,
} from "controllers/extra.controller";
import express from "express";

const router = express.Router();

router.get("/progress/NP", getNPYearProgressHandler);
// EXperimental - Year Progress API
router.post("/progress/tweet", createNPYearProgressTweet);

export default router;
