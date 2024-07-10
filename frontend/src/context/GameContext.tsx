import { createContext, useReducer, useEffect, ReactNode, Dispatch } from "react";
// import { useAuthContext } from "../hooks/useAuthContext";

interface Move {
    from: string;
    to: string;
    piece: number;
}

interface Game {
    board: number[][];
    moves: Move[];
    pieceColor: string;
    player1: string;
    player2: string;
}

interface GameState {
    game: Game | null;
}

type GameAction =
    | { type: 'MOVE'; payload: { board:number[][], move:Move, }}
    | { type: 'START'; payload: { board: number[][], pieceColor: string, player1: string, player2:string }}
    | { type: 'SPECTATE'; payload: { board: number[][], pieceColor: string, moves:Move[], player1: string, player2:string }}
    | { type: 'SET-BOARD'; payload: { board:number[][], }}
    | { type: 'END-GAME'; }

export interface GameContextType extends GameState {
    dispatch: Dispatch<GameAction>;
}

export const GameContext = createContext<GameContextType | undefined>(undefined);

export const gameReducer = (state: GameState, action: GameAction): GameState => {

    switch (action.type) {
        case 'MOVE':
            return {
                game: state.game ? {
                    ...state.game,
                    moves: [...state.game.moves, action.payload.move],
                    board: action.payload.board,
                } : null
            };
        case 'START':
            return {
                game: {
                    board: action.payload.board,
                    pieceColor: action.payload.pieceColor,
                    moves: [],
                    player1: action.payload.player1,
                    player2: action.payload.player2 // opponent
                } 
            };
        case 'SET-BOARD':
            return {
                game: state.game ? {
                    ...state.game,
                    board: action.payload.board,
                } : state.game
            };
        case 'SPECTATE':
            return {
                game: {
                    board: action.payload.board,
                    moves: action.payload.moves,
                    pieceColor: action.payload.pieceColor,
                    player1: action.payload.player1,
                    player2: action.payload.player2 
                } 
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
