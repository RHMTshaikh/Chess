import { DB_Operations, Move, Player } from '../../types';
import Game from '../Game/Game';
import AppError from '../../Errors/AppError';
import { EventEmitter } from 'events';
import { queueToDB } from '../../DBMS';

export default class GameManager extends EventEmitter {
    private games = new Map<string, Game>();
    private pendingUser: { white: Player[] , black: Player[] } = { white: [], black: [] };
    private DB_Operations: DB_Operations;
    private queueToDB: any;

    private static instance: GameManager | null = null;

    private constructor({DB_Operations}: {DB_Operations: DB_Operations }) {
        super();
        this.DB_Operations = DB_Operations;
        this.queueToDB = queueToDB;
    }

    public static getInstance({DB_Operations}: {DB_Operations: DB_Operations }): GameManager {
        if (!GameManager.instance) {
            GameManager.instance = new GameManager({DB_Operations});
        }
        return GameManager.instance;
    }
    
    private static opponentColor = (player: Player) => {
        return player.color === 'white' ? 'black' : 'white';
    }

    getRating = async (player: Player): Promise<number> =>  {
        return await this.DB_Operations.getRatingDB({email: player.email});
    }

    createGame = async (player: Player, duration: number ): Promise<{
        type: 'GAME_CREATED',
        game_id: string,
        turn: 'white' | 'black' |false,
        opponent: Player,
        board: number[][],
        whiteTime: number,
        blackTime: number,
        } | {
        type: 'ERROR',
        error: string,
        } | {
        type: 'WAITING',
        }> => {

        const opponentColor = GameManager.opponentColor(player);
        const waitingPlayer = this.pendingUser[opponentColor].shift();

        if (waitingPlayer) {
            waitingPlayer.opponent = player;
            player.opponent = waitingPlayer;

            const white_player_email = player.color === 'white' ? player.email : waitingPlayer.email;
            const black_player_email = player.color === 'black' ? player.email : waitingPlayer.email;
            
            const game_id = await this.DB_Operations.addNewGameDB({ white_player_email, black_player_email});
            
            player.game_id = game_id;
            waitingPlayer.game_id = game_id;

            const game = new Game(waitingPlayer, player, duration);

            game.on('durationExpired', ({winner, spectators}:{winner:Player; spectators:Player[]}) => {
                queueToDB.push({
                    operation: this.DB_Operations.endGameDB, 
                    parameters: [{game_id:winner.game_id, winner_email:winner.email}]
                });
                queueToDB.push({
                    operation: this.DB_Operations.updateRating, 
                    parameters: [{email: winner.email, rating: winner.rating}]
                });
                queueToDB.push({
                    operation: this.DB_Operations.updateRating, 
                    parameters: [{email: winner.opponent.email, rating: winner.opponent.rating}]
                });

                this.emit('durationExpired', {winner, spectators});

                game.cleanup();
                this.games.delete(game_id);
            });

            this.games.set(game_id, game);

            return {
                type: 'GAME_CREATED',
                game_id,
                turn: game.turn(),
                opponent: waitingPlayer as Player,
                board: game.currentState().board,
                whiteTime: game.getWhiteTime(),
                blackTime: game.getBlackTime(),
            }
        } else {
            this.pendingUser[player.color].push(player);
            console.log('waiting for other user to join');
            return {
                type: 'WAITING',
            }
        }
    }

    leaveGame = async (player:Player): Promise<{
        spectators: (WebSocket)[],
        whiteTime: number,
        blackTime: number,
        } > => {

        const index = this.pendingUser[player.color].indexOf(player);
        if (index !== -1) {
            this.pendingUser[player.color].splice(index, 1);
            return {
                spectators: [],
                whiteTime: 0,
                blackTime: 0,
            }            
        }

        if (!this.games.has(player.game_id)) throw new AppError('game not found', 404);

        const game = this.games.get(player.game_id)!;
        const spectators =  game.leaveGame(player);
        const whiteTime = game.getWhiteTime();
        const blackTime = game.getBlackTime();
        game.cleanup();
        

        queueToDB.push({
            operation: this.DB_Operations.endGameDB, 
            parameters: [{game_id:player.game_id, winner_email:player.opponent.email}]
        });
        queueToDB.push({
            operation: this.DB_Operations.updateRating, 
            parameters: [{email: player.email, rating: player.rating}]
        });
        queueToDB.push({
            operation: this.DB_Operations.updateRating, 
            parameters: [{email: player.opponent.email, rating: player.opponent.rating}]
        });
        
        this.games.delete(player.game_id)

        return {
            spectators,
            whiteTime,
            blackTime,
        }
    }

