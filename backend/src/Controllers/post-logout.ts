import { HttpResponse } from "../types";

export default function makeLogOutUser({ logOut }: any) {
    return async function logOutUser(httpRequest: any): Promise<HttpResponse> {
        
        const accessToken = httpRequest.cookies.accessToken;
        
        await logOut({ accessToken });
        
        return {
            headers: {
                'Content-Type': 'application/json',
                'Set-Cookie': [
                    `accessToken=; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=0`,  // Remove access token cookie
                    `refreshToken=; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=0`, // Remove refresh token cookie
                ],
            },
            statusCode: 201,
        };
    };
};