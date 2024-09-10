import WebSocket, { WebSocketServer } from 'ws';
import { parse } from 'cookie'
import { Server } from 'http';
import url from 'url';
import { authorization } from '../Use-Cases';

import { Player, MessageType, Move } from '../types';
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
                if (req.headers.cookie) {
                    const cookies = parse(req.headers.cookie);
                    
                    const email = await authorization({ token: cookies.accessToken });

                    ws.email = email;
                    
                    const parameters = url.parse(req.url ?? '', true).query as {
                        role: 'PLAYER' | 'SPECTATOR',
                        opponent: 'HUMAN' | 'BOT',
                        color: 'white' | 'black' | 'random',
                        game_id: string,
                    };

                    if(!parameters) {
                        throw new AppError('no query parameters found', 400);
                    }

                    ws.role = parameters.role as 'PLAYER' | 'SPECTATOR';

                    if (ws.role === 'PLAYER') {
                        ws.opponentType = parameters.opponent as 'HUMAN' | 'BOT' ;
                        ws.color = assignColor(parameters.color as 'white' | 'black' | 'random');
                        try {
                            const results = await gameManager.createGame(ws as Player, 30*60*1000);

                            if (results.type === 'ERROR') {
                                ws.send(JSON.stringify({
                                    type: 'ERROR',
                                    error: results.error
                                }))
                                return;
                            }

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
                                
                            } else if (results.type === 'WAITING') {
                                ws.send(JSON.stringify({
                                    type: 'WAITING',
                                    meassage: 'waiting for other player to join'
                                }))
                                
                            }
                        
                        } catch (error) {
                            if (error instanceof Error) {
                                ws.send(JSON.stringify({
                                    type: 'ERROR',
                                    error: error.message
                                }))
                            }
                        }
                    }else if(ws.role === 'SPECTATOR') {
                        ws.game_id = parameters.game_id as string;

                        try {
                            const result = gameManager.spectateGame(ws);
                            
                            if (result.type === 'ERROR') {
                                ws.send(JSON.stringify({
                                    type: 'ERROR',
                                    error: result.error
                                }))
                                return;
                            }
    
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
                        } catch (error) {
                            ws.send(JSON.stringify({
                                type: 'ERROR',
                                error: (error as Error).message
                            }))
                        }
                    } else {
                        throw new AppError('invalid role, role can be either Player or SPECTATOR', 400);
                    }

                    console.log('email: ', ws.email);
                    console.log('color: ', ws.color);
                    console.log('opponentType: ', ws.opponentType);
                    console.log('role: ', ws.role);
                    console.log('game_id: ', ws.game_id);

                } else {
                    throw new AppError('no cookie found', 400);
                }
                
            } catch (error) {
                ws.send(JSON.stringify({
                    type: 'ERROR',
                    error: (error as Error).message
                }))
            }
    
            ws.on('message', async function incoming(data: WebSocket.Data) {
                
                let json: {
                    type: string, 
                    position: string,
                    piece: string,
                    email: string,
                    game_id: number,
                } = JSON.parse(data.toString());
    
                console.log('websocket message from client ', json);

                if (json.type === MessageType.PICK) {
                    try {
                        if (ws.role !== 'PLAYER') {
                            throw new AppError('only players can make move', 400);
                        }
                        const results = gameManager.pickPiece(ws, json.position);
                        ws.send(JSON.stringify({
                            type: 'VALID_MOVES',
                            validMoves: results.validMoves
                        }))
                        
                    } catch (error) {
                        ws.send(JSON.stringify({
                            type: 'ERROR',
                            error: (error as Error).message
                        }))
                    }
                    return			
                }

                if (json.type === MessageType.PLACE) {
                    try {
                        if (ws.role !== 'PLAYER') {
                            throw new AppError('only players can make move', 400);
                        }
                        const result = await gameManager.placePiece(ws, json.position)

                        if (result.type === 'ERROR') {
                            ws.send(JSON.stringify({
                                type: 'ERROR',
                                error: result.error
                            }))
                            return;
                        }
                        const {move, board, whiteTime, blackTime, turn}  = result ;
                        
                        result.opponent.send(JSON.stringify({
                            type: 'OPPONENT_MOVE',
                            move,
                            board,
                            whiteTime,
                            blackTime,
                            turn: turn === result.opponent.color,
                        }))
                        result.spectators.forEach((ws: globalThis.WebSocket) => {
                            ws.send(JSON.stringify({
                                type: 'MOVE',
                                move,
                                board,
                                whiteTime,
                                blackTime,
                            }))
                        })
                    } catch (error) {
                        if (error instanceof Error) {
                            ws.send(JSON.stringify({
                                type: 'ERROR',
                                error: error.message,
                                board: gameManager.currentState({ player: ws }),
                            }))
                        }
                    }
                    return
                }

                if (json.type === MessageType.CURRENT_STATE) {
                    try {
                        const results = gameManager.currentState({ player: ws });
                        ws.send(JSON.stringify({
                            type: 'CURRENT_STATE',
                            board: results,
                        }))
                        
                    } catch (error) {
                        if (error instanceof Error) {
                            ws.send(JSON.stringify({
                                type: 'ERROR',
                                error: error.message
                            }))
                        }
                    }
                    return
                }

                if (json.type === MessageType.QUIT_WAITING) {
                    try {
                        gameManager.removePendingUser({ player: ws });
                        ws.send(JSON.stringify({
                            type: 'QUIT_WAITING',
                        }))
                        
                    } catch (error) {
                        if (error instanceof Error) {
                            ws.send(JSON.stringify({
                                type: 'ERROR',
                                error: error.message
                            }))
                        }
                    }
                    return
                }

                // if (json.type === MessageType.INIT_GAME) {
                //     try {
                //         if (ws.role !== 'PLAYER') {
                //             throw new AppError('only players can create a game', 400);
                //         }
                //         const results = await gameManager.createGame(ws as Player, 30*60*1000);

                //         if (results.type === 'ERROR') {
                //             ws.send(JSON.stringify({
                //                 type: 'ERROR',
                //                 error: results.error
                //             }))
                //             return;
                //         }

                //         if (results.type === 'GAME_CREATED') {

                //             ws.send(JSON.stringify({
                //                 type:       'CONNECTED',
                //                 game_id:    results.game_id,
                //                 pieceColor: ws.color,
                //                 turn:       results.turn === ws.color,
                //                 board:      results.board,
                //                 moves:      [],
                //                 role:       'PLAYER',
                //                 whiteTime:  results.whiteTime,
                //                 blackTime:  results.blackTime,
                //             }))
                //             results.opponent.send(JSON.stringify({
                //                 type:       'CONNECTED',
                //                 game_id:    results.game_id,
                //                 pieceColor: results.opponent.color,
                //                 turn:       results.turn === results.opponent.color,
                //                 board:      results.board,
                //                 moves:      [],
                //                 role:       'PLAYER',
                //                 whiteTime:  results.whiteTime,
                //                 blackTime:  results.blackTime,
                //             }))
                            
                //         } else if (results.type === 'WAITING') {
                //             ws.send(JSON.stringify({
                //                 type: 'WAITING',
                //                 meassage: 'waiting for other player to join'
                //             }))
                            
                //         }
                        
                //     } catch (error) {
                //         if (error instanceof Error) {
                //             ws.send(JSON.stringify({
                //                 type: 'ERROR',
                //                 error: error.message
                //             }))
                //         }
                //     }
                //     return
                // }

                if (json.type === MessageType.QUIT_GAME) {
                    try {
                        if (ws.role !== 'PLAYER') {
                            throw new AppError('only players can quit game', 400);
                        }
                        const result = await gameManager.leaveGame(ws);

                        if (result.type === 'ERROR') {
                            ws.send(JSON.stringify({
                                type: 'ERROR',
                                error: result.error
                            }))
                            return;
                        }

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
                        
                    } catch (error) {
                        if (error instanceof Error) {
                            ws.send(JSON.stringify({
                                type: 'ERROR',
                                error: error.message
                            }))
                        }
                    }
                    return
                }

                // if (json.type === MessageType.SPECTATE) {
                //     try {
                //         if (ws.role !== 'SPECTATOR') {
                //             throw new AppError('only spectators can spectate', 400);
                //         }
                //         const result = gameManager.spectateGame(ws);
                        
                //         if (result.type === 'ERROR') {
                //             ws.send(JSON.stringify({
                //                 type: 'ERROR',
                //                 error: result.error
                //             }))
                //             return;
                //         }

                //         ws.send(JSON.stringify({
                //             type: 'SPECTATE',
                //             role: 'SPECTATOR',
                //             board: result.board,
                //             moves: result.moves,
                //             player1: result.players[0].email,
                //             player2: result.players[1].email,
                //         }))
    
                //         result.players.forEach((player: globalThis.WebSocket) => {
                //             player.send(JSON.stringify({
                //                 type: 'SPECTATOR_JOINED',
                //                 email: ws.email,
                //                 spectatorCount: result.spectatorCount,
                //             }))
                //         })
                //     } catch (error) {
                //         ws.send(JSON.stringify({
                //             type: 'ERROR',
                //             error: (error as Error).message
                //         }))
                //     }
                //     return
                // }

                if (json.type === MessageType.STOP_SPECTATING) {
                    try {
                        if (ws.role !== 'SPECTATOR') {
                            throw new AppError('only spectators can stop spectate', 400);                            
                        }
                        const result = gameManager.removeSpectator(ws);

                        if (result.type === 'ERROR') {
                            ws.send(JSON.stringify({
                                type: 'ERROR',
                                error: result.error
                            }))
                            return;
                        }

                        result.players.forEach((player: globalThis.WebSocket) => {
                            player.send(JSON.stringify({
                                type: 'SPECATOR_LEFT',
                                email: ws.email,
                                spectatorCount: result.spectatorCount,
                            }))
                        })
                    } catch (error) {
                        ws.send(JSON.stringify({
                            type: 'ERROR',
                            error: (error as Error).message
                        }))                        
                    }
                    return;
                }           
            });  
            
            ws.on('close', async (code, reason) => {
                console.log(`websocket Connection closed: ${code} - ${reason}`);
                if (code === 1005) {//intentional close
                    return;
                }
                if (code === 1001) {//abrupt close
                    if (ws.role === 'PLAYER') {
                        if (gameManager.removePendingUser({ player: ws })) {
                            return;                            
                        }
                        const result = await gameManager.leaveGame(ws);

                        if (result.type === 'ERROR') {
                            ws.send(JSON.stringify({
                                type: 'ERROR',
                                error: result.error
                            }))
                            return;
                        }
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

                        if(result.type === 'ERROR') {
                            ws.send(JSON.stringify({
                                type: 'ERROR',
                                error: result.error
                            }))
                            return;
                        }
    
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
        });

        webSocketServer.on('error', (error) => {
            console.error('WebSocket server error:', error);
        });
    }
}
