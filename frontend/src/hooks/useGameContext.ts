import { useContext } from "react";
import { GameContext, GameContextType } from "../context/GameContext"; // Assuming AuthContextType is exported

export const useGameContext = () => {
    const context = useContext<GameContextType | undefined>(GameContext);

    if (!context) {
        throw new Error('useGameContext must be used inside an GameContextProvider');
    }

    return context;
}
