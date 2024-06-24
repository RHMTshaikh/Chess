"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = __importStar(require("ws"));
const GameManager_1 = require("./GameManager");
const messages_1 = require("./messages");
const wss = new ws_1.WebSocketServer({ port: 8800 });
let games = [];
const gameManager = new GameManager_1.GameManager();
let pendingUser = null;
const initialBoard = [
    [1, 2, 3, 4, 5, 3, 2, 1],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [9, 9, 9, 9, 9, 9, 9, 9], // 9 means empty
    [9, 9, 9, 9, 9, 9, 9, 9],
    [9, 9, 9, 9, 9, 9, 9, 9],
    [9, 9, 9, 9, 9, 9, 9, 9],
    [10, 10, 10, 10, 10, 10, 10, 10],
    [11, 12, 13, 14, 15, 13, 12, 11],
];
wss.on('connection', function connection(ws) {
    if (pendingUser) {
        makeMatch(ws);
        ws.send(JSON.stringify({
            type: 'connected',
            board: initialBoard,
            pieceColor: 'black'
        }));
        ws.opponent.send(JSON.stringify({
            type: 'connected',
            board: initialBoard,
            pieceColor: 'white'
        }));
    }
    else {
        pendingUser = ws;
        console.log('waiting for other user to join');
        ws.send(JSON.stringify({ type: 'waiting' }));
    }
    ws.on('message', function incoming(data) {
        let json = JSON.parse(data.toString());
        if (json.type === messages_1.INIT_GAME) {
            console.log('in the game');
            return;
        }
        if (json.type === messages_1.PICK) {
            try {
                gameManager.pickPiece(ws, json.position);
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
                const move = gameManager.placePiece(ws, json.position);
                ws.opponent.send(JSON.stringify({
                    type: 'opponents-move',
                    move: move,
                    imgSrc: json.imgSrc
                }));
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
            const currentState = gameManager.currentState(ws);
            ws.send(JSON.stringify({
                type: 'current-state',
                board: currentState
            }));
            return;
        }
        ws.opponent.send(data.toString());
        console.log(data.toString());
    });
});
function sendToOpponent(player, message) {
    if (player.opponent && player.opponent.readyState === ws_1.default.OPEN) {
        player.opponent.send(message);
    }
}
function makeMatch(ws) {
    pendingUser.opponent = ws;
    ws.opponent = pendingUser;
    let gameId = games.length;
    ws.gameId = gameId;
    pendingUser.gameId = gameId;
    games[gameId] = { player1: pendingUser, player2: ws };
    pendingUser.turn = true; //white player
    ws.turn = false; // black player
    gameManager.startGame(pendingUser, ws);
    pendingUser = null;
}
console.log('WebSocket server is running on ws://localhost:8800');
//# sourceMappingURL=index.js.map