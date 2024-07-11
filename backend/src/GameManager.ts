import WebSocket, { WebSocketServer } from 'ws';
import { parse } from 'cookie'

import { INIT_GAME, MOVE, PICK, PLACE } from "./messages"
import { Game } from "./Game"
import { createGameDB, gameOverDB, nextGameId, saveMoveDB } from "./DataBaseLogic/dbLogic"
interface Player extends WebSocket {
    emailId: string
	gameId: number ;
	opponent: Player ;
	turn: boolean ;
}

const games = new Map<number, Game>()
let pendingUser: WebSocket | null = null
const users: WebSocket[] = []

let webSocketServer:WebSocketServer;
export function startWebSocketServer(){
    webSocketServer = new WebSocketServer({port: 8800})

    webSocketServer.on('connection', function connection(ws: Player & WebSocket, req) {
        // Parse cookies from request headers
        if (req.headers.cookie) {
            const cookies = parse(req.headers.cookie);
            ws.emailId = cookies.email
        }

        ws.on('message', async function incoming(data: WebSocket.Data) {
            let json: {
                type: string, 
                position: string,
                piece: string,
                email: string,
                game_id: number,
            } = JSON.parse(data.toString());

            console.log('websocket,gameManager: ', json);
            
            if (json.type === PICK) {
                try {
                    pickPiece(ws, json.position)
                    
                } catch (error) {
                    if (error instanceof Error) {
                        console.log(error.message);
                        ws.send(JSON.stringify({
                            type: 'error',
                            error: error.message
                        }))
                    }
                }
                return			
            }
            if (json.type === PLACE) {
                try {
                    const result = placePiece(ws, json.position)
                    if (result) {
                        const {move, board} = result
                        await saveMoveDB(ws.gameId, move, json.piece)
                        ws.opponent.send(JSON.stringify({
                            type: 'opponents-move',
                            move,
                            board
                        }))
                        if (games.has(ws.gameId)) {
                            const game = games.get(ws.gameId)
                            game?.spectators.forEach((ws:WebSocket) =>{
                                ws.send(JSON.stringify({
                                    type: 'move',
                                    move,
                                    board
                                }))
                            })
                        }
                    }
                } catch (error) {
                    if (error instanceof Error) {
                        console.log(error.message);
                        ws.send(JSON.stringify({
                            type: 'error',
                            error: error.message
                        }))
                    }
                }
                return
            }
            if (json.type === 'current-state') {
                if (games.has(ws.gameId)) {
                    const game = games.get(ws.gameId)
                    ws.send(JSON.stringify({
                        type: 'current-state',
                        board: game?.currentState()
                    }))
                }
                return
            }
            if (json.type === INIT_GAME) {
                await createGame(ws)
                return
            }
            if (json.type === 'leave-game') {
                await gameOverDB(ws.gameId, ws.opponent.emailId)
                if (games.has(ws.gameId)) {
                    const game = games.get(ws.gameId)
                    game?.spectators.forEach((websocket:WebSocket) =>{
                        websocket.send(JSON.stringify({
                            type: 'game-ended',
                            winner: `${game.whitePlayer === ws ? 'black' : 'white'}`
                        }))
                    })
                    ws.opponent.send(JSON.stringify({
                        type: 'opponent-left',
                        winner: `${game?.whitePlayer === ws ? 'black' : 'white'}`
                    }))
                }
                games.delete(ws.gameId)
                return
            }
            if (json.type === 'spectate') {
                const game = games.get(json.game_id) as Game
                game.spectators.push(ws)
                ws.gameId = json.game_id
                ws.send(JSON.stringify({
                    type: 'spectate',
                    board: game.currentState(),
                    moves: game.moves,
                    pieceColor: 'white',
                    player1: game.whitePlayer.emailId, //white
                    player2: game.blackPlayer.emailId  //black
                }))
                return
            }
            if (json.type === 'stop-spectating') {
                if (games.has(ws.gameId)) {
                    const game = games.get(ws.gameId) as Game;
                    game.spectators = game.spectators.filter(spectatorWs => spectatorWs !== ws);
                }
                return;
            }           
            ws.opponent.send(data.toString())
        });
    });
}

const pickPiece = (player: Player, position: string )=>{
    if (player.turn) {
        if (games.has(player.gameId)) {
            const game = games.get(player.gameId)
            const validMoves = game?.pickPiece(position)
            player.send(JSON.stringify({
                type: 'valid-moves',
                validMoves: validMoves
            }))
        }
    } else {
        throw new Error("its not your turn")            
    }
}
const placePiece = (player: Player, position: string )=>{
    if (games.has(player.gameId)) {
        const game = games.get(player.gameId)
        const {move, board} = game!.placePiece(position)
        return {move, board}
    }
}
const currentState = (player: Player)=>{
    if (games.has(player.gameId)) {
        const game = games.get(player.gameId)
        const board = game?.currentState()
        return board
    }
}
const createGame = async (ws: Player)=> {
    
    if (pendingUser) {
        
        (pendingUser as Player).opponent = ws;
        ws.opponent = pendingUser as Player;
    
        let gameId = await nextGameId();
        console.log('game id: ', gameId);
        
    
        ws.gameId = gameId;
        (pendingUser as Player).gameId = gameId;

        const game = new Game(pendingUser as Player, ws)

        await createGameDB(game, gameId)

        games.set(gameId, game ); //{whitePlayer: pendingUser as Player, blackPlayer: ws}
    
        (pendingUser as Player).turn = true //white player
        ws.turn = false // black player

        pendingUser = null;
        
    }else{
        pendingUser = ws
        console.log('waiting for other user to join');
        ws.send(JSON.stringify({type: 'waiting'}))
    }
}
export const returnGame = (gameId: number) =>{
    if (games.has(gameId)) {
        return games.get(gameId)
    }
}