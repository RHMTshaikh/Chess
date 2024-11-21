import AppError from "../../Errors/AppError";

type Span = {
    [key: number]: number[];
}
interface Position {
    y: number, //row
    x: number, //column
}
interface Cell {
    piece: number,
    position: Position
}
interface Move {
    from: Cell,
    to: Cell,
    promoteTo: number | null
}

export default class Chess {
    private board = [
        [ 1,  2,  3,  4,  5,  3,  2,  1],
        [ 0,  0,  0,  0,  0,  0,  0,  0],
        [ 9,  9,  9,  9,  9,  9,  9,  9], // 9 means empty
        [ 9,  9,  9,  9,  9,  9,  9,  9],
        [ 9,  9,  9,  9,  9,  9,  9,  9],
        [ 9,  9,  9,  9,  9,  9,  9,  9],
        [10, 10, 10, 10, 10, 10, 10, 10],
        [11, 12, 13, 14, 15, 13, 12, 11],
    ]
    private whitesTurn = true
    private pickedPiecePosition: Position | null = null
    private validMovesArray: Position[] = []
    private black_king_position:Position = {y:0, x:4}
    private white_king_position:Position = {y:7, x:4}
    private check:boolean = false
    private checkmate:boolean = false
    private stalemate:boolean = false
    private promotingPawnDropPosition:Position | null = null
    private castelConditions = {
        white: {
            left: true,
            right: true
        },
        black: {
            left: true,
            right: true
        }
    }

    private printBoard() {
        for (let row of this.board) {
            console.log(row.join(' '));
        }
    }
    
    private pieceAt(position:Position):number {
        return this.board[position.y][position.x];
    }
    private itsTurn(piece:number ):boolean {
        return this.whitesTurn ? piece > 9 : piece < 9;
    }
    private inside(coordinate:Position):boolean {
        return (-1 < coordinate.x && coordinate.x < 8 && -1 < coordinate.y && coordinate.y < 8)? true : false              
    }
    private getSpan(piece:number):number[] {
        const span:Span = {
             0:[0,1,1,1,0,0,0,0],//pawn
            10:[0,0,0,0,0,1,1,1],

             1:[7,0,7,0,7,0,7,0],//rook
            11:[7,0,7,0,7,0,7,0],

             2:[1,1,1,1,1,1,1,1],//knight
            12:[1,1,1,1,1,1,1,1],

             3:[0,7,0,7,0,7,0,7],//bishop
            13:[0,7,0,7,0,7,0,7],

             4:[7,7,7,7,7,7,7,7],//queen
            14:[7,7,7,7,7,7,7,7],

             5:[1,1,1,1,1,1,1,1],//king
            15:[1,1,1,1,1,1,1,1]
        }
        return [...span[piece]]
    }
    private direction(index:number) {
        const direction:{ [key: number]: {[key:string]: number} } = {
            0:{x: 1, y: 0},
            1:{x: 1, y: 1},
            2:{x: 0, y: 1},
            3:{x:-1, y: 1},
            4:{x:-1, y: 0},
            5:{x:-1, y:-1},
            6:{x: 0, y:-1},
            7:{x: 1, y:-1}
        }      
        return direction[index]
    }
    private myTeam(position:Position): boolean {
        return this.whitesTurn ? this.pieceAt(position)>9 : this.pieceAt(position)<9;
    }
    private knightCorrection(direction:number):{[key:string]: number} {
        const correction:{ [key: number]: {[key:string]: number} } = {
            0:{x: 0, y: 1},
            1:{x:-1, y: 0},
            2:{x:-1, y: 0},
            3:{x: 0, y:-1},
            4:{x: 0, y:-1},
            5:{x: 1, y: 0},
            6:{x: 1, y: 0},
            7:{x: 0, y: 1}
        }      
        return correction[direction]
    }

