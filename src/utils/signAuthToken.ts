import { sign } from "jsonwebtoken";
/**
 *
 * @param user - user data for signing token
 * @returns token
 */
export const signAuthToken = (user) => {
  return sign(
    { id: user.id, name: user.name, email: user.email },
    process.env.JWT_ENCRYPTION_KEY!,
    { expiresIn: "8days" }
  );
};
