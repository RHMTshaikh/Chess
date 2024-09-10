import { HttpResponse } from "../types";

export default function makeLoginUser({ logIn }: any) {
    return async function loginUser(httpRequest: any): Promise<HttpResponse> {
        const {  email, password } = httpRequest.body

        const { 
            name: userName,
            email: userEmail, 
            rank, 
            accessToken, 
            refreshToken,
            accessTokenMaxAge,
            refreshTokenMaxAge,
        } = await logIn({ email, password });

        return {
            headers: {
                'Content-Type': 'application/json',
                'Set-Cookie': [
                    `accessToken=${accessToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${accessTokenMaxAge}`,  // Access token cookie
                    `refreshToken=${refreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${refreshTokenMaxAge}`, // Refresh token cookie
                ],
            },
            statusCode: 201,
            body: {
                name: userName,
                email: userEmail,
                rank,
            }
        }
    };
};