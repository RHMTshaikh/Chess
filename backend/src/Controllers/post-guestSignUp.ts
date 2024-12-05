import { HttpResponse } from "../types";

export default function makeSignUpGuest({ signUp }: any) {
    return async function signUpGuest(httpRequest: any): Promise<HttpResponse> {
        
        const name = generateUserName(5);
        const email = generateUUID();
        const password = '';

        const { 
            name: userName,
            email: userEmail, 
            rank,
            accessToken, 
            refreshToken,
            accessTokenMaxAge,
            refreshTokenMaxAge,
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
            }
        }
    };
};

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
function generateUserName(length:number) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      result += characters[randomIndex];
    }
    return `guest#${result}`;
}