    private no_legal_moves():boolean {
        if (this.whitesTurn) {
            for (let y = 7; y >= 0; y--) {
                for (let x = 7; x >= 0; x--) {
                    if (this.itsTurn(this.board[y][x])) {
                        this.validMoves({y,x})
                        if (this.validMovesArray.length > 0) {
                            return false
                        }
                    }
                }
            }
        } else {
            for (let y = 0; y < 8; y++) {
                for (let x = 0; x < 8; x++) {
                    if (this.itsTurn(this.board[y][x])) {
                        this.validMoves({y,x})
                        if (this.validMovesArray.length > 0) {
                            return false
                        }
                    }
                }
            }
        }
        return true;        
    }
    private is_check(move:Move):boolean {
        this.board[move.to.position.y][move.to.position.x] = move.from.piece
        this.board[move.from.position.y][move.from.position.x] = 9

        if (move.promoteTo) {
            this.board[move.to.position.y][move.to.position.x] = move.promoteTo;            
        }
        
        if (move.from.piece == 5) this.black_king_position = move.to.position;
        if (move.from.piece == 15) this.white_king_position = move.to.position;

        let king_position = this.whitesTurn ? this.white_king_position : this.black_king_position

        //check for knight
        for (let direction = 0; direction < 8; direction++) {
            let {x:direcX,y:direcY} = this.direction(direction);
            let x = king_position.x + 2*direcX + this.knightCorrection(direction).x;
            let y = king_position.y + 2*direcY + this.knightCorrection(direction).y;
            if (this.inside({y,x}) 
                && ( 
                this.whitesTurn 
                ? this.pieceAt({y,x}) == 2 
                : this.pieceAt({y,x}) == 12)) {
                    
                this.board[move.to.position.y][move.to.position.x] = move.to.piece
                this.board[move.from.position.y][move.from.position.x] = move.from.piece
                if (move.from.piece == 5) this.black_king_position = move.from.position;
                if (move.from.piece == 15) this.white_king_position = move.from.position;
                return true
            }
        }

        for (let direction = 0; direction < 8; direction++) {
            let {x:direcX,y:direcY} = this.direction(direction)
            let x = king_position.x
            let y = king_position.y
            for (let step = 1; step <= 7; step++) {
                x += direcX
                y += direcY
                if (this.inside({y,x})) {
                    if ( this.whitesTurn ? this.pieceAt({y,x}) > 9 : this.pieceAt({y,x}) < 9) {
                        break
                    } else if (this.pieceAt({y,x}) == 9) {
                        continue
                    } else {
                        let spanArray = this.getSpan(this.pieceAt({y,x}))
                        let span = spanArray[(direction+4)%8]
                        if(span>=step) {
                            this.board[move.to.position.y][move.to.position.x] = move.to.piece
                            this.board[move.from.position.y][move.from.position.x] = move.from.piece
                            if (move.from.piece == 5) this.black_king_position = move.from.position;
                            if (move.from.piece == 15) this.white_king_position = move.from.position;
                            return true
                        }
                    }
                } else {
                    break
                }
            }
        }
        this.board[move.to.position.y][move.to.position.x] = move.to.piece
        this.board[move.from.position.y][move.from.position.x] = move.from.piece
        if (move.from.piece == 5) this.black_king_position = move.from.position;
        if (move.from.piece == 15) this.white_king_position = move.from.position;
        return false
    }
    private validMovesPawn(from:Position):Position[] {
        let piece = this.pieceAt(from)
        const homeRow = piece>9? 6 : 1
        const forward = piece>9? -1 : 1
        
        let x,y
        x = from.x
        y = from.y+forward
        
        let move:Move = {
            from:{
                position: from,
                piece
            }, 
            to:{
                position:{y,x}, 
                piece: this.pieceAt({y,x})
            },
            promoteTo: null
        }
        if (this.inside({y,x}) && this.board[y][x]===9 && !this.is_check(move)) {
            this.validMovesArray.push({y,x});
            
            if (from.y===homeRow && this.board[y+forward][from.x]===9) {
                this.validMovesArray.push({y:y+forward, x:from.x});
            }
        }

        x = x-1
        move.to.position = {y,x}
        move.to.piece = this.pieceAt({y,x})
        if (this.inside({y,x}) && this.pieceAt({y,x})!=9 && !this.myTeam({y,x}) && !this.is_check(move)) {
            this.validMovesArray.push({y,x})
        }
        
        x+=2
        move.to.position = {y,x}
        move.to.piece = this.pieceAt({y,x})
        if (this.inside({y,x}) && this.pieceAt({y,x})!=9 && !this.myTeam({y,x}) && !this.is_check(move)) {
            this.validMovesArray.push({y,x})
        }
        
        return this.validMovesArray
    }

