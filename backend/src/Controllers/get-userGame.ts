import { HttpResponse } from "../types";

export default function makeGetUserGame({ retriveSingleUserGame }: any) {
    return async function getUserGame(httpRequest: any): Promise<HttpResponse> {
        
        const game_id = httpRequest.params.game_id;
        const email = httpRequest.email;

        const game = await retriveSingleUserGame({ game_id, email });

        return {
            headers: {
                'Content-Type': 'application/json',
            },
            statusCode: 201,
            body: {
                game
            }
        }
    };
};