    pickPiece = (player: Player, position: string )=>{
        if (this.games.has(player.game_id)) {
            const game = this.games.get(player.game_id);
            const validMoves = game?.pickPiece(player, position);
            return {
                type: 'VALID_MOVES',
                validMoves,
            };
        } else{
            throw new AppError('game not found', 404);
        }
    }

    placePiece = async (player: Player, position: string ):Promise<{
        type: 'MOVE_PLACED',
        move: Move,
        board: number[][],
        opponent: Player,
        spectators: (WebSocket)[] ,
        whiteTime: number,
        blackTime: number,
        check: boolean,
        checkmate: boolean,
        stalemate: boolean,
        turn: 'white' | 'black' |false,
        winner: Player | null,
        promotionChoices?: null|number[],
        }>=>{
        
        if (!this.games.has(player.game_id)) throw new AppError('game not found', 404);
        
        const game = this.games.get(player.game_id)
        const {
            move,
            board,
            whiteTime,
            blackTime,
            check,
            checkmate,
            stalemate,
            turn,
            winner,
            promotionChoices,
        } = game!.placePiece(position)

        queueToDB.push({
            operation: this.DB_Operations.saveMoveDB, 
            parameters: [{game_id: player.game_id, move}]
        });
        
        if (checkmate || stalemate) {
            queueToDB.push({
                operation: this.DB_Operations.endGameDB, 
                parameters: [{game_id:player.game_id, winner_email:checkmate ? player.email : 'stalemate'}]
            });            
        }

        return {
            type: 'MOVE_PLACED',
            move,
            board,
            opponent: player.opponent,
            spectators: game?.getSpectators() as WebSocket[],
            whiteTime,
            blackTime,
            turn,
            check,
            checkmate,
            stalemate,
            winner,
            promotionChoices,
        }
    }
    
    promotePawn = async (player: Player, promotTo: number):Promise<{
        type: 'MOVE_PLACED',
        move: Move,
        board: number[][],
        opponent: Player,
        spectators: (WebSocket)[],
        whiteTime: number,
        blackTime: number,
        check: boolean,
        checkmate: boolean,
        stalemate: boolean,
        turn: 'white' | 'black' |false,
        winner: Player | null,
        promotionChoices?: null|number[],
        } >=> {
        
        if (!this.games.has(player.game_id)) throw new AppError('game not found', 404);
        
        const game = this.games.get(player.game_id)
        const {
            move,
            board,
            whiteTime,
            blackTime,
            check,
            checkmate,
            stalemate,
            turn,
            winner,
        } = game!.promotPawn(promotTo)

        queueToDB.push({
            operation: this.DB_Operations.saveMoveDB, 
            parameters: [{game_id: player.game_id, move}]
        });

        return {
            type: 'MOVE_PLACED',
            move,
            board,
            opponent: player.opponent,
            spectators: game?.getSpectators() as WebSocket[],
            whiteTime,
            blackTime,
            turn,
            check,
            checkmate,
            stalemate,
            winner
        }
    }

    currentState = ({player}:{player:Player})=>{
        if (!this.games.has(player.game_id)) throw new AppError('game not found', 404);
     
        const game = this.games.get(player.game_id)
        const result = game?.currentState()
        return {
            board: result?.board,
            turn: game?.turn(),
            whiteTime: result?.whiteTime,
            blackTime: result?.blackTime,
        }
    }

    returnGame = (game_id: string) =>{
        if (!this.games.has(game_id)) throw new AppError('game not found', 404);
        return this.games.get(game_id)
    }

    spectateGame = (spectator: Player&WebSocket):{
        type: 'SPECTATING',
        board: number[][],
        moves: Move[],
        players: Player[],
        spectatorCount: number,
        turn: 'white' | 'black' | false,
        } => {
        
        if (!this.games.has(spectator.game_id)) throw new AppError('game not found', 404);

        const game = this.games.get(spectator.game_id);
        game!.addSpectator(spectator);
        const spectatorCount = game!.spectatorCount();
        const players = game!.getPlayers();

        return {
            type: 'SPECTATING',
            board: game!.currentState().board,
            moves: game!.getMoves(),
            turn: game!.turn(),
            players,
            spectatorCount,
        }
    }

    removeSpectator = (spectator: Player&WebSocket):{
        type: 'STOP_SPECTATING',
        players: Player[],
        spectatorCount: number,
        } => {

        if (!this.games.has(spectator.game_id)) throw new AppError('game not found', 404);

        const game = this.games.get(spectator.game_id)
        game!.removeSpectator(spectator);
        const spectatorCount = game!.spectatorCount();
        const players = game!.getPlayers();
        return {
            type: 'STOP_SPECTATING',
            players,
            spectatorCount,
        }
    }
    
}