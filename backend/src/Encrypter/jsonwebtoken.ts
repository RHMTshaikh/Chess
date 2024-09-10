import jwt from 'jsonwebtoken';
import AppError  from '../Errors/AppError';
import { User } from '../types';


export function createAccessToken({ user, options }: { user: User, options: jwt.SignOptions }) {
    return jwt.sign({ email: user.email }, process.env.JWT_SECRET || '', { ...options });
}

export function createRefreshToken({ user, options }: { user: User, options: jwt.SignOptions }) {
    return jwt.sign({ email: user.email }, process.env.JWT_REFRESH_SECRET || '', { ...options });
}

export function verifyAccessToken(token: string) {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || '');
        return decoded;
    } catch (err) {
        throw new AppError(`${(err as Error).name}`, 401);
    }
}   

export function verifyRefreshToken(token: string) {
    try {
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || '');
        return decoded;
    } catch (err) {
        throw new AppError(`${(err as Error).name}`, 401);
    }
}

