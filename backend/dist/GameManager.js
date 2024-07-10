"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.returnGame = exports.startWebSocketServer = void 0;
const ws_1 = require("ws");
const cookie_1 = require("cookie");
const messages_1 = require("./messages");
const Game_1 = require("./Game");
const dbLogic_1 = require("./DataBaseLogic/dbLogic");
const games = new Map();
let pendingUser = null;
const users = [];
let webSocketServer;
function startWebSocketServer() {
    webSocketServer = new ws_1.WebSocketServer({ port: 8800 });
    webSocketServer.on('connection', function connection(ws, req) {
        // Parse cookies from request headers
        if (req.headers.cookie) {
            const cookies = (0, cookie_1.parse)(req.headers.cookie);
            ws.emailId = cookies.email;
        }
        ws.on('message', function incoming(data) {
            return __awaiter(this, void 0, void 0, function* () {
                let json = JSON.parse(data.toString());
                console.log('websocket,gameManager: ', json);
                if (json.type === messages_1.PICK) {
                    try {
                        pickPiece(ws, json.position);
                    }
                    catch (error) {
                        if (error instanceof Error) {
                            console.log(error.message);
                            ws.send(JSON.stringify({
                                type: 'error',
                                error: error.message
                            }));
                        }
                    }
                    return;
                }
                if (json.type === messages_1.PLACE) {
                    try {
                        const { move, board } = placePiece(ws, json.position);
                        yield (0, dbLogic_1.saveMoveDB)(ws.gameId, move, json.piece);
                        ws.opponent.send(JSON.stringify({
                            type: 'opponents-move',
                            move,
                            board
                        }));
                        const game = games.get(ws.gameId);
                        game === null || game === void 0 ? void 0 : game.spectators.forEach((ws) => {
                            ws.send(JSON.stringify({
                                type: 'move',
                                move,
                                board
                            }));
                        });
                    }
                    catch (error) {
                        if (error instanceof Error) {
                            console.log(error.message);
                            ws.send(JSON.stringify({
                                type: 'error',
                                error: error.message
                            }));
                        }
                    }
                    return;
                }
                if (json.type === 'current-state') {
                    const game = games.get(ws.gameId);
                    ws.send(JSON.stringify({
                        type: 'current-state',
                        board: game === null || game === void 0 ? void 0 : game.currentState()
                    }));
                    return;
                }
                if (json.type === messages_1.INIT_GAME) {
                    yield createGame(ws);
                    return;
                }
                if (json.type === 'leave-game') {
                    yield (0, dbLogic_1.gameOverDB)(ws.gameId, ws.opponent.emailId);
                    const game = games.get(ws.gameId);
                    game === null || game === void 0 ? void 0 : game.spectators.forEach((websocket) => {
                        websocket.send(JSON.stringify({
                            type: 'game-ended',
                            winner: `${game.whitePlayer === ws ? 'black' : 'white'}`
                        }));
                    });
                    ws.opponent.send(JSON.stringify({
                        type: 'opponent-left',
                        winner: `${(game === null || game === void 0 ? void 0 : game.whitePlayer) === ws ? 'black' : 'white'}`
                    }));
                    games.delete(ws.gameId);
                    return;
                }
                if (json.type === 'spectate') {
                    const game = games.get(json.game_id);
                    game.spectators.push(ws);
                    ws.gameId = json.game_id;
                    ws.send(JSON.stringify({
                        type: 'spectate',
                        board: game.currentState(),
                        moves: game.moves,
                        pieceColor: 'white',
                        player1: game.whitePlayer.emailId, //white
                        player2: game.blackPlayer.emailId //black
                    }));
                    return;
                }
                if (json.type === 'stop-spectating') {
                    const game = games.get(ws.gameId);
                    game.spectators = game.spectators.filter(spectatorWs => spectatorWs !== ws);
                    return;
                }
                ws.opponent.send(data.toString());
            });
        });
    });
    console.log('WebSocket server is running on ws://localhost:8800');
}
exports.startWebSocketServer = startWebSocketServer;
const pickPiece = (player, position) => {
    if (player.turn) {
        const game = games.get(player.gameId);
        const validMoves = game === null || game === void 0 ? void 0 : game.pickPiece(position);
        player.send(JSON.stringify({
            type: 'valid-moves',
            validMoves: validMoves
        }));
    }
    else {
        throw new Error("its not your turn");
    }
};
const placePiece = (player, position) => {
    const game = games.get(player.gameId);
    const { move, board } = game.placePiece(position);
    return { move, board };
};
const currentState = (player) => {
    const game = games.get(player.gameId);
    const board = game === null || game === void 0 ? void 0 : game.currentState();
    return board;
};
const createGame = (ws) => __awaiter(void 0, void 0, void 0, function* () {
    if (pendingUser) {
        pendingUser.opponent = ws;
        ws.opponent = pendingUser;
        let gameId = yield (0, dbLogic_1.nextGameId)();
        ws.gameId = gameId;
        pendingUser.gameId = gameId;
        const game = new Game_1.Game(pendingUser, ws);
        yield (0, dbLogic_1.createGameDB)(game);
        games.set(gameId, game); //{whitePlayer: pendingUser as Player, blackPlayer: ws}
        pendingUser.turn = true; //white player
        ws.turn = false; // black player
        pendingUser = null;
    }
    else {
        pendingUser = ws;
        console.log('waiting for other user to join');
        ws.send(JSON.stringify({ type: 'waiting' }));
    }
});
const returnGame = (gameId) => {
    return games.get(gameId);
};
exports.returnGame = returnGame;
const addSpectator = (ws, game) => {
    game === null || game === void 0 ? void 0 : game.spectators.push(ws);
    ws.send;
};
//# sourceMappingURL=GameManager.js.map