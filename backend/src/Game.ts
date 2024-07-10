import { WebSocket } from "ws"
import { Chess } from "./ChessLogic/Chess"

interface Player extends WebSocket {
	emailId: string;
	gameId: number ;
	opponent: Player ;
	turn: boolean ;
}
type Move = {
    from: string,
    to: string,
    piece: number,
}
type Position = {
    y: number, //row
    x: number, //column
}

export class Game{
    whitePlayer: Player
    blackPlayer: Player
    spectators: WebSocket[]
    private chessGame: Chess
    moves: Move[]
    private startTime: Date

    static initiaBboard = [
        [ 1, 2, 3, 4, 5, 3, 2, 1],
        [ 0, 0, 0, 0, 0, 0, 0, 0],
        [ 9, 9, 9, 9, 9, 9, 9, 9], // 9 means empty
        [ 9, 9, 9, 9, 9, 9, 9, 9],
        [ 9, 9, 9, 9, 9, 9, 9, 9],
        [ 9, 9, 9, 9, 9, 9, 9, 9],
        [10,10,10,10,10,10,10,10],
        [11,12,13,14,15,13,12,11],
    ]
    
    constructor(whitePlayer: Player, blackPlayer: Player){
        this.whitePlayer = whitePlayer //whitePlayer is always white
        this.blackPlayer = blackPlayer
        this.chessGame = new Chess()
        this.spectators = []
        this.moves = []
        this.startTime = new Date()

        this.whitePlayer.send(JSON.stringify({
            type: 'connected',
            board: Game.initiaBboard,
            pieceColor: 'white',
            player1: whitePlayer.emailId,
            player2: blackPlayer.emailId
        }))
        this.blackPlayer.send(JSON.stringify({
            type: 'connected',
            board: Game.initiaBboard,
            pieceColor: 'black',
            player1: blackPlayer.emailId,
            player2: whitePlayer.emailId
        }))
    }
    private index(position: string):Position { // position: a3
        let x = position.charCodeAt(0) -'a'.charCodeAt(0)
        let y = '8'.charCodeAt(0) - position.charCodeAt(1)
        return {y,x}
    }
    private indexToNotation(position: Position): string {
        const letter = String.fromCharCode('a'.charCodeAt(0) + position.x);
        const number = (8 - position.y).toString();
        return letter + number;
    }
    currentState(){
        return this.chessGame.board
    }
    pickPiece(position: string): string[] {
        let index = this.index(position)
        
        const validMoves = this.chessGame.pick(index)
        return validMoves.map(element => this.indexToNotation(element))
    }

    placePiece(position: string):{move:Move, board:number[][]} {
        let index = this.index(position)
        
        const move = this.chessGame.place(index)
        
        this.whitePlayer.turn = !this.whitePlayer.turn
        this.blackPlayer.turn = !this.blackPlayer.turn
        
        this.moves.push({
            from: this.indexToNotation(move.from),
            to: this.indexToNotation(move.to),
            piece: move.piece
        })
        
        return { move:this.moves[this.moves.length-1], board: this.currentState()}
    }
}