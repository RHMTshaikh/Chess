import { DB_Operations } from '../types';
import { createAccessToken, createRefreshToken, verifyRefreshToken } from '../Encrypter/jsonwebtoken';
import { accessTokenOptions, refreshTokenOptions } from './signup';
import { JwtPayload } from 'jsonwebtoken';
import { decrypter, encrypter } from '../Encrypter/bcrypt';
import ms from 'ms';
import AppError from '../Errors/AppError';


export default function makeRefreshToken ({ DB_Operations }:{DB_Operations: DB_Operations}) {
    return async function refreshToken ({ token }: {
        token: string
        }):  Promise< { 
            newAccessToken:string,
            newRefreshToken:string,
            accessTokenMaxAge: number,
            refreshTokenMaxAge: number,
        } > {

        const decodedToken =  verifyRefreshToken(token) as JwtPayload;

        const email = decodedToken.email;
        if (!email) {
            throw new AppError('Invalid token', 401);
        }

        const user = await DB_Operations.findUserByEmailDB({ email });
        
        if (!user) {
            throw new AppError('User not found', 404);
        }

        const storedRefreshToken_encryted = user.refresh_token;

        const booleanResult = await decrypter(token, storedRefreshToken_encryted);

        if (!booleanResult) {
            throw new AppError('wrong refresh token', 401);
        }
        
        const newAccessToken = createAccessToken({ user, options: accessTokenOptions });
        const newRefreshToken = createRefreshToken({ user, options: refreshTokenOptions });

        const hashedRefreshToken = await encrypter(newRefreshToken);

        await DB_Operations.saveRefreshTokenDB({email, refreshToken: hashedRefreshToken });

        return {
            newAccessToken,
            newRefreshToken,
            accessTokenMaxAge: ms(refreshTokenOptions.expiresIn)/1000,
            refreshTokenMaxAge: ms(refreshTokenOptions.expiresIn)/1000,
        }
    }
}

  