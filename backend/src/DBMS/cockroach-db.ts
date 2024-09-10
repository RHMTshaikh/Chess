import { DB_Operations, User, PublicGames, Opponent, Move, } from '../types';
import { Pool, PoolClient, QueryResult } from 'pg';
import AppError from '../Errors/AppError';
 
let pool : Pool ;

async function startPoolConnection() {
    try {
        pool = new Pool({
            connectionString: process.env.CONNECTION_STRING,
            ssl: {
                rejectUnauthorized: false, 
            },
        });
    } catch (error) {
        throw new AppError('Failed to start pool connection', 500);
    }
}

async function makeNewClient(): Promise<PoolClient> {
    // await makePoolConnection(); // Await the connection to ensure it's established
    try {
        const client = await pool.connect(); // Attempt to get a new client from the pool
        return client;
    } catch (error) {
        throw new AppError('Failed to make new client', 500);
    }
}

const DB_Operations:DB_Operations = Object.freeze({
    publicGamesDB,
    myGamesDB,
    endGameDB,
    addNewGameDB,
    saveMoveDB,
    addUserDB,
    saveRefreshTokenDB,
    findUserByEmailDB,
    // countOfRowsInGameTableDB,
    removeRefreshTokenDB,
});

export { DB_Operations, startPoolConnection };

async function saveRefreshTokenDB({email, refreshToken }: { 
    email:string, 
    refreshToken: string 
    }): Promise<boolean> {
        
    const client = await makeNewClient();
    const query = `UPDATE users SET refresh_token = $1 WHERE email = $2;`;
    const values = [refreshToken, email];
    try {
        const results = await client.query(query, values);
        return true;
    } catch (error) {
        throw new AppError('Failed to save refresh token', 500);
    } finally {
        client.release();
    }
}

async function removeRefreshTokenDB({email }: { 
    email:string, 
    }): Promise<boolean> {

    const client = await makeNewClient();
    const query = `UPDATE users SET refresh_token = NULL WHERE email = $1;`;
    const values = [ email ];
    try {
        const results = await client.query(query, values);
        return true;
    } catch (error) {
        throw new AppError('Failed to remove refresh token', 500);
    } finally {
        client.release();
    }
}

// async function countOfRowsInGameTableDB() : Promise<number | null> {
//     const client = await makeNewClient();
//     const query = `SELECT COUNT(*) AS row_count FROM games;`;
//     const values:string[] = [];
//     try {
//         const results = await client.query(query, values);
//         return results.rows[0].row_count! ;

//     } catch (error) {
//         return null;

//     } finally {
//         client.release();
//     }
// }



async function publicGamesDB({ limit }:{limit:number}): Promise<PublicGames[] | Error> {
    const client = await makeNewClient();
    const query = `SELECT * FROM games WHERE over = FALSE ORDER BY game_id DESC LIMIT $1;`;
    const values = [limit];
    try {
        const results = await client.query(query, values);
        return results.rows;

    } catch (error) {
        throw new AppError('Failed to get public games', 500);
    } finally {
        client.release();
    }
};

async function myGamesDB({ limit, email }:{
    limit:number,
    email:string
    }): Promise<Opponent[] | Error> {

    const client = await makeNewClient();
    const opponents: Opponent[] = [];
    const query = `SELECT * FROM games WHERE white_player = $1 OR black_player = $2 ORDER BY game_id DESC LIMIT $3`;
    const values = [email, email, limit];
    try {
        const results = await client.query(query, values);

        results.rows.forEach((element) => {
            opponents.push({
                game_id: element.game_id,
                opponent_email: element.white_player === email ? element.black_player : element.white_player,
                winner: element.winner,
            });
        });

        return opponents;

    } catch (error) {
        throw new AppError('Failed to get my games', 500);
    } finally {
        client.release();
    }
}

async function endGameDB({game_id,winner_email,}: {
    game_id: string;
    winner_email: string;
    }): Promise<void> {

    const client = await makeNewClient();
    const query = `UPDATE games SET winner = $1, over = TRUE WHERE game_id = $2;`;
    const values = [winner_email, game_id];

    try {
        await client.query(query, values); 

    } catch (error) {
        throw new AppError('Failed to end game', 500);
    } finally {
        client.release(); 
    }
}

async function addUserDB({name,email,password,}: {
    name: string;
    email: string;
    password: string;
    }):Promise<( User & { password:string, refresh_token:string } ) | null>{

    const client = await makeNewClient();
    const query = `INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *;`;
    const values = [name, email, password];

    try {
        const result = await client.query(query, values);
        if (result.rows.length > 0) {
            const { email, name, rank, password, refresh_token } = result.rows[0];
            return { email, name, rank, password, refresh_token };
        } else {
            return null;
        }
    } catch (error) {
        throw new AppError('Failed to add user to db', 500);
    } finally {
        client.release();
    }
}

async function findUserByEmailDB({email}:{
    email: string
    }):Promise<( User & { password:string, refresh_token:string } ) | null> {

    const client = await makeNewClient();
    const query = 'SELECT * FROM users WHERE email = $1';
    const values = [email];

    try {
        const result = await client.query(query, values);
        if (result.rows.length > 0) {
            const { email, name, rank, password, refresh_token } = result.rows[0];
            return { email, name, rank, password, refresh_token };

        } else {
            return null;
        }
    } catch (error) {
        throw new AppError('Failed to find user by email', 500);
    } finally {
        client.release();
    }
}

async function addNewGameDB({white_player_email,black_player_email,}: {
    white_player_email: string;
    black_player_email: string;
    }): Promise<string> {

    const client = await makeNewClient();
    const query = `INSERT INTO games (white_player, black_player) VALUES ($1, $2) RETURNING game_id;`;
    const values = [white_player_email, black_player_email];

    try {
        const res = await client.query(query, values);
        const game_id = res.rows[0].game_id;
        console.log('added new game gameId:', game_id);
        return game_id.toString(); 
    } catch (error) {
        throw new AppError('Failed to add new game', 500);
    } finally {
        client.release();
    }
}


async function saveMoveDB({game_id, move}:{
    game_id: string,
    move: Move, 
    }): Promise<any> {

    const client = await makeNewClient();
    const query = `SELECT moves FROM games WHERE game_id = $1`;
    const values = [game_id];

    try {
        const result = await client.query(query, values);
        if (result.rows.length === 0) {
            throw new AppError('Game not found', 404);
        }
        const currentMoves = JSON.parse(result.rows[0].moves );
        // const newMove = { from: move?.from, to: move?.to, piece: move?.piece };

        currentMoves.push(move);

        const updateQuery = `UPDATE games SET moves = $1 WHERE game_id = $2`;
        const updateValues = [JSON.stringify(currentMoves), game_id];

        try {
            await client.query(updateQuery, updateValues);

        } catch (error) {
            throw new AppError('Failed to save move', 500);
        }
    } catch (error) {
        throw new AppError('Failed to save move', 500);        
    } finally {
        client.release();
    }
}