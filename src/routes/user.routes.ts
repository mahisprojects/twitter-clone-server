import { Router } from "express";
import userController, {
  deleteNotification,
  getNoficationsForUser,
  getUserById,
} from "controllers/user.controller";
import { verifyToken } from "common/middleware/verifyToken";
import { requireAuthentication } from "common/middleware/require-auth";
import { authenticateIfUser } from "../common/middleware/authenticate-if-user";

const router = Router();

const userAreaHandler = [verifyToken, requireAuthentication];

router.get(
  "/profile/:username",
  authenticateIfUser,
  userController.getUserByUsername
);
router.get("/user/:id", userAreaHandler, getUserById);

router.get("/user/q/:query", userAreaHandler, userController.searchUserByQuery);

// notification routes
router.get("/notifications", userAreaHandler, getNoficationsForUser);
router.delete("/notification/:id", userAreaHandler, deleteNotification);

export default router;
