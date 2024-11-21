import { HttpResponse } from "../types";

export default function makeRenewToken({ refreshToken }: any) {
    return async function renewToken(httpRequest: any): Promise<HttpResponse> {
        const cookies = httpRequest.cookies ;
        
        const { 
            newAccessToken,
            newRefreshToken,
            accessTokenMaxAge,
            refreshTokenMaxAge,
        } = await refreshToken({ token: cookies.refreshToken });
        
        return {
            headers: {
                'Set-Cookie': [
                    `accessToken=${newAccessToken}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=${accessTokenMaxAge}`, 
                    `refreshToken=${newRefreshToken}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=${refreshTokenMaxAge}`,
                ],
            },
            statusCode: 201,
        }
    };
};