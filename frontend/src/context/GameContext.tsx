import { createContext, useReducer, useEffect, ReactNode, Dispatch } from "react";
import { Move } from "../types";

interface Game {
    board: number[][];
    moves: Move[];
    pieceColor?: string;
    role: 'PLAYER' | 'SPECTATOR';
    turn?: boolean;
    game_id: number;
}

interface GameState {
    game: Game | null;
}

type GameAction =
    | { type: 'START'; payload: { board: number[][], pieceColor: string, moves : Move[], turn:boolean, role: string, game_id: number,  }}   
    | { type: 'MOVE'; payload: { board:number[][], move:Move, turn:boolean }}
    | { type: 'SPECTATE'; payload: { board: number[][], moves : Move[], role: string, game_id: number,  }}   
    | { type: 'SET-BOARD'; payload: { board:number[][], }}
    | { type: 'END-GAME'; }
    | { type: 'FLIP-BOARD'; payload: { pieceColor: string } };

export interface GameContextType extends GameState {
    dispatch: Dispatch<GameAction>;
}

export const GameContext = createContext<GameContextType | undefined>(undefined);

export const gameReducer = (state: GameState, action: GameAction): GameState => {

    switch (action.type) {
        case 'START':
            return {
                game: {
                    board: action.payload.board,
                    pieceColor: action.payload.pieceColor,
                    moves: action.payload.moves,
                    turn: action.payload.turn,
                    role: action.payload.role as 'PLAYER' | 'SPECTATOR',
                    game_id: action.payload.game_id
                } 
            };
        case 'SPECTATE':
            return {
                game: {
                    board: action.payload.board,
                    // pieceColor: action.payload.pieceColor,
                    moves: action.payload.moves,
                    // turn: action.payload.turn,
                    role: action.payload.role as 'PLAYER' | 'SPECTATOR',
                    game_id: action.payload.game_id
                } 
            };
        case 'SET-BOARD':
            return {
                game: state.game ? {
                    ...state.game,
                    board: action.payload.board,
                } : state.game
            };
        case 'MOVE':
            return {
                game: state.game ? {
                    ...state.game,
                    moves: [...state.game.moves, action.payload.move],
                    board: action.payload.board,
                } : state.game
            };
        case 'FLIP-BOARD':
            return {
                game: state.game ? {
                    ...state.game,
                    pieceColor: action.payload.pieceColor,
                } : state.game
            };
        case 'END-GAME':
            return {
                game: null
            };
        default:
            return state;
    }
};

interface GameProviderProps {
    children: ReactNode;
}

export const GameContextProvider: React.FC<GameProviderProps> = ({ children }) => {
    const [state, dispatch] = useReducer(gameReducer, { game: null });
    
    useEffect(() => {
        console.log('useEffect');

        localStorage.setItem('gameState', JSON.stringify(state))
    }, [])

    console.log("GameContext state: ", state);
    localStorage.setItem('gameState', JSON.stringify(state))
    

    return (
        <GameContext.Provider value={{ ...state, dispatch }}>
            {children}
        </GameContext.Provider>
    );
};
