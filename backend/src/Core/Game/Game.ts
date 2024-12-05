import Chess  from '../Chess-Game-Logic/Chess'
import { Player, Move, PositionNotation } from "../../types"
import { EventEmitter } from 'events';
import AppError from '../../Errors/AppError';
import { eloRating } from '../Entites/Rating/Rating';

export default class Game extends EventEmitter{
    private whitePlayer: Player;
    private blackPlayer: Player;
    private spectators: WebSocket[];
    private chessGame: Chess;
    private moves: Move[];
    private lastMoveTimestamp: number;
    private winner: Player | null = null;
    private timer: NodeJS.Timeout;
    
    constructor(player1: Player, player2: Player, duration: number ){
        super();
        if (player1.color === 'white'){
            this.whitePlayer = player1;
            this.blackPlayer = player2;
        } else {
            this.whitePlayer = player2;
            this.blackPlayer = player1;
        }
        
        this.whitePlayer.type = 'HUMAN';
        this.blackPlayer.type = 'HUMAN';
        
        this.chessGame = new Chess();
        this.whitePlayer.turn = this.chessGame.turn() === 'white';
        this.blackPlayer.turn = this.chessGame.turn() === 'black';
        this.spectators = [];
        this.moves = [];
        this.whitePlayer.time = duration;
        this.blackPlayer.time = duration;
        this.lastMoveTimestamp = Date.now();

        this.timer = setTimeout(() => {
            console.log('duration expired winner blackplayer');    
            this.winner = this.blackPlayer;
            this.updateRatings();        
            this.emit('durationExpired', {winner: this.blackPlayer, spectators: this.spectators});
        }, this.whitePlayer.time + 1000);
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
        return this.whitePlayer.time;
    }

