import { DB_Operations } from '../types';

export default function makeRetriveSingleUserGame ({ DB_Operations }:{DB_Operations: DB_Operations}) {
    return async function singleUserGame ({ game_id, email }:{game_id:number; email:string }): Promise<any> {
        
        const game = await DB_Operations.retriveGameDB({ game_id , email});

        return game;
    }
}