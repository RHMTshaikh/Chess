// Chess\backend\src\middleware\requireAuth.ts

import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
// import User from '../models/userModel';

// Define the user type
interface UserType {
    _id: string;
}

// Define the expected JWT payload type
interface JwtPayloadWithId extends JwtPayload {
    _id: string;
}

// Extend the Request interface to include the user property
interface AuthenticatedRequest extends Request {
    user?: UserType;
}

// Type guard to check if the payload is of type JwtPayloadWithId
function isJwtPayloadWithId(payload: JwtPayload | string | undefined): payload is JwtPayloadWithId {
    return typeof payload === 'object' && payload !== null && '_id' in payload;
}

const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Verify authentication
    const { authorization } = req.headers as { authorization: string | undefined }; // Type assertion for headers

    if (!authorization) {
        return res.status(401).json({ error: "Authorization token required" });
    }

    const token = authorization.split(' ')[1];

    // Ensure that the secret is defined
    const secret = process.env.SECRET;
    if (!secret) {
        throw new Error('Secret is not defined in the environment variables');
    }

    try {
        const decodedToken = jwt.verify(token, secret) as JwtPayload | string | undefined;

        // Check if the decoded token is of type JwtPayloadWithId
        if (!isJwtPayloadWithId(decodedToken)) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        const { _id } = decodedToken;

        // Attaching user id to the request object
        // const user = await User.findOne({ _id }).select('_id');
        // if (!user) {
            // return res.status(401).json({ error: 'User not found' });
        // }

        // req.user = user as UserType; // Assigning user to req.user
        next();
    } catch (error) {
        console.error(error);
        res.status(401).json({ error: 'Request is not authorized' });
    }
};

export default requireAuth;