    private validMoves(from:Position) {
        let piece = this.pieceAt(from)
        this.validMovesArray = []
        
        if (piece%10===0) {
            this.validMovesArray = this.validMovesPawn(from)
        } else {
            let span = this.getSpan(piece)
            for (let i = 0; i < 8; i++) {
                let reach = span[i]
                let direc = this.direction(i)
                for (let j = 1; j <= reach; j++) {
                    let x,y
                    if (piece%10 === 2) {
                        x = from.x+ 2*j*direc.x + this.knightCorrection(i).x
                        y = from.y+ 2*j*direc.y + this.knightCorrection(i).y
                    } else {
                        x = from.x+ j*direc.x
                        y = from.y+ j*direc.y
                    }
                    if (this.inside({y,x}) && !this.myTeam({y,x})) {
                        let move:Move = {
                            from:{
                                position: from,
                                piece
                            }, 
                            to:{
                                position:{y,x}, 
                                piece: this.pieceAt({y,x})
                            },
                            promoteTo: null
                        };
                        if ( !this.is_check(move)) {
                            this.validMovesArray.push({y,x});
                        }
                        if (this.pieceAt({y,x}) != 9) {
                            break;
                        }
                    }else{
                        break;
                    }
                }                
            }
            if (piece%10 === 5) {
                const y = from.y
                const castelConditions = piece>9? this.castelConditions.white : this.castelConditions.black;
                if (castelConditions.left && this.pieceAt({y,x:1})===9 && this.pieceAt({y,x:2})===9 && this.pieceAt({y,x:3})===9) {
                    let move: Move = {
                        from:{
                            position: from,
                            piece
                        }, 
                        to:{
                            position:{y,x:2}, 
                            piece: this.pieceAt({y,x:2})
                        },
                        promoteTo: null
                    }
                    let threeCellsLeft = [
                        {y,x:4},
                        {y,x:3},
                        {y,x:2},
                    ]
                    if (threeCellsLeft.some(cell => this.is_check({from:move.from, to:{position:cell, piece:move.to.piece}, promoteTo:null}))) return;
                    
                    this.validMovesArray.push({y,x:2})
                };
                if (castelConditions.right && this.pieceAt({y,x:5})===9 && this.pieceAt({y,x:6})===9) {
                    let move:Move = {
                        from:{
                            position: from,
                            piece
                        }, 
                        to:{
                            position:{y,x:6}, 
                            piece: this.pieceAt({y,x:6})
                        },
                        promoteTo: null
                    };
                    let threeCellsRight = [
                        {y,x:4},
                        {y,x:5},
                        {y,x:6}
                    ];
                    if (threeCellsRight.some(cell => this.is_check({from:move.from, to:{position:cell, piece:move.to.piece}, promoteTo:null}))) return;
                    
                    this.validMovesArray.push({y,x:6})
                }
            }
        }
    }
    private updateCastelConditions(move:Move) {
        if (move.from.piece === 5) {
            this.castelConditions.black.left = false
            this.castelConditions.black.right = false
        }
        if (move.from.piece === 15) {
            this.castelConditions.white.left = false
            this.castelConditions.white.right = false
        }
        if (move.from.position.x === 0 && move.from.position.y === 0) {
            this.castelConditions.black.left = false
        }
        if (move.from.position.x === 7 && move.from.position.y === 0) {
            this.castelConditions.black.right = false
        }
        if (move.from.position.x === 0 && move.from.position.y === 7) {
            this.castelConditions.white.left = false
        }
        if (move.from.position.x === 7 && move.from.position.y === 7) {
            this.castelConditions.white.right = false
        }
    }

    pick(from: Position): Position[] {
        if (this.checkmate || this.stalemate) throw new AppError('game is over' ,400);

        if (this.pieceAt(from) == 9) throw new AppError('The square is empty', 400);

        let piece = this.pieceAt(from)
        
        if (!this.itsTurn(piece)) throw new AppError(`It is ${this.whitesTurn ? 'White' : 'Black'}'s turn.`, 400);

        this.pickedPiecePosition = from
        this.validMoves(from)
        return this.validMovesArray
    }

