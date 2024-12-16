import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError.js';

const validateUser = (role = "any") => (req, res, next) => {
    // role = 1 indicates any userType with valid token is allowed
    const auth = req.headers?.authorization
    if (!auth || !auth.startsWith("Bearer ")) {
        throw new ApiError(401, "Authorization Header Invalid")
    }

    const token = auth.split(" ")[1]

    try {
        jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        const decodedToken = jwt.decode(token, process.env.JWT_ACCESS_SECRET);

        if (role == "any" || (role == decodedToken.userType)) {
            // decodedToken contains {_id,userType}
            req.user = decodedToken
            next()
        }
        else {
            throw new ApiError(401, `Forbidded for userType: ${decodedToken.userType}`)
        }
    } catch (err) {
        throw new ApiError(401, err.message || "Invalid or expired token");
    }
}

const optionalValidation =  (req, res, next) => {
    const auth = req.headers?.authorization
    if (!auth || !auth.startsWith("Bearer ")) {
        req.user = null;
        next();
    }

    const token = auth.split(" ")[1]

    try {
        jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        const decodedToken = jwt.decode(token, process.env.JWT_ACCESS_SECRET);

        req.user = decodedToken
        next()
    } catch (err) {
        throw new ApiError(401, err.message || "Invalid or expired token");
    }
}

export default validateUser

export {optionalValidation}