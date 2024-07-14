// Chess\frontend\src\context\AuthContext.tsx

import { createContext, useReducer, useEffect, ReactNode, Dispatch } from "react";
import { useNavigate } from "react-router-dom";

interface User {
    email: string;
    name: string
    rank: string
}
interface AuthState {
    user: User | null;
}
type AuthAction =
    | { type: 'LOGIN'; payload: User }
    | { type: 'LOGOUT' };

export interface AuthContextType extends AuthState {
    dispatch: Dispatch<AuthAction>;
}
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

function clearCookies() {
    const cookies = document.cookie.split(';');

    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
    }
}

export const authReducer = (state: AuthState, action: AuthAction): AuthState => {

    switch (action.type) {
        case 'LOGIN':
            localStorage.setItem('user', JSON.stringify(action.payload));
            console.log(`email=${action.payload.email}; domain=${(new URL(process.env.REACT_APP_SERVER_URL!)).hostname}; path=/; SameSite=None; Secure`);
            document.cookie = `email=${action.payload.email}`;
            return { user: action.payload };
        case 'LOGOUT':
            localStorage.removeItem('user')
            localStorage.removeItem('gameState')
            clearCookies();
            return { user: null };
        default:
            return state;
    }
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthContextProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, { user: null });

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || 'null');

        if (user) {
            dispatch({ type: 'LOGIN', payload: user });
        }
    }, []);


    console.log("AuthContext state: ", state);

    return (
        <AuthContext.Provider value={{ ...state, dispatch }}>
            {children}
        </AuthContext.Provider>
    );
};
