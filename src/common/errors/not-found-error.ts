import { CustomError } from "./custom-error";

export class NotFoundError extends CustomError {
  statusCode = 404;

  constructor(public message: string = "Not Found") {
    super("Route not found");

    Object.setPrototypeOf(this, NotFoundError.prototype);
  }

  prettify() {
    return { message: this.message || "Not Found" };
  }
}
