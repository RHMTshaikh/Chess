"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Game = void 0;
const Chess_1 = require("./ChessLogic/Chess");
class Game {
    constructor(whitePlayer, blackPlayer) {
        this.whitePlayer = whitePlayer; //whitePlayer is always white
        this.blackPlayer = blackPlayer;
        this.chessGame = new Chess_1.Chess();
        this.spectators = [];
        this.moves = [];
        this.startTime = new Date();
        this.whitePlayer.send(JSON.stringify({
            type: 'connected',
            board: Game.initiaBboard,
            pieceColor: 'white',
            player1: whitePlayer.emailId,
            player2: blackPlayer.emailId
        }));
        this.blackPlayer.send(JSON.stringify({
            type: 'connected',
            board: Game.initiaBboard,
            pieceColor: 'black',
            player1: blackPlayer.emailId,
            player2: whitePlayer.emailId
        }));
    }
    index(position) {
        let x = position.charCodeAt(0) - 'a'.charCodeAt(0);
        let y = '8'.charCodeAt(0) - position.charCodeAt(1);
        return { y, x };
    }
    indexToNotation(position) {
        const letter = String.fromCharCode('a'.charCodeAt(0) + position.x);
        const number = (8 - position.y).toString();
        return letter + number;
    }
    currentState() {
        return this.chessGame.board;
    }
    pickPiece(position) {
        let index = this.index(position);
        const validMoves = this.chessGame.pick(index);
        return validMoves.map(element => this.indexToNotation(element));
    }
    placePiece(position) {
        let index = this.index(position);
        const move = this.chessGame.place(index);
        this.whitePlayer.turn = !this.whitePlayer.turn;
        this.blackPlayer.turn = !this.blackPlayer.turn;
        this.moves.push({
            from: this.indexToNotation(move.from),
            to: this.indexToNotation(move.to),
            piece: move.piece
        });
        return { move: this.moves[this.moves.length - 1], board: this.currentState() };
    }
}
exports.Game = Game;
Game.initiaBboard = [
    [1, 2, 3, 4, 5, 3, 2, 1],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [9, 9, 9, 9, 9, 9, 9, 9], // 9 means empty
    [9, 9, 9, 9, 9, 9, 9, 9],
    [9, 9, 9, 9, 9, 9, 9, 9],
    [9, 9, 9, 9, 9, 9, 9, 9],
    [10, 10, 10, 10, 10, 10, 10, 10],
    [11, 12, 13, 14, 15, 13, 12, 11],
];
//# sourceMappingURL=Game.js.map