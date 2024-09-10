export default class AppError extends Error {
    constructor(message: string, public statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        // this.name = this.constructor.name; // AppError
        Error.captureStackTrace(this, this.constructor);
    }
}