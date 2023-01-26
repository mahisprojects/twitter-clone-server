import express from "express";
import { verifyToken } from "../common/middleware/verifyToken";
import { requireAuthentication } from "../common/middleware/require-auth";
import {
  deleteMediaHandler,
  getMediaById,
  mediaUploadHandler,
} from "../controllers/media.controller";

const router = express.Router();

const userAreaHandler = [verifyToken, requireAuthentication];

// fetch
// router.get("/media", userAreaHandler, getMessageWithUsersHandler);
// DEBUG ONLY
router.get("/media/:id", getMediaById);

// router.put("/message/new", userAreaHandler, createmessageHandler);
// router.patch("/media/:id", userAreaHandler, updatemessageHandler);

router.delete("/media/:id", userAreaHandler, deleteMediaHandler);

export default router;
