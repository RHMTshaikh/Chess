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
const readline = require('readline');
class Chess {
    constructor() {
        this.board = [
            [1, 2, 3, 4, 5, 3, 2, 1],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [9, 9, 9, 9, 9, 9, 9, 9], // 9 means empty
            [9, 9, 9, 9, 9, 9, 9, 9],
            [9, 9, 9, 9, 9, 9, 9, 9],
            [9, 9, 9, 9, 9, 9, 9, 9],
            [10, 10, 10, 10, 10, 10, 10, 10],
            [11, 12, 13, 14, 15, 13, 12, 11],
        ];
        this.whitesTurn = true;
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }
    printBoard() {
        for (let row of this.board) {
            console.log(row.join(' '));
        }
    }
    pieceAt(position) {
        return this.board[position.y][position.x];
    }
    itsTurn(piece) {
        return (this.whitesTurn === piece > 9) ? true : false;
    }
    inside(coordinate) {
        return (-1 < coordinate.x && coordinate.x < 8 && -1 < coordinate.y && coordinate.y < 8) ? true : false;
    }
    getSpan(piece) {
        const span = {
            0: [0, 0, 1, 0, 0, 0, 0, 0], //pawn
            10: [0, 0, 0, 0, 0, 0, 1, 0],
            1: [7, 0, 7, 0, 7, 0, 7, 0], //rook
            11: [7, 0, 7, 0, 7, 0, 7, 0],
            2: [1, 1, 1, 1, 1, 1, 1, 1], //knight
            12: [1, 1, 1, 1, 1, 1, 1, 1],
            3: [0, 7, 0, 7, 0, 7, 0, 7], //bishop
            13: [0, 7, 0, 7, 0, 7, 0, 7],
            4: [7, 7, 7, 7, 7, 7, 7, 7], //queen
            14: [7, 7, 7, 7, 7, 7, 7, 7],
            5: [1, 1, 1, 1, 1, 1, 1, 1], //king
            15: [1, 1, 1, 1, 1, 1, 1, 1]
        };
        return [...span[piece]];
    }
    direction(index) {
        const direction = {
            0: { x: 1, y: 0 },
            1: { x: 1, y: 1 },
            2: { x: 0, y: 1 },
            3: { x: -1, y: 1 },
            4: { x: -1, y: 0 },
            5: { x: -1, y: -1 },
            6: { x: 0, y: -1 },
            7: { x: 1, y: -1 }
        };
        return direction[index];
    }
    myTeam(position) {
        return (this.whitesTurn === this.pieceAt(position) > 9) ? true : false;
    }
    knightCorrection(direction) {
        const correction = {
            0: { x: 0, y: 1 },
            1: { x: -1, y: 0 },
            2: { x: -1, y: 0 },
            3: { x: 0, y: -1 },
            4: { x: 0, y: -1 },
            5: { x: 1, y: 0 },
            6: { x: 1, y: 0 },
            7: { x: 0, y: 1 }
        };
        return correction[direction];
    }
    validMovesPawn(from) {
        let piece = this.pieceAt(from);
        let validMoves = [];
        const homeRow = piece > 9 ? 6 : 1;
        const forward = piece > 9 ? -1 : 1;
        let x, y;
        x = from.x;
        y = from.y + forward;
        if (this.inside({ y, x }) && this.board[y][x] === 9) {
            validMoves.push({ y, x });
        }
        x = x - 1;
        if (this.inside({ y, x }) && this.pieceAt({ y, x }) != 9 && !this.myTeam({ y, x })) {
            validMoves.push({ y, x });
        }
        x += 2;
        if (this.inside({ y, x }) && this.pieceAt({ y, x }) != 9 && !this.myTeam({ y, x })) {
            validMoves.push({ y, x });
        }
        if (from.y === homeRow && this.board[y + forward][from.x] === 9) {
            validMoves.push({ y: y + forward, x: from.x });
        }
        return validMoves;
    }
    validMoves(from) {
        let piece = this.pieceAt(from);
        let validMoves = [];
        if (piece % 10 === 0) {
            validMoves = this.validMovesPawn(from);
        }
        else {
            let span = this.getSpan(piece);
            for (let i = 0; i < 8; i++) {
                let reach = span[i];
                for (let j = 1; j <= reach; j++) {
                    let direc = this.direction(i);
                    let x, y;
                    if (piece % 10 === 2) {
                        x = from.x + 2 * j * direc.x + this.knightCorrection(i).x;
                        y = from.y + 2 * j * direc.y + this.knightCorrection(i).y;
                    }
                    else {
                        x = from.x + j * direc.x;
                        y = from.y + j * direc.y;
                    }
                    if (this.inside({ y, x })) {
                        if (this.board[y][x] == 9) {
                            validMoves.push({ y, x });
                        }
                        else {
                            if (!this.myTeam({ y, x }))
                                validMoves.push({ y, x });
                            break;
                        }
                    }
                    else {
                        break;
                    }
                }
            }
        }
        return validMoves;
    }
    pick() {
        return new Promise((resolve) => {
            console.log(`It is ${this.whitesTurn ? 'White' : 'Black'}'s turn.`);
            this.rl.question('pick a piece: ', (input) => {
                const [fromY, fromX] = input.split(' ').map(Number);
                console.log('pick up position:', fromY, fromX);
                const from = { y: fromY, x: fromX };
                if (this.pieceAt(from) != 9) {
                    let piece = this.pieceAt(from);
                    if (this.itsTurn(piece)) {
                        const validMoves = this.validMoves(from);
                        resolve([validMoves, from]);
                    }
                    else {
                        console.log(`It is ${this.whitesTurn ? 'White' : 'Black'}'s turn.`);
                        resolve(null);
                    }
                }
                else {
                    console.log('the square is empty');
                    resolve(null);
                }
            });
        });
    }
    place(validMoves, from) {
        return new Promise((resolve, reject) => {
            console.log('from', from);
            console.log('validMoves', validMoves);
            this.rl.question('place in: ', (input) => {
                const [toY, toX] = input.split(' ').map(Number);
                console.log('placing at: ', toY, toX);
                const to = { y: toY, x: toX };
                if (validMoves.some(obj => obj.y === to.y && obj.x === to.x)) {
                    this.board[to.y][to.x] = this.pieceAt(from);
                    this.board[from.y][from.x] = 9;
                    this.whitesTurn = !this.whitesTurn;
                    resolve();
                }
                else {
                    reject(new Error('Invalid Move!'));
                }
            });
        });
    }
}
const chess = new Chess();
function promptMove() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let pickResult = yield chess.pick();
            while (!pickResult) {
                pickResult = yield chess.pick();
            }
            let movePlaced = false;
            while (!movePlaced) {
                try {
                    yield chess.place(...pickResult);
                    movePlaced = true;
                }
                catch (error) {
                    console.error(error.message);
                }
            }
            chess.printBoard();
        }
        catch (error) {
            console.error(error.message);
        }
        promptMove(); // Prompt for the next move
    });
}
promptMove();
//# sourceMappingURL=chess1.js.map