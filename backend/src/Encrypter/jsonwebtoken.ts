import jwt from 'jsonwebtoken';
import AppError  from '../Errors/AppError';


export function createAccessToken({ email, options }: { email: string, options: jwt.SignOptions }) {
    return jwt.sign({ email}, process.env.JWT_SECRET || '', { ...options });
}

export function createRefreshToken({ email, options }: { email: string, options: jwt.SignOptions }) {
    return jwt.sign({ email }, process.env.JWT_REFRESH_SECRET || '', { ...options });
}

export function verifyAccessToken(token: string) {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || '');
        return decoded;
    } catch (err) {
        console.log((err as Error).message);        
        throw new AppError(`${(err as Error).name}`, 401);
    }
}   

export function verifyRefreshToken(token: string) {
    try {
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || '');
        return decoded;
    } catch (err) {
        console.log((err as Error).message);        
        throw new AppError(`${(err as Error).name}`, 401);
    }
}

