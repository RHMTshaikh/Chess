import { HttpResponse } from "../types";

export default function makeSignUpUser({ signUp }: any) {
    return async function signUpUser(httpRequest: any): Promise<HttpResponse> {
        const { name, email, password } = httpRequest.body

        const { 
            name: userName,
            email: userEmail, 
            rank, 
            rating,
            accessToken, 
            refreshToken,
        } = await signUp({ name, email, password });  

        return {
            headers: {
                'Content-Type': 'application/json',
                'Set-Cookie': [
                    `accessToken=${accessToken}; HttpOnly; Secure; SameSite=None; Path=/;`,  // Access token cookie
                    `refreshToken=${refreshToken}; HttpOnly; Secure; SameSite=None; Path=/;`, // Refresh token cookie
                ],
            },
            statusCode: 201,
            body: {
                name: userName,
                email: userEmail,
                rank,
                rating,
            }
        }
    };
};