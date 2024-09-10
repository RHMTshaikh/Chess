import { DB_Operations } from '../types';
import { verifyAccessToken } from '../Encrypter/jsonwebtoken';
import { JwtPayload } from 'jsonwebtoken';
import AppError from '../Errors/AppError';


export default function makeAuthorization ({ DB_Operations }:{DB_Operations: DB_Operations}) {
    return async function authorization ({ token }: { token: string }): Promise< string >{

        const decodedToken = verifyAccessToken(token) as JwtPayload;

        const email = decodedToken.email;

        const user = await DB_Operations.findUserByEmailDB({ email });
        if (!user) {
            throw new AppError('User not found', 404);
        }

        return email;
    }
}

  