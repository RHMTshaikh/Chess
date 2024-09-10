import AppError from '../Errors/AppError';
import { DB_Operations } from '../types';
import { verifyAccessToken } from '../Encrypter/jsonwebtoken';
import { JwtPayload } from 'jsonwebtoken';


export default function makeLogOut ({ DB_Operations }:{DB_Operations: DB_Operations}) {
    return async function logOut ({ accessToken }: { accessToken: string} ): Promise<void>{

        const decodedToken =  verifyAccessToken(accessToken) as JwtPayload;

        const email = decodedToken.email;
        if (!email) {
            throw new AppError('Invalid token', 401);
        }

        const user = await DB_Operations.findUserByEmailDB({ email });
        if (!user) {
            throw new AppError('User not found', 404);
        }
        
        await DB_Operations.removeRefreshTokenDB({ email });
    }
}

  