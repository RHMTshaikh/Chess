import { HttpResponse } from "../types";

export default function makeGetUsersGames({ listUsersGames }: any) {
    return async function getUsersGames(httpRequest: any): Promise<HttpResponse> {
        const email = httpRequest.email;

        const games = await listUsersGames({ email, limit: 20 });

        return {
            headers: {
                'Content-Type': 'application/json',
            },
            statusCode: 201,
            body: {
                games
            }
        }
    };
};