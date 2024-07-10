import { useContext } from "react";
import { AuthContext, AuthContextType } from "../context/AuthContext"; // Assuming AuthContextType is exported

export const useAuthContext = () => {
    const context = useContext<AuthContextType | undefined>(AuthContext);
    
    if (!context) {
        console.log('context');
        throw new Error('useAuthContext must be used inside an AuthContextProvider');
    }

    return context;
}
