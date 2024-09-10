import { DB_Operations, Move, Player } from '../../types';
import Game from '../Game/Game';
import AppError from '../../Errors/AppError';
import { EventEmitter } from 'events';
// import { WebSocket } from 'ws';

export default class GameManager extends EventEmitter {
    private games = new Map<string, Game>();
    private pendingUser: { white: Player | null, black: Player | null } = { white: null, black: null };
    private DB_Operations: DB_Operations;

    private static instance: GameManager | null = null;

    private constructor({DB_Operations}: {DB_Operations: DB_Operations }) {
        super();
        this.DB_Operations = DB_Operations;
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

    createGame = async (player: Player, duration: number ): Promise<{
        type: 'GAME_CREATED',
        game_id: string,
        turn: string,
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
        if (this.pendingUser[opponentColor] !== null) {

            const waitingPlayer = this.pendingUser[opponentColor] ;
            
            this.pendingUser[opponentColor] = null;

            waitingPlayer.opponent = player;
            player.opponent = waitingPlayer;

            const white_player_email = player.color === 'white' ? player.email : waitingPlayer.email;
            const black_player_email = player.color === 'black' ? player.email : waitingPlayer.email;
            
            try {
            const game_id = await this.DB_Operations.addNewGameDB({ white_player_email, black_player_email});
            
            player.game_id = game_id;
            waitingPlayer.game_id = game_id;

            const game = new Game(waitingPlayer, player, duration);

            game.on('durationExpired', (winner : Player) => {
                console.log('duration expired in game manager');
                
                this.emit('durationExpired', winner);
            });

            this.games.set(game_id, game);

            return {
                type: 'GAME_CREATED',
                game_id,
                turn: game.turn(),
                opponent: waitingPlayer,
                board: game.currentState(),
                whiteTime: game.getWhiteTime(),
                blackTime: game.getBlackTime(),
            }
            
            } catch (error) {
                return {
                    type: 'ERROR',
                    error: (error as Error).message
                }
            }

        } else {
            this.pendingUser[player.color] = player;
            console.log('waiting for other user to join');
            return {
                type: 'WAITING',
            }
        }
    }

    leaveGame = async (player:Player): Promise<{
        type: 'GAME_CREATED',
        opponent: Player,
        spectators: (WebSocket)[],
        } | {
        type: 'ERROR',
        error: string,
        } > => {

        if (this.games.has(player.game_id)) {
            const game = this.games.get(player.game_id)
            const opponent = player.opponent;
            const spectators = game!.getSpectators();

            await this.DB_Operations.endGameDB({game_id:player.game_id, winner_email:player.opponent.email});

            this.games.delete(player.game_id)

            return {
                type: 'GAME_CREATED',
                opponent,
                spectators,
            }
        }else{
            return {
                type: 'ERROR',
                error: 'game not found'
            }
        }
    }

    pickPiece = (player: Player, position: string )=>{
        if (this.games.has(player.game_id)) {
            try {
                const game = this.games.get(player.game_id);
                const validMoves = game?.pickPiece(player, position);
                return {
                    type: 'VALID_MOVES',
                    validMoves,
                };
                
            } catch (error) {
                return {
                    type: 'ERROR',
                    message: (error as Error).message
                };             
            }
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
        turn: 'white' | 'black',
        } | {
        type: 'ERROR',
        error: string,
        }>=>{
        
        if (this.games.has(player.game_id)) {

            const game = this.games.get(player.game_id)
            const {move, board, whiteTime, blackTime, turn} = game!.placePiece(position)

            try {
                await this.DB_Operations.saveMoveDB({game_id: player.game_id, move})
    
                return {
                    type: 'MOVE_PLACED',
                    move,
                    board,
                    opponent: player.opponent,
                    spectators: game?.getSpectators() as WebSocket[],
                    whiteTime,
                    blackTime,
                    turn,
                }
            } catch (error) {
                return {
                    type: 'ERROR',
                    error: (error as Error).message
                }                
            }
        } else{
            return {
                type: 'ERROR',
                error: 'game not found'
            }
        }
    }

    currentState = ({player}:{player:Player})=>{
        
        if (this.games.has(player.game_id)) {
            const game = this.games.get(player.game_id)
            const board = game?.currentState()
            return board
        }else{
            return {
                type: 'ERROR',
                error: 'game not found'
            }
        }
    }

    returnGame = (game_id: string) =>{
        if (this.games.has(game_id)) {
            return this.games.get(game_id)
        }else{
            return {
                type: 'ERROR',
                error: 'game not found'
            }
        }
    }

    spectateGame = (spectator: Player&WebSocket):{
        type: 'SPECTATING',
        board: number[][],
        moves: Move[],
        players: Player[],
        spectatorCount: number,
        } | {
        type: 'ERROR',
        error: string,
        } => {
        
        if (this.games.has(spectator.game_id)) {
            const game = this.games.get(spectator.game_id)
            game!.addSpectator(spectator);
            const spectatorCount = game!.spectatorCount();
            const players = game!.getPlayers();

            return {
                type: 'SPECTATING',
                board: game!.currentState(),
                moves: game!.getMoves(),
                players,
                spectatorCount,
            }
        }else{
            return {
                type: 'ERROR',
                error: 'game not found'
            }
        }
    }

    removePendingUser = ({player}:{player: Player}) => {
        if (this.pendingUser.white?.email === player.email) {
            this.pendingUser.white = null;
            return true;
        } else if (this.pendingUser.black?.email === player.email) {
            this.pendingUser.black = null;
            return true;
        }
        return false;
    }

    removeSpectator = (spectator: Player&WebSocket):{
        type: 'STOP_SPECTATING',
        players: Player[],
        spectatorCount: number,
        } | {
        type: 'ERROR',
        error: string,
        } => {
        if (this.games.has(spectator.game_id)) {
            const game = this.games.get(spectator.game_id)
            game!.removeSpectator(spectator);
            const spectatorCount = game!.spectatorCount();
            const players = game!.getPlayers();
            return {
                type: 'STOP_SPECTATING',
                players,
                spectatorCount,
            }
        }else{
            return {
                type: 'ERROR',
                error: 'game not found'
            }
        }
    }    
}