import { CustomError } from "./custom-error";

export class UnauthorizedError extends CustomError {
  statusCode = 401;

  constructor(public message: string = "Access Denied!") {
    super(message);

    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }

  prettify() {
    return { message: this.message || "Access Denied!" };
  }
}
