import { HttpResponse } from "../types";

export default function makeRenewToken({ refreshToken }: any) {
    return async function renewToken(httpRequest: any): Promise<HttpResponse> {
        const cookies = httpRequest.cookies ;
        
        const { 
            newAccessToken,
            newRefreshToken,
        } = await refreshToken({ token: cookies.refreshToken });
        
        return {
            headers: {
                'Set-Cookie': [
                    `accessToken=${newAccessToken}; HttpOnly; Secure; SameSite=None; Path=/;`, 
                    `refreshToken=${newRefreshToken}; HttpOnly; Secure; SameSite=None; Path=/;`,
                ],
            },
            statusCode: 201,
        }
    };
};