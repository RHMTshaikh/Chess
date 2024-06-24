type Position = {
    y: number, //row
    x: number, //column
}
type Span = {
    [key: number]: number[];
}
type Move = {
    from: Position,
    to: Position 
}

export class Chess {
    board = [
        [ 1, 2, 3, 4, 5, 3, 2, 1],
        [ 0, 0, 0, 0, 0, 0, 0, 0],
        [ 9, 9, 9, 9, 9, 9, 9, 9], // 9 means empty
        [ 9, 9, 9, 9, 9, 9, 9, 9],
        [ 9, 9, 9, 9, 9, 9, 9, 9],
        [ 9, 9, 9, 9, 9, 9, 9, 9],
        [10,10,10,10,10,10,10,10],
        [11,12,13,14,15,13,12,11],
    ]
    whitesTurn = true
    pickedPiece: Position | null = null
    validMovesArray: Position[] = []

    printBoard() {
        for (let row of this.board) {
            console.log(row.join(' '));
        }
    }
    
    private pieceAt(position:Position):number {
        return this.board[position.y][position.x]
    }
    private itsTurn(piece:number ):boolean {
        return (this.whitesTurn === piece > 9) ? true : false
    }
    private inside(coordinate:Position):boolean {
        return (-1 < coordinate.x && coordinate.x < 8 && -1 < coordinate.y && coordinate.y < 8)? true : false              
    }
    private getSpan(piece:number):number[] {
        const span:Span = {
             0:[0,0,1,0,0,0,0,0],//pawn
            10:[0,0,0,0,0,0,1,0],

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
    private direction(index:number):{[key:string]: number} {
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
        return (this.whitesTurn === this.pieceAt(position)>9)? true : false
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
    private validMovesPawn(from:Position):Position[] {
        let piece = this.pieceAt(from)
        const homeRow = piece>9? 6 : 1
        const forward = piece>9? -1 : 1
        
        let x,y
        x = from.x
        y = from.y+forward
        if (this.inside({y,x}) && this.board[y][x]===9) {
            this.validMovesArray.push({y,x})
            if (from.y===homeRow && this.board[y+forward][from.x]===9) {
                this.validMovesArray.push({y:y+forward, x:from.x})
            }
        }
        x = x-1
        if (this.inside({y,x}) && this.pieceAt({y,x})!=9 && !this.myTeam({y,x})) {
            this.validMovesArray.push({y,x})
        }
        x+=2
        if (this.inside({y,x}) && this.pieceAt({y,x})!=9 && !this.myTeam({y,x})) {
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
                for (let j = 1; j <= reach; j++) {
                    let direc = this.direction(i)
                    let x,y
                    if (piece%10 === 2) {
                        x = from.x+ 2*j*direc.x + this.knightCorrection(i).x
                        y = from.y+ 2*j*direc.y + this.knightCorrection(i).y
                    } else {
                        x = from.x+ j*direc.x
                        y = from.y+ j*direc.y
                    }
                    if (this.inside({y,x}) ) {
                        if (this.board[y][x]==9) {
                            this.validMovesArray.push({y,x})
                        }else{
                            if ( !this.myTeam({y,x}) )  this.validMovesArray.push({y,x})
                            break
                        }
                    }else{
                        break
                    }
                }                
            }
        }
    }

    pick(from: Position): Position[] {

        if (this.pieceAt(from) != 9) {
            let piece = this.pieceAt(from)
            
            if (this.itsTurn(piece)) {
                this.pickedPiece = from
                this.validMoves(from)
                return this.validMovesArray
                
            } else {
                throw new Error(`It is ${this.whitesTurn ? 'White' : 'Black'}'s turn.`);
            }  
        } else {
            throw new Error('The square is empty');
        }
    }
    place(to: Position): Move {
        console.log('chess.ts:173',to);
        console.log('chess.ts:174',this.validMovesArray);
        
        if (this.pickedPiece) {
            if (this.validMovesArray.some(obj => obj.y === to.y && obj.x === to.x)) {
                const from = this.pickedPiece; // Store pickedPiece in a local variable

                this.board[to.y][to.x] = this.pieceAt(from);
                this.board[from.y][from.x] = 9;
                this.whitesTurn = !this.whitesTurn;

                this.validMovesArray = [];
                this.pickedPiece = null;
                const move: Move = { from, to };
                this.printBoard();
                return move;
            } else {
                throw new Error('Invalid Move!');
            }
        } else {
            throw new Error('first pick a piece');
        }
    }
}