// Chess\backend\src\DataBaseLogic\dbLogic.ts

import mysql, { MysqlError } from 'mysql';
import { Game } from '../Game';

export interface UserType {
    email: string;
    name: string | null;
    password: string | null;
    rank: number | null;
}

let connection: mysql.Connection | null = null;

const connectDB = (): Promise<void> => {
    console.log('in connect db');
    
    return new Promise((resolve, reject) => {
        // if (connection === null) {
        //     console.log('null connection');
            
        //     connection = mysql.createConnection({
        //         host: 'sql12.freesqldatabase.com',
        //         user: 'sql12717511',
        //         password: 'vmA8XiNXec',
        //         database: 'sql12717511'
        //     });
        //     connection.connect((err: MysqlError) => {
        //         if (err) {
        //             console.error('Error connecting to MySQL:', err.stack);
        //             return reject(err);
        //         }
        //         console.log('Connected to MySQL as id', connection!.threadId);
        //         return resolve();
        //     });
        //     connection.on('error', (err: MysqlError) => {
        //         console.error('MySQL connection error:', err.stack);
        //         connection = null;
        //     });
        // } else {
        //     return resolve();
        // }

        
        
    });
};

export const publicGamesDB = async (): Promise<any> => {
    await connectDB();
    return new Promise<void>((resolve, reject) => {
        const query = `SELECT * FROM games WHERE over = FALSE ORDER BY game_id DESC LIMIT 50;`;
        
        connection!.query(query, (error, results) => {
            if (error) {
                return reject(error);
            }
            resolve(results);
        });
    });
};



export const gameOverDB = async (gameId: number, winner: string): Promise<any> => {
    await connectDB();
    return new Promise<void>((resolve, reject) => {
        const query = `UPDATE games SET winner = ?, over = TRUE WHERE game_id = ?;`
        
        connection!.query(query, [winner, gameId], (error, results) => {
            if (error) {
                return reject(error);
            }
            resolve(results);
        });
    });
};


export const userLoginDB = async ( email: string, password: string ): Promise<any> => {
    await connectDB();
    console.log('after connectdb');

    return new Promise((resolve, reject) => {
        // First, check if the user already exists
        connection!.query('SELECT * FROM users WHERE email = ?', [email], (error, results: UserType[]) => {
            if (error) {
                return reject(error);
            }
            if (results.length > 0) {
                if (password === results[0].password) {
                    return resolve({ 
                        message: 'user exists',
                        data: {
                            email: results[0].email,
                            name: results[0].name,
                            rank: results[0].rank 
                        }
                    });
                }else{
                    return reject({ message: 'wrong password' });
                }

            } else {
                reject({ message: 'user do not exist' })
            }
        });
    });
};
export const newUserLoginDB = async (email: string, password?: string, name?: string): Promise<any> => {
    await connectDB();
    console.log('after connectdb');

    return new Promise((resolve, reject) => {

        connection!.query('SELECT * FROM users WHERE email = ?', [email], (error, results: UserType[]) => {
            if (error) {
                return reject(error);
            }
            if (results.length > 0) {
                return reject({ message: 'user alredy exists' });
            } else {
                const user = { email, password, name };
                connection!.query('INSERT INTO users SET ?', user, (error, results) => {
                    if (error) {
                        return reject(error);
                    }
                    return resolve({ 
                        message: 'new user created',
                        data: {
                            email: results[0].email,
                            name: results[0].name,
                            rank: results[0].rank 
                        }
                    });
                });
            }
        });
    });
};



export async function nextGameId(): Promise<number> {
    await connectDB();
    return new Promise((resolve, reject) => {
        connection!.query(`SELECT COUNT(*) AS row_count FROM games;`, (error, results) => {
            if (error) {
                return reject(error);
            }
            return resolve(results[0].row_count + 1);
        });
    });
}


export async function createGameDB(game: Game): Promise<any> {
    await connectDB();

    return new Promise((resolve, reject) => {
        connection!.query(`INSERT INTO games (white_player, black_player) VALUES (?, ?);`, [game.whitePlayer.emailId, game.blackPlayer.emailId], (insertError) => {
            if (insertError) {
                return reject(insertError);
            }
            return resolve("game added into database");
        });
    });
}


export async function saveMoveDB(gameId: number, move: { from: string; to: string } | undefined, piece: string): Promise<any> {
    await connectDB();

    return new Promise((resolve, reject) => {
        // Fetch the current moves from the database
        connection!.query(`SELECT moves FROM games WHERE game_id = ?`, [gameId], (selectError, results) => {
            if (selectError) {
                return reject(selectError);
            }

            if (results.length === 0) {
                return reject(new Error('Game not found'));
            }

            const currentMoves = JSON.parse(results[0].moves || '[]');
            const newMove = { from: move?.from, to: move?.to, piece };

            // Append the new move
            currentMoves.push(newMove);

            // Update the moves in the database
            connection!.query(`UPDATE games SET moves = ? WHERE game_id = ?`, [JSON.stringify(currentMoves), gameId], (updateError) => {
                if (updateError) {
                    return reject(updateError);
                }
                return resolve("Move added to the database");
            });
        });
    });
}


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
    await connectDB();

    return new Promise((resolve, reject) => {
        const opponents: Opponent[] = [];

        connection!.query('SELECT * FROM games WHERE white_player = ? OR black_player = ? ORDER BY game_id DESC LIMIT 20', [email, email], (error, results: GameResult[]) => {
            if (error) {
                return reject(error);
            }

            results.forEach((element) => {
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

export async function insertUser(user: any): Promise<any> {
    await connectDB();

    return new Promise((resolve, reject) => {
        connection!.query('INSERT INTO users SET ?', user, (error, results) => {
            if (error) {
                return reject(error);
            }
            return resolve(results);
        });
    });
}