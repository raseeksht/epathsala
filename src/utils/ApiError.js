class ApiError extends Error {
    constructor(statusCode, message = "something went wrong", stack = "") {
        super(message)
        this.statusCode = statusCode;
        this.message = message
        if (stack) {
            this.stack = stack
        }
        else {
            this.stack = Error.captureStackTrace(this, this.constructor)
        }
    }
}

export { ApiError }