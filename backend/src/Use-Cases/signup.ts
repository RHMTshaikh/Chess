import { DB_Operations, User } from '../types';
import { encrypter } from '../Encrypter/bcrypt';
import { createAccessToken, createRefreshToken } from '../Encrypter/jsonwebtoken';
import ms from 'ms';
import AppError from '../Errors/AppError';

const cycleTimeForToken = '1h';
const cycleTimeForCredentials = '7d';

export const accessTokenOptions = {
    expiresIn: cycleTimeForToken,
};
export const refreshTokenOptions = {
    expiresIn: cycleTimeForCredentials,
    notBefore: cycleTimeForToken,
};

export default function makeSignUp ({ DB_Operations }:{DB_Operations: DB_Operations}) {
    return async function signUp ({ name, email, password }: { 
        name: string,
        email: string,
        password: string 
        }): Promise< User & { 
            accessToken:string, 
            refreshToken:string, 
            accessTokenMaxAge: number, 
            refreshTokenMaxAge: number 
        } > {         

        if (name.length < 3 || name.length > 50) {
            throw new AppError('Name must be between 3 and 50 characters long', 400);
        }
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            throw new AppError('Invalid email format', 400);
        }
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*?<>;:/\|~`,.])[A-Za-z\d!@#$%^&*?<>;:/\|~`,.]{6,}$/;
        if (!passwordRegex.test(password)) {
            throw new AppError('Password must be at least 6 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character', 400);
        }

        const existingUser = await DB_Operations.findUserByEmailDB({email});
        if (existingUser) {
            throw new AppError('Email already exists', 400);
        }

        const encryptedPassword = await encrypter(password);

        const user = await DB_Operations.addUserDB({ name, email, password: encryptedPassword });
        
        if ( !user ) {
            throw new AppError('Failed to add user to db', 500);
        }
        
        const accessToken = createAccessToken({ user, options: accessTokenOptions });
        const refreshToken = createRefreshToken({ user, options: refreshTokenOptions });
        
        const hashedRefreshToken = await encrypter(refreshToken);

        await DB_Operations.saveRefreshTokenDB({ email, refreshToken: hashedRefreshToken });
        
        return {
            name: user.name,
            email: user.email,
            rank: user.rank,
            accessToken,
            refreshToken,
            accessTokenMaxAge: ms(cycleTimeForCredentials)/1000,
            refreshTokenMaxAge: ms(cycleTimeForCredentials)/1000,
        };
    }
}

  