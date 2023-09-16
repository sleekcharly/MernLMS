// create class for handling the errors
class ErrorHandler extends Error {
  statusCode: Number; // error status code

  constructor(message: any, statusCode: Number) {
    super(message); // pass message to the parent Error class
    this.statusCode = statusCode;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default ErrorHandler;
