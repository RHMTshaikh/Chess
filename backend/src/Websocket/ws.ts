import WebSocket, { WebSocketServer } from 'ws';
import { parse } from 'cookie'
import { Server } from 'http';
import url from 'url';
import { authorization } from '../Use-Cases';

import { Player, MessageType } from '../types';
import AppError from '../Errors/AppError';
import GameManager from '../Core/Game-Manager/GameManager';

function assignColor(color: 'white' | 'black' | 'random') {
    if (color === 'random') {
        return Math.random() > 0.5 ? 'white' : 'black';
    }
    return color;
}


export default function makeWebSocketServer (gameManager: GameManager) {

    gameManager.on('durationExpired', async (winner:Player) => {
        console.log('game over event received in ws.ts');
        winner.send(JSON.stringify({
            type: 'GAME_OVER',
            message: `You win because, ${winner.color === 'white' ? 'black' : 'white'} ran out of time`,
        }))
        winner.opponent.send(JSON.stringify({
            type: 'GAME_OVER',
            message: `You lose because, you ran out of time`,
        }))
        
        // await gameManager.DB_Operations.endGameDB({game_id, winner_email});
    });
    
    return function startWebSocketServer({ server }: { server: Server }) {

        const webSocketServer = new WebSocketServer( { server } )
        
        console.log(`websocket listening on ${process.env.PORT}` );
        
        webSocketServer.on('connection', async function connection(ws: Player&WebSocket , req) {
            console.log('new ws connection: ');

            
            try {
                if (!req.headers.cookie) throw new AppError('no cookie found', 400);

                const cookies = parse(req.headers.cookie);
                
                const email = await authorization({ token: cookies.accessToken });

                ws.email = email;
                
                const parameters = url.parse(req.url ?? '', true).query as {
                    role: 'PLAYER' | 'SPECTATOR',
                    opponent: 'HUMAN' | 'BOT',
                    color: 'white' | 'black' | 'random',
                    game_id: string,
                };
                
                if(!parameters) throw new AppError('no query parameters found', 400);
                
                ws.role = parameters.role as 'PLAYER' | 'SPECTATOR';
                if(ws.role !== 'PLAYER' && ws.role !== "SPECTATOR")  throw new AppError('invalid role, role can be either Player or SPECTATOR', 400);

                if (ws.role === 'PLAYER') {
                    ws.opponentType = parameters.opponent as 'HUMAN' | 'BOT' ;
                    ws.color = assignColor(parameters.color as 'white' | 'black' | 'random');
                    const results = await gameManager.createGame(ws as Player, 30*60*1000);

                    if (results.type === 'GAME_CREATED') {

                        ws.send(JSON.stringify({
                            type:       'CONNECTED',
                            game_id:    results.game_id,
                            pieceColor: ws.color,
                            turn:       results.turn === ws.color,
                            board:      results.board,
                            moves:      [],
                            role:       'PLAYER',
                            whiteTime:  results.whiteTime,
                            blackTime:  results.blackTime,
                        }))
                        results.opponent.send(JSON.stringify({
                            type:       'CONNECTED',
                            game_id:    results.game_id,
                            pieceColor: results.opponent.color,
                            turn:       results.turn === results.opponent.color,
                            board:      results.board,
                            moves:      [],
                            role:       'PLAYER',
                            whiteTime:  results.whiteTime,
                            blackTime:  results.blackTime,
                        }))
                    }
                    if (results.type === 'WAITING') {
                        ws.send(JSON.stringify({
                            type: 'WAITING',
                            meassage: 'waiting for other player to join'
                        }))
                    }
                }else if(ws.role === 'SPECTATOR') {
                    ws.game_id = parameters.game_id as string;

                    const result = gameManager.spectateGame(ws);
                    
                    if (result.type === 'SPECTATING') {
                        ws.send(JSON.stringify({
                            type: 'SPECTATE',
                            role: 'SPECTATOR',
                            board: result.board,
                            moves: result.moves,
                            player1: result.players[0].email,
                            player2: result.players[1].email,
                        }))
    
                        result.players.forEach((player: globalThis.WebSocket) => {
                            player.send(JSON.stringify({
                                type: 'SPECTATOR_JOINED',
                                email: ws.email,
                                spectatorCount: result.spectatorCount,
                            }))
                        })
                    }
                } 

                console.log('email: ', ws.email);
                console.log('color: ', ws.color);
                console.log('opponentType: ', ws.opponentType);
                console.log('role: ', ws.role);
                console.log('game_id: ', ws.game_id);

                ws.on('message', async function incoming(data: WebSocket.Data) {
                    
                    try {
                        
                        let json: {
                            type: string, 
                            position: string,
                            piece: number,
                            email: string,
                            game_id: number,
                        } = JSON.parse(data.toString());
            
                        console.log('websocket message from client ', json);
        
                        if (json.type === MessageType.PICK) {
                            if (ws.role !== 'PLAYER') {
                                throw new AppError('only players can make move', 400);
                            }
                            const results = gameManager.pickPiece(ws, json.position);
                            ws.send(JSON.stringify({
                                type: 'VALID_MOVES',
                                validMoves: results.validMoves
                            }))
                            return			
                        }
        
                        if (json.type === MessageType.PLACE) {
                            if (ws.role !== 'PLAYER') throw new AppError('only players can make move', 400);
    
                            const result = await gameManager.placePiece(ws, json.position);

                            const {
                                move,
                                board,
                                whiteTime,
                                blackTime,
                                turn,
                                check,
                                checkmate,
                                stalemate,
                                promotionChoices,
                                winner
                            }  = result ;

                            ws.send(JSON.stringify({
                                type: 'CURRENT_STATE',
                                move,
                                board,
                                whiteTime,
                                blackTime,
                                turn: turn === ws.color,
                                check,
                                checkmate,
                                stalemate,
                                promotionChoices,
                                winner: winner?.color,
                            }));
                            result.opponent.send(JSON.stringify({
                                type: 'OPPONENT_MOVE',
                                move,
                                board,
                                whiteTime,
                                blackTime,
                                turn: turn === result.opponent.color,
                                check,
                                checkmate,
                                stalemate,
                                winner: winner?.color,
                            }));
                            result.spectators.forEach((ws: globalThis.WebSocket) => {
                                ws.send(JSON.stringify({
                                    type: 'MOVE',
                                    move,
                                    board,
                                    whiteTime,
                                    blackTime,
                                    check, // need to implement in spectator mode
                                    checkmate, // need to implement in spectator mode
                                    stalemate,
                                    turn: false,
                                    winner: winner?.color,
                                }))
                            })    
                            return;
                        }
        
                        if (json.type === MessageType.PROMOTE_TO) {
                            if (ws.role !== 'PLAYER') throw new AppError('only players can promote a pawn', 400);
                            
                            const result = await gameManager.promotePawn(ws, json.piece);

                            const {
                                move,
                                board,
                                whiteTime,
                                blackTime,
                                turn,
                                check,
                                checkmate,
                                stalemate,
                                promotionChoices,
                                winner
                            }  = result ;

                            ws.send(JSON.stringify({
                                type: 'CURRENT_STATE',
                                move,
                                board,
                                whiteTime,
                                blackTime,
                                turn: turn === ws.color,
                                check,
                                checkmate,
                                stalemate,
                                promotionChoices,
                                winner: winner?.color,
                            }));
                            result.opponent.send(JSON.stringify({
                                type: 'OPPONENT_MOVE',
                                move,
                                board,
                                whiteTime,
                                blackTime,
                                turn: turn === result.opponent.color,
                                check,
                                checkmate,
                                stalemate,
                                winner: winner?.color,
                            }));
                            result.spectators.forEach((ws: globalThis.WebSocket) => {
                                ws.send(JSON.stringify({
                                    type: 'MOVE',
                                    move,
                                    board,
                                    whiteTime,
                                    blackTime,
                                    check, // need to implement in spectator mode
                                    checkmate, // need to implement in spectator mode
                                    stalemate,
                                    turn: false,
                                    winner: winner?.color,
                                }))
                            })    
                            return;
                        }
        
                        if (json.type === MessageType.CURRENT_STATE) {
                            const board = gameManager.currentState({ player: ws });
                            ws.send(JSON.stringify({
                                type: 'CURRENT_STATE',
                                board,
                            }))
                            return
                        }
        
                        if (json.type === MessageType.QUIT_WAITING) {
                            gameManager.leaveGame(ws);
                            ws.send(JSON.stringify({
                                type: 'QUIT_WAITING',
                            }))
                            return
                        }
                        
                        if (json.type === MessageType.QUIT_GAME) {
                            if (ws.role !== 'PLAYER') throw new AppError('only players can quit game', 400);
    
                            const result = await gameManager.leaveGame(ws);
    
                            result.opponent.send(JSON.stringify({
                                type: 'OPPONENT_LEFT',
                                message: `${result.opponent.color} wins because, ${ws.color} left the game`,
                            }))
    
                            result.spectators.forEach((spectator: globalThis.WebSocket) => {
                                spectator.send(JSON.stringify({
                                    type: 'PLAYER_LEFT',
                                    message: `${result.opponent.color} wins because, ${ws.color} left the game`,
                                }))
                            })
                            return
                        }
        
                        if (json.type === MessageType.STOP_SPECTATING) {
                            if (ws.role !== 'SPECTATOR') throw new AppError('only spectators can stop spectate', 400);                            
    
                            const result = gameManager.removeSpectator(ws);
    
                            result.players.forEach((player: globalThis.WebSocket) => {
                                player.send(JSON.stringify({
                                    type: 'SPECATOR_LEFT',
                                    email: ws.email,
                                    spectatorCount: result.spectatorCount,
                                }))
                            })
                            return;
                        }           
                    } catch (error) {
                        if (error instanceof Error) {
                            ws.send(JSON.stringify({
                                type: 'ERROR',
                                error: error.message
                            }))
                        }
                    }
                        
                });
                
                
                ws.on('close', async (code, reason) => {
                    console.log(`websocket Connection closed: ${code} - ${reason}`);
                    if (code === 1005) { //intentional close
                        return;
                    }
                    if (code === 1001) { //abrupt close
                        if (ws.role === 'PLAYER') {
                            
                            const result = await gameManager.leaveGame(ws);
    
                            result.spectators.forEach((spectator: globalThis.WebSocket) => {
                                spectator.send(JSON.stringify({
                                    type: 'PLAYER_LEFT',
                                    message: `${result.opponent.color} wins because, ${ws.color} left the game`,
                                }))
                            })
                            result.opponent.send(JSON.stringify({
                                type: 'OPPONENT_LEFT',
                                message: `${result.opponent.color} wins because, ${ws.color} left the game`,
                            }))
        
                        }else if(ws.role === 'SPECTATOR') { 
                            const result = gameManager.removeSpectator(ws);
        
                            result.players.forEach((player: globalThis.WebSocket) => {
                                player.send(JSON.stringify({
                                    type: 'SPECATOR_LEFT',
                                    email: ws.email,
                                    spectatorCount: result.spectatorCount,
                                }))
                            })
                        }                    
                        return;
                    }
                });
    
                ws.on('error', (error) => {
                    console.error('websocket Connection error:', error);
                });
            } catch (error) {
                console.log('error message: ', (error as Error).message);
                console.log('error stack: ', (error as Error).stack);
                
                ws.send(JSON.stringify({
                    type: 'ERROR',
                    error: (error as Error).message
                }))
            }
    
        });

        webSocketServer.on('error', (error) => {
            console.error('WebSocket server error:', error);
        });
    }
}
