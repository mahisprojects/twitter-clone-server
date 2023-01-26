import { CustomError } from "./custom-error";

export class BadRequestError extends CustomError {
  statusCode = 400;

  constructor(public message: string = "Invalid argument(s)!") {
    super(message);

    Object.setPrototypeOf(this, BadRequestError.prototype);
  }

  prettify() {
    return { message: this.message || "Invalid argument(s)!" };
  }
}
