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

    gameManager.on('durationExpired', ({winner, spectators}:{winner:Player; spectators:Player[]}) => {
        console.log('game over event received in ws.ts');
        winner.send(JSON.stringify({
            type: 'GAME_OVER',
            message: `You win because, ${winner.color === 'white' ? 'black' : 'white'} ran out of time`,
            newRating: winner.rating,
        }));
        winner.opponent.send(JSON.stringify({
            type: 'GAME_OVER',
            message: `You lose because, you ran out of time`,
            newRting: winner.opponent.rating,
        }));
        spectators.forEach((ws: globalThis.WebSocket) => {
            ws.send(JSON.stringify({
                type: 'GAME_OVER',
                message: `Game over, ${winner.color} wins because, ${winner.color === 'white' ? 'black' : 'white'} ran out of time`,
            }));
        });

    });
    
    return function startWebSocketServer({ server }: { server: Server }) {

        const webSocketServer = new WebSocketServer( { server } )
        
        console.log(`websocket listening on ${process.env.PORT}` );
        
        webSocketServer.on('connection', async function connection(ws: Player&WebSocket , req) {
            try {
                console.log('new ws connection: ');
                
                if (!req.headers.cookie) throw new AppError('no cookie found', 400);
    
                const cookies = parse(req.headers.cookie);
                
                const email = await authorization({ token: cookies.accessToken });
    
                ws.email = email;
                ws.rating = await gameManager.getRating(ws);
                
                const parameters = url.parse(req.url ?? '', true).query as {
                    role: 'PLAYER' | 'SPECTATOR',
                    opponent: 'HUMAN' | 'BOT',
                    color: 'white' | 'black' | 'random',
                    game_id: string,
                    name: string,
                    rank: string,
                };
                
                if(!parameters) throw new AppError('no query parameters found', 400);
                
                ws.role = parameters.role as 'PLAYER' | 'SPECTATOR';
                if(ws.role !== 'PLAYER' && ws.role !== "SPECTATOR")  throw new AppError('invalid role, role can be either Player or SPECTATOR', 400);
    
                ws.name = parameters.name;
                ws.rank = parseInt(parameters.rank);
    
                if (ws.role === 'PLAYER') {
                    ws.opponentType = parameters.opponent as 'HUMAN' | 'BOT' ;
                    ws.color = assignColor(parameters.color as 'white' | 'black' | 'random');
                    const results = await gameManager.createGame(ws as Player, 5*60*1000);
    
                    if (results.type === 'GAME_CREATED') {
    
                        ws.send(JSON.stringify({
                            type:         'CONNECTED',
                            opponentName: ws.opponent.name,
                            opponentRating: ws.opponent.rating,
                            game_id:      results.game_id,
                            pieceColor:   ws.color,
                            turn:         results.turn,
                            board:        results.board,
                            moves:        [],
                            role:         'PLAYER',
                            whiteTime:    results.whiteTime,
                            blackTime:    results.blackTime,
                        }))
                        results.opponent.send(JSON.stringify({
                            type:         'CONNECTED',
                            opponentName: ws.name,
                            opponentRating: ws.rating,
                            game_id:      results.game_id,
                            pieceColor:   results.opponent.color,
                            turn:         results.turn,
                            board:        results.board,
                            moves:        [],
                            role:         'PLAYER',
                            whiteTime:    results.whiteTime,
                            blackTime:    results.blackTime,
                        }))
                    };
                    if (results.type === 'WAITING') {
                        ws.send(JSON.stringify({
                            type: 'WAITING',
                            meassage: 'waiting for other player to join'
                        }))
                    };

                }else if (ws.role === 'SPECTATOR') {
                    ws.game_id = parameters.game_id as string;
                
                    const result = gameManager.spectateGame(ws);
                
                    const whitePlayer = result.players.find((player: Player) => player.color === 'white');
                    const blackPlayer = result.players.find((player: Player) => player.color === 'black');

                    const whitePlayerInfo = whitePlayer ? { name: whitePlayer.name, rating: whitePlayer.rating, turn: whitePlayer.turn, type: whitePlayer.type, time: whitePlayer.time } : null;
                    const blackPlayerInfo = blackPlayer ? { name: blackPlayer.name, rating: blackPlayer.rating, turn: blackPlayer.turn, type: blackPlayer.type, time: blackPlayer.time } : null;
                
                    if (result.type === 'SPECTATING') {
                        ws.send(JSON.stringify({
                            type: 'SPECTATE',
                            role: 'SPECTATOR',
                            board: result.board,
                            moves: result.moves,
                            turn: result.turn,
                            whitePlayer: whitePlayerInfo,
                            blackPlayer: blackPlayerInfo,
                        }));
                    
                
    
                        result.players.forEach((player: globalThis.WebSocket) => {
                            player.send(JSON.stringify({
                                type: 'SPECTATOR_JOINED',
                                name: ws.name,
                                rating: ws.rating,
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
            } catch (error) {
                if (error instanceof Error) {
                    ws.send(JSON.stringify({
                        type: 'ERROR',
                        error: error.message
                    }))
                }
                
            }

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
                    };
    
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
                            color: ws.color,
                            move,
                            board,
                            whiteTime,
                            blackTime,
                            turn,
                            check,
                            checkmate,
                            stalemate,
                            promotionChoices,
                            winner: winner ? winner.color : null,
                        }));
                        result.opponent.send(JSON.stringify({
                            type: 'OPPONENT_MOVE',
                            color: result.opponent.color,
                            move,
                            board,
                            whiteTime,
                            blackTime,
                            turn,
                            check,
                            checkmate,
                            stalemate,
                            winner: winner ? winner.color : null,
                        }));
                        result.spectators.forEach((ws: globalThis.WebSocket) => {
                            ws.send(JSON.stringify({
                                type: 'CURRENT_STATE',
                                move,
                                board,
                                whiteTime,
                                blackTime,
                                check, // need to implement in spectator mode
                                checkmate, // need to implement in spectator mode
                                stalemate,
                                turn,
                                winner: winner ? winner.color : null,
                            }))
                        });

                        if (winner || stalemate) {
                            const newRatingWhite = ws.color === 'white' ? ws.rating : ws.opponent.rating;
                            const newRatingBlack = ws.color === 'black' ? ws.rating : ws.opponent.rating;
                            result.spectators.forEach((spectator: globalThis.WebSocket) => {
                                spectator.send(JSON.stringify({
                                    type: 'GAME_OVER',
                                    message: winner ? `${winner.color} wins by checkmate` : 'stalemate',
                                    newRatingWhite,
                                    newRatingBlack,
                                }))
                            });
                            ws.send(JSON.stringify({
                                type: 'GAME_OVER',
                                message: winner ? 'You win by checkmate' : 'stalemate',
                                newRating: ws.rating,
                                newRatingOpponent: ws.opponent.rating,
                            }));
                            result.opponent.send(JSON.stringify({
                                type: 'GAME_OVER',
                                message: winner ? 'You lose by checkmate' : 'stalemate',
                                newRating: result.opponent.rating,
                                newRatingOpponent: ws.rating,
                            }));
                        }
                        return;
                    };
    
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
                            color: ws.color,
                            move,
                            board,
                            whiteTime,
                            blackTime,
                            turn,
                            check,
                            checkmate,
                            stalemate,
                            promotionChoices,
                            winner: winner ? winner.color : null,
                        }));
                        result.opponent.send(JSON.stringify({
                            type: 'OPPONENT_MOVE',
                            color: result.opponent.color,
                            move,
                            board,
                            whiteTime,
                            blackTime,
                            turn,
                            check,
                            checkmate,
                            stalemate,
                            winner: winner?.color,
                        }));
                        result.spectators.forEach((ws: globalThis.WebSocket) => {
                            ws.send(JSON.stringify({
                                type: 'CURRENT_STATE',
                                move,
                                board,
                                whiteTime,
                                blackTime,
                                check, // need to implement in spectator mode
                                checkmate, // need to implement in spectator mode
                                stalemate,
                                turn,
                                winner: winner?.color,
                            }))
                        });
                        
                        if (winner || stalemate) {
                            const newRatingWhite = ws.color === 'white' ? ws.rating : ws.opponent.rating;
                            const newRatingBlack = ws.color === 'black' ? ws.rating : ws.opponent.rating;
                            result.spectators.forEach((spectator: globalThis.WebSocket) => {
                                spectator.send(JSON.stringify({
                                    type: 'GAME_OVER',
                                    message: winner ? `${winner.color} wins by checkmate` : 'stalemate',
                                    newRatingWhite,
                                    newRatingBlack,
                                }))
                            });
                            ws.send(JSON.stringify({
                                type: 'GAME_OVER',
                                message: winner ? 'You win by checkmate' : 'stalemate',
                                newRating: ws.rating,
                                newRatingOpponent: ws.opponent.rating,
                            }));
                            result.opponent.send(JSON.stringify({
                                type: 'GAME_OVER',
                                message: winner ? 'You lose by checkmate' : 'stalemate',
                                newRating: result.opponent.rating,
                                newRatingOpponent: ws.rating,
                            }));
                        };
                        return;
                    };
    
                    if (json.type === MessageType.CURRENT_STATE) {
                        const result = gameManager.currentState({ player: ws });
                        ws.send(JSON.stringify({
                            type: 'CURRENT_STATE',
                            board: result.board,
                            turn:  result.turn,
                            whiteTime: result.whiteTime,
                            blackTime: result.blackTime,
                        }))
                        return
                    };
    
                    if (json.type === MessageType.QUIT_WAITING) {
                        await gameManager.leaveGame(ws);
                        return;
                    };
                    
                    if (json.type === MessageType.QUIT_GAME) {
                        if (ws.role !== 'PLAYER') throw new AppError('only players can quit game', 400);
                        
                        const {
                            spectators,
                            whiteTime,
                            blackTime,
                        } = await gameManager.leaveGame(ws);
                        
                        const newRatingWhite = ws.color === 'white' ? ws.rating : ws.opponent.rating;
                        const newRatingBlack = ws.color === 'black' ? ws.rating : ws.opponent.rating;

                        spectators.forEach((spectator: globalThis.WebSocket) => {
                            spectator.send(JSON.stringify({
                                type: 'GAME_OVER',
                                message: `${ws.opponent.color} wins because, ${ws.color} left the game`,
                                newRatingWhite,
                                newRatingBlack,
                                whiteTime,
                                blackTime,
                            }));
                        });
                        ws.send(JSON.stringify({
                            type: 'GAME_OVER',
                            message: `You lose because, you left the game`,
                            newRating: ws.rating,
                            newRatingOpponent: ws.opponent.rating,
                            true: null,
                            whiteTime,
                            blackTime,
                        }));
                        ws.opponent.send(JSON.stringify({
                            type: 'GAME_OVER',
                            message: `You win because, ${ws.color} left the game`,
                            newRating: ws.opponent.rating,
                            newRatingOpponent: ws.rating,
                            turn: null,
                            whiteTime,
                            blackTime,
                        }));
                        return
                    };
    
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
                    };
                    
                } catch (error) {
                    if (error instanceof Error) {
                        ws.send(JSON.stringify({
                            type: 'ERROR',
                            error: error.message
                        }));
                    };
                };
            });
            
            
            ws.on('close', async (code, reason) => {
                try {
                    console.log(`websocket Connection closed: ${code} - ${reason}`);
                    if (code === 1005) { //intentional close
                        return;
                    }
                    if (code === 1001) { //abrupt close
                        if (ws.role === 'PLAYER') {
                            
                            const {spectators} = await gameManager.leaveGame(ws);
                        
                            const newRatingWhite = ws.color === 'white' ? ws.rating : ws.opponent.rating;
                            const newRatingBlack = ws.color === 'black' ? ws.rating : ws.opponent.rating;

                            spectators.forEach((spectator: globalThis.WebSocket) => {
                                spectator.send(JSON.stringify({
                                    type: 'GAME_OVER',
                                    message: `${ws.opponent.color} wins because, ${ws.color} left the game`,
                                    newRatingWhite,
                                    newRatingBlack,
                                }));
                            });
                            ws.send(JSON.stringify({
                                type: 'GAME_OVER',
                                message: `You lose because, you left the game`,
                                newRating: ws.rating,
                                newRatingOpponent: ws.opponent.rating,
                            }));
                            ws.opponent.send(JSON.stringify({
                                type: 'GAME_OVER',
                                message: `You win because, ${ws.color} left the game`,
                                newRating: ws.opponent.rating,
                                newRatingOpponent: ws.rating,
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
                } catch (error) {
                    console.log('error message: ', (error as Error).message);
                    console.log('error stack: ', (error as Error).stack);
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