    getBlackTime(){
        return this.blackPlayer.time;
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

    
    currentState(){
        
        const timeElapsed = Date.now() - this.lastMoveTimestamp;
        this.lastMoveTimestamp = Date.now();
        
        if (this.chessGame.turn() === 'white'){
            this.whitePlayer.time -= timeElapsed;

        } else if(this.chessGame.turn() === 'black'){
            this.blackPlayer.time -= timeElapsed;
        }
        
        return {
            board: this.chessGame.currentBoard(),
            whiteTime: this.whitePlayer.time,
            blackTime: this.blackPlayer.time,
            turn: this.chessGame.turn() as 'white' | 'black' | false,
            winner: this.winner,
        }
    }
    
    pickPiece(player:Player, position: string): string[] {
        if (player.color !== this.chessGame.turn()) throw new AppError('Not your turn', 400);

        let index = this.index(position);
        const validMoves = this.chessGame.pick(index);
        return validMoves.map((element: {y:number, x:number}) => this.indexToNotation(element));
    }

    placePiece(position: string):{
            move:Move,
            board:number[][]
            whiteTime: number,
            blackTime: number,
            check: boolean,
            checkmate: boolean,
            stalemate: boolean,
            turn: 'white' | 'black' | false,
            winner: Player | null,
            promotionChoices?: null|number[]
        } { 

            
        let index = this.index(position)
        
        const {
            move,
            turn,
            check,
            checkmate,
            stalemate,
            promotionChoices,
        } = this.chessGame.place(index);   
        
        if (!promotionChoices) {
            const timeElapsed = Date.now() - this.lastMoveTimestamp;
            this.lastMoveTimestamp = Date.now();

            if (this.chessGame.turn() === 'black'){

                this.whitePlayer.time -= timeElapsed;
                clearTimeout(this.timer);
                this.timer = setTimeout(() => {
                    console.log('duration expired winner whiteplayer');
                    this.winner = this.whitePlayer;
                    this.updateRatings();
                    this.emit('durationExpired', {winner: this.whitePlayer, spectators: this.spectators});
                }, this.blackPlayer.time + 1000);

            } else if(this.chessGame.turn() === 'white'){

                this.blackPlayer.time -= timeElapsed;
                clearTimeout(this.timer);
                this.timer = setTimeout(() => {
                    console.log('duration expired winner blackPlayer');
                    this.winner = this.blackPlayer;
                    this.updateRatings();
                    this.emit('durationExpired', {winner: this.blackPlayer, spectators: this.spectators});
                }, this.whitePlayer.time + 1000);
            }
        }

        const moveStringNotation: Move = {
            from: {
                position: this.indexToNotation(move.from.position),
                piece: move.from.piece
            },
            to: {
                position: this.indexToNotation(move.to.position),
                piece: move.to.piece
            },
            promoteTo: move.promoteTo
        }

        if (checkmate){
            this.winner = this.whitePlayer.turn ? this.blackPlayer : this.whitePlayer;
            this.whitePlayer.turn = false;
            this.blackPlayer.turn = false;
            this.updateRatings();
        }
        if (stalemate){
            this.whitePlayer.turn = false;
            this.blackPlayer.turn = false;  
            this.updateRatings();        
        }
        
        this.whitePlayer.turn = this.chessGame.turn() === 'white';
        this.blackPlayer.turn = !this.whitePlayer.turn;
        
        this.moves.push(moveStringNotation);
        
        return {
            move: moveStringNotation,
            board: this.chessGame.currentBoard(),
            whiteTime: this.whitePlayer.time,
            blackTime: this.blackPlayer.time,
            turn,
            check,
            checkmate,
            stalemate,
            winner:this.winner,
            promotionChoices
        }
    }

    promotPawn(promoteTo: number){
        const {
            move,
            turn,
            check,
            checkmate,
            stalemate,
        } = this.chessGame.promotPawn(promoteTo);

        const timeElapsed = Date.now(); - this.lastMoveTimestamp;
        this.lastMoveTimestamp = Date.now();

        if (this.chessGame.turn() === 'black'){

            this.whitePlayer.time -= timeElapsed;
            clearTimeout(this.timer);
            this.timer = setTimeout(() => {
                console.log('duration expired winner blackplayer');
                this.winner = this.whitePlayer;
                this.updateRatings();
                this.emit('durationExpired', {winner: this.whitePlayer, spectators: this.spectators});
            }, this.blackPlayer.time + 1000);
            
        } else if (this.chessGame.turn() === 'white'){

            this.blackPlayer.time -= timeElapsed;
            clearTimeout(this.timer);
            this.timer = setTimeout(() => {
                console.log('duration expired winner whiteplayer');
                this.winner = this.blackPlayer;
                this.updateRatings();
                this.emit('durationExpired', {winner: this.blackPlayer, spectators: this.spectators});
            }, this.whitePlayer.time + 1000);
        }

        const moveStringNotation: Move = {
            from: {
                position: this.indexToNotation(move.from.position),
                piece: move.from.piece
            },
            to: {
                position: this.indexToNotation(move.to.position),
                piece: move.to.piece
            },
            promoteTo: move.promoteTo
        }
        if (checkmate){
            this.winner = this.whitePlayer.turn ? this.blackPlayer : this.whitePlayer;
            this.whitePlayer.turn = false;
            this.blackPlayer.turn = false;
            this.updateRatings();
        }
        if (stalemate){
            this.whitePlayer.turn = false;
            this.blackPlayer.turn = false;          
            this.updateRatings();
        }

        this.whitePlayer.turn = this.chessGame.turn() === 'white';
        this.blackPlayer.turn = !this.whitePlayer.turn
        
        this.moves.push(moveStringNotation)

        return {
            move: moveStringNotation,
            board: this.chessGame.currentBoard(),
            whiteTime: this.whitePlayer.time,
            blackTime: this.blackPlayer.time,
            turn,
            check,
            checkmate,
            stalemate,
            winner:this.winner,
            promotionChoices: null
        }
    }

    turn(){
        return this.chessGame.turn() as 'white' | 'black' | false;
    }

    cleanup() {
        clearTimeout(this.timer);
        this.removeAllListeners(); 
    }

    updateRatings(){
        if (this.winner){
            if (this.winner.color === 'white'){
                eloRating(this.whitePlayer, this.blackPlayer, 1);
            } else if (this.winner.color === 'black'){
                eloRating(this.whitePlayer, this.blackPlayer, 0);
            } else {
                eloRating(this.whitePlayer, this.blackPlayer, 0.5);
            }
        }
    }

    leaveGame(player: Player){
        const timeElapsed = Date.now() - this.lastMoveTimestamp;
        this.lastMoveTimestamp = Date.now();
        
        if (this.chessGame.turn() === 'white'){
            this.whitePlayer.time -= timeElapsed;

        } else if(this.chessGame.turn() === 'black'){
            this.blackPlayer.time -= timeElapsed;
        }
        
        if (player === this.whitePlayer){
            this.winner = this.blackPlayer;
        } else if (player === this.blackPlayer){
            this.winner = this.whitePlayer;
        } else {
            throw new AppError('Player not in game', 400);
        }
        this.updateRatings();
        return this.spectators;
    }
}