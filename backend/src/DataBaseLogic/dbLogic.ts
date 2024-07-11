// Chess\backend\src\DataBaseLogic\dbLogic.ts

import { Pool, QueryResult } from 'pg';
import { Game } from '../Game';

let connection: Pool | null = null;

export function passConnection(conn: Pool) {
    connection = conn;
}

export const publicGamesDB = async (): Promise<any> => {
    return new Promise<any>((resolve, reject) => {
        const query = `SELECT * FROM games WHERE over = FALSE ORDER BY game_id DESC LIMIT 50;`;

        if (connection) {
            connection.query(query, (error, results) => {
                if (error) {
                    return reject(error);
                }
                resolve(results.rows);
            });
        } else {
            reject(new Error("Database connection is not established."));
        }
    });
};


type GameResult = {
    game_id: number;
    white_player: string;
    black_player: string;
    winner: string;
    moves: string;
};
type Opponent = {
    game_id: number;
    opponent_email: string;
    winner: string;
};
export async function myGamesDB(email: string): Promise<Opponent[]> {

    return new Promise((resolve, reject) => {
        const opponents: Opponent[] = [];

        connection!.query('SELECT * FROM games WHERE white_player = $1 OR black_player = $2 ORDER BY game_id DESC LIMIT 20', [email, email], (error, results) => {
            if (error) {
                return reject(error);
            }

            results.rows.forEach((element) => {
                opponents.push({
                    game_id: element.game_id,
                    opponent_email: element.white_player === email ? element.black_player : element.white_player,
                    winner: element.winner,
                });
            });
            return resolve(opponents);
        });
    });
}

export const gameOverDB = async (gameId: number, winner: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        const query = `UPDATE games SET winner = $1, over = TRUE WHERE game_id = $2;`
        
        connection!.query(query, [winner, gameId], (error, results) => {
            if (error) {
                return reject(error);
            }
            resolve(results);
        });
    });
};


export const userLoginDB = async ( email: string, password: string ): Promise<any> => {

    return new Promise((resolve, reject) => {
        // First, check if the user already exists
        if (connection) {
            connection.query('SELECT * FROM users WHERE email = $1', [email], (error, results) => {
                if (error) {
                    return reject(error);
                }
                if (results.rows.length > 0) {
                    if (password === results.rows[0].password) {
                        return resolve({ 
                            message: 'user exists',
                            data: {
                                email: results.rows[0].email,
                                name: results.rows[0].name,
                                rank: results.rows[0].rank 
                            }
                        });
                    }else{
                        return reject({ message: 'wrong password' });
                    }
    
                } else {
                    reject({ message: 'user do not exist' })
                }
            });
        }
    });
};

interface UserType {
    email: string;
    name: string | null;
    password: string | null;
    rank: number | null;
}

export const newUserLoginDB = async (email: string, password?: string, name?: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        if (connection) {
            connection.query('SELECT * FROM users WHERE email = $1', [email], (error, results) => {
                if (error) {
                    return reject(error);
                }
                if (results.rows.length > 0) {
                    return reject({ message: 'User already exists' });
                } else {
                    const query = 'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING *';
                    if (connection) {
                        connection.query(query, [email, password, name], (error, results) => {
                            if (error) {
                                return reject(error);
                            }
                            return resolve({
                                message: 'New user created',
                                data: {
                                    email: results.rows[0].email,
                                    name: results.rows[0].name,
                                    rank: results.rows[0].rank
                                }
                            });
                        });
                    }
                }
            });
        }
    });
};




export async function nextGameId(): Promise<number> {
    return new Promise((resolve, reject) => {
        connection!.query(`SELECT COUNT(*) AS row_count FROM games;`, (error, results) => {
            if (error) {
                return reject(error);
            }
            console.log('next game id');
            
            console.log(results);
            
            return resolve(results.rows[0].row_count! + 1);
        });
    });
}


export async function createGameDB(game: Game, game_id: number): Promise<any> {

    return new Promise((resolve, reject) => {
        if (connection) {
            connection.query(`INSERT INTO games (game_id, white_player, black_player) VALUES ($1, $2, $3);`, [game_id, game.whitePlayer.emailId, game.blackPlayer.emailId], (insertError) => {
                if (insertError) {
                    return reject(insertError);
                }
                return resolve("game added into database");
            });
        }
    });
}


export async function saveMoveDB(gameId: number, move: { from: string; to: string } | undefined, piece: string): Promise<any> {

    return new Promise((resolve, reject) => {
        // Fetch the current moves from the database
        connection!.query(`SELECT moves FROM games WHERE game_id = $1`, [gameId], (selectError, results) => {
            if (selectError) {
                return reject(selectError);
            }

            if (results.rows.length === 0) {
                return reject(new Error('Game not found'));
            }

            const currentMoves = JSON.parse(results.rows[0].moves || '[]');
            const newMove = { from: move?.from, to: move?.to, piece };

            // Append the new move
            currentMoves.push(newMove);

            // Update the moves in the database
            connection!.query(`UPDATE games SET moves = $1 WHERE game_id = $2`, [JSON.stringify(currentMoves), gameId], (updateError) => {
                if (updateError) {
                    return reject(updateError);
                }
                return resolve("Move added to the database");
            });
        });
    });
}


export async function insertUser(user: any): Promise<any> {

    return new Promise((resolve, reject) => {
        connection!.query('INSERT INTO users SET $1', user, (error, results) => {
            if (error) {
                return reject(error);
            }
            return resolve(results);
        });
    });
}