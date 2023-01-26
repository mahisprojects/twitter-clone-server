import { Router } from "express";
import { authorization } from "common/middleware/authorization";
import { requireAuthentication } from "common/middleware/require-auth";
import { verifyToken } from "common/middleware/verifyToken";
import userController from "controllers/user.controller";
// import { checkDuplicateEmail } from "middleware/verifySignUp";

const router = Router();

// ! only for testing
router.get("/protected", verifyToken, (req, res) => {
  res.json({
    message: "You can't access this route without successfull authorization.",
  });
});

const userAreaHandler = [verifyToken, requireAuthentication];

router.get("/me", userAreaHandler, userController.currentUserHandler);

router.post("/login", userController.loginUser);
router.post("/register", userController.registerUser);

router.patch("/me", userAreaHandler, userController.updateUser);

// ! NOT AVAILABLE
// router.get("/users", userAreaHandler, userController.getUsers);

// const adminAreaHandler = [
//   verifyToken,
//   requireAuthentication,
//   authorization(["admin"]),
// ];

// admin routes
// router.get("/users/:id", adminAreaHandler);
// router.patch("/users/:id", adminAreaHandler, userController.updateUser);
// router.delete("/users/:id", adminAreaHandler, userController.deleteUser);

export default router;
