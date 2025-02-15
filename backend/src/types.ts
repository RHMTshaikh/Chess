import { Request, Response } from 'express';

export interface MethodConfig {
    method: 'GET' | 'POST' | 'DELETE' | 'PUT' | 'PATCH' | 'use'; // Add other HTTP methods as needed
    controller: (req: Request, res: Response, next: Function  ) => void;
}
export interface RouteConfig {
    route: string;
    routes?: RouteConfig[];
    methods?: MethodConfig[];
}
export interface HttpResponse {
    headers?: { [key: string]: string | string[] };
    statusCode: number;
    body?: any;
}
export enum DBMS_Provider {
    COCKROACH_DB = 'cockroach_db',
    MONGO_DB = 'mongo_db',
}
export interface StartHttpServerOptions {
    port: number;
    routesConfig?: RouteConfig;
}
export interface User {
    name: string;
    email: string;
    rank: number;
    rating: number;
}

export type PublicGamesDB = 
({ limit }: { limit: number }) 
=> Promise<any>;

export type MyGamesDB = 
({ limit, email }: { limit: number; email: string }) 
=> Promise<any>;

export type RetrieveGameDB = 
({ game_id, email }: { game_id: number; email: string }) 
=> Promise<any>;

export type AddUserDB = 
({ name, email, password, refresh_token, rating}: { name: string; email: string; password: string; refresh_token: string; rating: number }) 
=> Promise<User | null>;

export type FindUserByEmailDB = 
({ email }: { email: string }) 
=> Promise<(User & { password: string; refresh_token: string }) | null>;

export type SaveRefreshTokenDB = 
({ email, refreshToken }: { email: string; refreshToken: string }) 
=> Promise<any>;

export type RemoveRefreshTokenDB = 
({ email }: { email: string }) 
=> Promise<any>;

export type EndGameDB = 
({ game_id, winner_email }: { game_id: string; winner_email: string }) 
=> Promise<any>;

export type AddNewGameDB = 
({ white_player_email, black_player_email }: { white_player_email: string; black_player_email: string }) 
=> Promise<string>;

export type SaveMoveDB = 
({ game_id, move }: { game_id: string; move: Move }) 
=> Promise<any>;

export type getRatingDB =
({ email }: { email: string })
=> Promise<number>;

export type updateRating = 
({ email, rating }: { email: string; rating: number })
=> Promise<any>;

// Define the DB_Operations interface
export interface DB_Operations {
    publicGamesDB: PublicGamesDB;
    myGamesDB: MyGamesDB;
    retriveGameDB: RetrieveGameDB;
    addUserDB: AddUserDB;
    findUserByEmailDB: FindUserByEmailDB;
    saveRefreshTokenDB: SaveRefreshTokenDB;
    removeRefreshTokenDB: RemoveRefreshTokenDB;
    endGameDB: EndGameDB;
    addNewGameDB: AddNewGameDB;
    saveMoveDB: SaveMoveDB;
    getRatingDB: getRatingDB;
    updateRating: updateRating;
}

export interface DBQueueElement {
    operation: Function;
    parameters: any[];
}
export interface PublicGames {
    game_id: number;
    white_player: string;
    black_player: string;
    moves: number;
}
export interface GameResult {
    game_id: number;
    white_player: string;
    black_player: string;
    winner: string;
    moves: string;
};
export interface Opponent  {
    game_id: number;
    opponent_email: string;
    winner: string;
};
export interface Player extends WebSocket {
    name: string;
    rank: number;
    rating: number;
	turn: boolean ;
    type: 'HUMAN' | 'BOT' ;
    time: number;
    email: string ;
	game_id: string ;
	opponent: Player ;
    opponentType: 'HUMAN' | 'BOT' ;
    color: 'white' | 'black' ;
    role: 'PLAYER' | 'SPECTATOR' ;
}
export type PositionNotation = 
'a1' | 'a2' | 'a3' | 'a4' | 'a5' | 'a6' | 'a7' | 'a8' |
'b1' | 'b2' | 'b3' | 'b4' | 'b5' | 'b6' | 'b7' | 'b8' |
'c1' | 'c2' | 'c3' | 'c4' | 'c5' | 'c6' | 'c7' | 'c8' |
'd1' | 'd2' | 'd3' | 'd4' | 'd5' | 'd6' | 'd7' | 'd8' |
'e1' | 'e2' | 'e3' | 'e4' | 'e5' | 'e6' | 'e7' | 'e8' |
'f1' | 'f2' | 'f3' | 'f4' | 'f5' | 'f6' | 'f7' | 'f8' |
'g1' | 'g2' | 'g3' | 'g4' | 'g5' | 'g6' | 'g7' | 'g8' |
'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'h7' | 'h8' ;
export interface Position {
    y: number, //row
    x: number, //column
}
export interface Cell {
    piece: number,
    position: PositionNotation
}
export interface Move {
    from: Cell,
    to: Cell,
    promoteTo: number|null,
    castel: number|null,
}
export enum MessageType {
    INIT_GAME = "INIT_GAME",
    PICK = "PICK",
    PLACE = "PLACE",
    QUIT_GAME = "QUIT_GAME",
    QUIT_WAITING = "QUIT_WAITING",
    SPECTATE = "SPECTATE",
    CURRENT_STATE = "CURRENT_STATE",
    SPECTATE_GAME = "SPECTATE_GAME",
    STOP_SPECTATING = "STOP_SPECTATING",
    PROMOTE_TO = 'PROMOTE_TO',
}
