import { DB_Operations } from '../types';

export default function makeListPublicGames ({ DB_Operations }:{DB_Operations: DB_Operations}) {
    return async function listPublicGames ({ limit}:{limit:number}): Promise<any> {

        const publicGamesList = await DB_Operations.publicGamesDB({ limit});

        const modifiedGamesList = publicGamesList.map((game : any) => ({
            game_id: game.game_id,
            white_player: game.white_player,
            black_player: game.black_player,
            moves: game.moves ? JSON.parse(game.moves).length : 0
        }));

        return modifiedGamesList;

        
        //  ---DO NOT DELETE THIS COMMENTED CODE---
        // Recursively nest the comments
        // If this gets slow introduce caching.
        // function nest (comments) {
        //     if (comments.length === 0) {
        //         return comments
        //     }
        //     return comments.reduce((nested, comment) => {
        //         comment.replies = comments.filter(
        //             reply => reply.replyToId === comment.id
        //         )
        //         nest(comment.replies)
        //         if (comment.replyToId == null) {
        //             nested.push(comment)
        //         }
        //         return nested
        //     }, [])
        // }
    }
}
  