    place(to: Position): {
            move:Move, 
            turn:'white'|'black'|false, 
            check:boolean, 
            checkmate:boolean, 
            stalemate: boolean,
            promotionChoices:null|number[]

        } {

        if (this.checkmate || this.stalemate) throw new AppError('game is over' ,400);

        if (!this.pickedPiecePosition) throw new AppError('first pick a piece', 400);

        if (!this.validMovesArray.some(obj => obj.y === to.y && obj.x === to.x)) throw new AppError('Invalid Move!', 400);

        let piece = this.pieceAt(this.pickedPiecePosition!);
        const from = {
            position: this.pickedPiecePosition!,
            piece
        };

        const move: Move = { 
            from, 
            to:{ 
                position:to, 
                piece: this.pieceAt(to) 
            },
            promoteTo: null
        };

        
        if ((move.from.piece)%10===0 && (move.to.position.y)%7===0) {
            this.promotingPawnDropPosition = move.to.position;
            this.validMovesArray = [];
            this.board[to.y][to.x] = from.piece;
            this.board[from.position.y][from.position.x] = 9;
            return {
                move,
                turn: this.turn(),
                check:false,
                checkmate: false,
                stalemate: false,
                promotionChoices: this.whitesTurn ? [11,12,13,14] : [1, 2, 3, 4],
            };
        }
        
        this.whitesTurn = !this.whitesTurn;

        const check = this.is_check(move);

        this.board[to.y][to.x] = from.piece;
        this.board[from.position.y][from.position.x] = 9;
        
        const no_legal_moves = this.no_legal_moves();
        
        if (check) {
            if (no_legal_moves) {
                this.checkmate = true
            } else {
                this.check = true
            }
        } else {
            if (no_legal_moves) {
                this.stalemate = true
            }
        }
        
        if (from.piece == 5) this.black_king_position = to;
        if (from.piece == 15) this.white_king_position = to;
        
        if (from.piece%10 === 5) {
            if (to.x === 2) {
                this.board[to.y][3] = this.board[to.y][0];
                this.board[to.y][0] = 9;
            }else if (to.x === 6) {
                this.board[to.y][5] = this.board[to.y][7];
                this.board[to.y][7] = 9;
            }
        } else if(from.piece%10 === 0){
            if (to.y === 0 || to.y === 7) {
                this.promotingPawnDropPosition = to;
            }
        }
        this.updateCastelConditions(move);
        
        this.validMovesArray = [];
        this.pickedPiecePosition = null;
        
        // this.printBoard();
        return {
            move,
            turn: this.turn(),
            check,
            checkmate: this.checkmate,
            stalemate: this.stalemate,
            promotionChoices: null
        };
    }
    
    promotPawn(promoteTo: number): {
            move:Move, 
            turn:'white'|'black'|false, 
            check:boolean, 
            checkmate:boolean, 
            stalemate: boolean
        } {
        if (!this.pickedPiecePosition) throw new AppError('first pick a piece', 400);

        if (!this.promotingPawnDropPosition) throw new AppError('first place a pawn', 400);

        const from = {
            position: this.pickedPiecePosition,
            piece: this.pieceAt(this.pickedPiecePosition),
        }
        const to = {
            position: this.promotingPawnDropPosition,
            piece: this.pieceAt(this.promotingPawnDropPosition)
        }
        const move: Move = { from, to, promoteTo};
        
        this.whitesTurn = !this.whitesTurn;
        
        const check = this.is_check(move);
        const no_legal_moves = this.no_legal_moves();

        if (check) {
            if (no_legal_moves) {
                this.checkmate = true
            } else {
                this.check = true
            }
        } else {
            if (no_legal_moves) {
                this.stalemate = true
            }
        }
        
        if (this.promotingPawnDropPosition.y === 0) {
            this.board[this.promotingPawnDropPosition.y][this.promotingPawnDropPosition.x] = promoteTo%10 + 10;
        } else {
            this.board[this.promotingPawnDropPosition.y][this.promotingPawnDropPosition.x] = promoteTo%10;
        }
        this.board[this.pickedPiecePosition.y][this.pickedPiecePosition.x] = 9;

        this.validMovesArray = [];
        this.pickedPiecePosition = null;
        this.promotingPawnDropPosition = null;
        
        return {
            move,
            turn: this.turn(),
            check,
            checkmate: this.checkmate,
            stalemate: this.stalemate,
        };
    }

    currentBoard(){
        return JSON.parse(JSON.stringify(this.board));
    }

    turn(){
        if (this.checkmate) return false;
        if (this.stalemate) return false;
        return this.whitesTurn ? 'white' : 'black';
    }

    winner():string | null {
        if (this.checkmate) return this.whitesTurn ? 'black' : 'white';
        if(this.stalemate) return 'stalemate';
        return null;
    }
}