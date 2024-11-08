import { ApiError } from "../utils/ApiError.js";

const fieldValidator =
  (fields, inQuery = false) =>
  (req, res, next) => {
    const missingFields = [];
    const queryOrBody = inQuery ? "query" : "body";
    for (let field of fields) {
      if (!(field in req[queryOrBody])) {
        missingFields.push(field);
      }
    }
    if (missingFields.length > 0) {
      throw new ApiError(400, missingFields.join(", ") + " fields are missing");
    }
    next();
  };

export { fieldValidator };
