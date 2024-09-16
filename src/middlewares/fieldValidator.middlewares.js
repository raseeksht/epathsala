
import { ApiError } from "../utils/ApiError.js";

const fieldValidator = (fields) => (req, res, next) => {
    const missingFields = []
    for (let field of fields) {
        if (!(field in req.body)) {
            missingFields.push(field)
        }
    }
    if (missingFields.length > 0) {
        throw new ApiError(400, missingFields.join(", ") + " fields are missing")
    }
    next()
}


export { fieldValidator }