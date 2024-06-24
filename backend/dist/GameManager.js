"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameManager = void 0;
const messages_1 = require("./messages");
const Game_1 = require("./Game");
class GameManager {
    constructor() {
        this.games = new Map();
        this.pendingUser = null;
        this.users = [];
    }
    pickPiece(player, position) {
        if (player.turn) {
            const game = this.games.get(player.gameId);
            const validMoves = game === null || game === void 0 ? void 0 : game.pickPiece(position);
            player.send(JSON.stringify({
                type: 'valid-moves',
                validMoves: validMoves
            }));
        }
        else {
            throw new Error("its not your turn");
        }
    }
    placePiece(player, position) {
        const game = this.games.get(player.gameId);
        const move = game === null || game === void 0 ? void 0 : game.placePiece(position);
        return move;
    }
    currentState(player) {
        const game = this.games.get(player.gameId);
        const board = game === null || game === void 0 ? void 0 : game.currentState();
        return board;
    }
    startGame(player1, player2) {
        const game = new Game_1.Game(player1, player2); // player1 is always white
        this.games.set(player1.gameId, game);
    }
    makeMatch(player) {
        if (this.pendingUser) {
            // const game = new Game(this.pendingUser, player)
            this.pendingUser = null;
        }
        else {
            this.pendingUser = player;
            console.log('waiting for other player');
        }
    }
    makeMove(player, move) {
        var _a;
        console.log(player.gameId);
        const game = this.games.get(player.gameId);
        (_a = player.opponent) === null || _a === void 0 ? void 0 : _a.send(move);
    }
    addUser(socket) {
        this.users.push(socket);
        console.log('added');
    }
    removeUser(socket) {
        this.users = this.users.filter(user => user !== socket);
        console.log('removed');
    }
    addHandler(socket) {
        socket.on('message', (data) => {
            const message = JSON.parse(data.toString());
            if (message.type === messages_1.INIT_GAME) {
                if (this.pendingUser) {
                    // const game = new Game(this.pendingUser, socket)
                    // this.games.push(game)
                    this.pendingUser = null;
                }
                else {
                    this.pendingUser = socket;
                }
            }
            // if (message.type === MOVE) {
            //     const game = this.games.find(game => game.player1 === socket || game.player2 === socket)
            //     if (game) {
            //         game.makeMove(socket, message.move)
            //     }
            // }
        });
    }
}
exports.GameManager = GameManager;
//# sourceMappingURL=GameManager.js.map