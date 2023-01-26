import { Router } from "express";
import userController, { getUserById } from "controllers/user.controller";
import { authorization } from "common/middleware/authorization";
import { verifyToken } from "common/middleware/verifyToken";
import { requireAuthentication } from "common/middleware/require-auth";

const router = Router();

const userAreaHandler = [verifyToken, requireAuthentication];
const adminAreaHandler = [...userAreaHandler, authorization(["admin"])];

router.get(
  "/profile/:username",
  userAreaHandler,
  userController.getUserByUsername
);
router.get("/user/:id", userAreaHandler, getUserById);

router.get("/user/q/:query", userAreaHandler, userController.searchUserByQuery);

// admin routes
router.get("/users", adminAreaHandler, userController.getUsers);
router.patch("/users/:id", adminAreaHandler, userController.updateUser);
router.delete("/users/:id", adminAreaHandler, userController.deleteUser);

export default router;
