import Chess  from '../Chess-Game-Logic/Chess'
import { Player, Move, PositionNotation } from "../../types"
import { EventEmitter } from 'events';

export default class Game extends EventEmitter{
    private whitePlayer: Player;
    private blackPlayer: Player;
    private spectators: WebSocket[];
    private chessGame: Chess;
    private moves: Move[];
    private whiteTime: number;
    private blackTime: number;
    private lastMoveTimestamp: number;
    
    constructor(player1: Player, player2: Player, duration: number ){
        super();
        if (player1.color === 'white'){
            this.whitePlayer = player1;
            this.blackPlayer = player2;
        } else {
            this.whitePlayer = player2;
            this.blackPlayer = player1;
        }
        
        this.chessGame = new Chess();
        this.whitePlayer.turn = this.chessGame.turn() === 'white';
        this.blackPlayer.turn = this.chessGame.turn() === 'black';
        this.spectators = [];
        this.moves = [];
        this.whiteTime = duration;
        this.blackTime = duration;
        this.lastMoveTimestamp = Date.now();

        setTimeout(() => {
            const currentTime = Date.now();
            const timeElapsed = currentTime - this.lastMoveTimestamp;

            if (this.chessGame.turn() === 'white'){
                this.whiteTime -= timeElapsed;
            } else {
                this.blackTime -= timeElapsed;
            }

            let winner: Player | null = null;
            
            if (this.whiteTime <= 0) {
                winner = this.blackPlayer;
            } else if (this.blackTime <= 0) {
                winner = this.whitePlayer;
            }

            this.whitePlayer.turn = false;
            this.blackPlayer.turn = false;

            console.log('duration expired');            
            this.emit('durationExpired', winner);
        }, duration);
    }

    private index(position: string):{y:number, x:number} { // position: a3
        let x = position.charCodeAt(0) -'a'.charCodeAt(0)
        let y = '8'.charCodeAt(0) - position.charCodeAt(1)
        return {y,x}
    }
    private indexToNotation(position: {y:number, x:number}): PositionNotation {
        const letter = String.fromCharCode('a'.charCodeAt(0) + position.x);
        const number = (8 - position.y).toString();
        return (letter + number) as PositionNotation;
    }

    getWhiteTime(){
        return this.whiteTime;
    }

    getBlackTime(){
        return this.blackTime;
    }
    
    currentState(){
        return this.chessGame.currentBoard()
    }

    getSpectators(){
        return this.spectators;
    }

    getPlayers(){
        return [this.whitePlayer, this.blackPlayer]
    }

    getMoves(){
        return this.moves;
    }

    addSpectator(spectator: Player&WebSocket){ 
        this.spectators.push(spectator);
    }

    removeSpectator(spectator: Player&WebSocket){
        this.spectators = this.spectators.filter((spec:WebSocket) => spec !== spectator)
    }
    
    spectatorCount(){
        return this.spectators.length;
    }

    pickPiece(player:Player, position: string): string[] {
        if (player.color === this.chessGame.turn()){ 
            let index = this.index(position)
            try {
                const validMoves = this.chessGame.pick(index)
                return validMoves.map((element: {y:number, x:number}) => this.indexToNotation(element))
                
            } catch (error) {
                throw new Error((error as Error).message)
            }
            
        } else {
            throw new Error('Not your turn')
        }
    }

    placePiece(position: string):{
        move:Move,
        board:number[][]
        whiteTime: number,
        blackTime: number,
        turn: 'white' | 'black'} {

        let index = this.index(position)
        
        const {move, turn} = this.chessGame.place(index)

        const currentTime = Date.now();
        const timeElapsed = currentTime - this.lastMoveTimestamp;

        if (this.chessGame.turn() === 'white'){
            this.blackTime -= timeElapsed;
        } else {
            this.whiteTime -= timeElapsed;
        }

        if (this.whiteTime <= 0 || this.blackTime <= 0){
            this.whiteTime = 0;
            this.blackTime = 0;
            this.whitePlayer.turn = false;
            this.blackPlayer.turn = false;
        }
        
        this.whitePlayer.turn = this.chessGame.turn() === 'white';
        this.blackPlayer.turn = !this.whitePlayer.turn
        
        const moveStringNotation: Move = {
            from: {
                position: this.indexToNotation(move.from.position),
                piece: move.from.piece
            },
            to: {
                position: this.indexToNotation(move.to.position),
                piece: move.to.piece
            }
        }
        this.moves.push(moveStringNotation)
        return {
            move: moveStringNotation,
            board: this.chessGame.currentBoard(),
            whiteTime: this.whiteTime,
            blackTime: this.blackTime,
            turn,
        }
    }

    turn(){
        return this.chessGame.turn();
    }
}