import { DB_Operations, User } from '../types';
import { decrypter, encrypter } from '../Encrypter/bcrypt';
import { createAccessToken, createRefreshToken } from '../Encrypter/jsonwebtoken';
import { accessTokenOptions, refreshTokenOptions } from './signup';
import ms from 'ms';
import AppError from '../Errors/AppError';


export default function makeLogIn ({ DB_Operations }:{DB_Operations: DB_Operations}) {
    return async function logIn ({ email, password }: { 
        name: string, 
        email: string, 
        password: string 
        }): Promise< User & { 
            accessToken:string, 
            refreshToken:string, 
            accessTokenMaxAge: number, 
            refreshTokenMaxAge: number 
        } > {

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            throw new AppError('Invalid email format', 400);
        }

        const user = await DB_Operations.findUserByEmailDB({email});
        if (!user) {
            throw new AppError('Email does not exist', 404);
        }

        const isMatch = await decrypter(password, user.password); 

        if (isMatch === false) {
            throw new AppError('Incorrect password', 401);
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
            accessTokenMaxAge: ms(refreshTokenOptions.expiresIn)/1000,
            refreshTokenMaxAge: ms(refreshTokenOptions.expiresIn)/1000,
        };
    }
}

  