import { DB_Operations } from '../types';

export default function makeListUsersGames ({ DB_Operations }:{DB_Operations: DB_Operations}) {
    return async function listUsersGames ({ limit, email}:{limit:number; email:string }): Promise<any> {

        const myGamesList = await DB_Operations.myGamesDB({ limit, email});

        return myGamesList;
    }
}