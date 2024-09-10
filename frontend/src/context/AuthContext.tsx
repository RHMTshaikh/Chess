import { createContext, useReducer, useEffect, ReactNode, Dispatch } from "react";

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

export const authReducer = (state: AuthState, action: AuthAction): AuthState => {

    switch (action.type) {
        case 'LOGIN':
            localStorage.setItem('user', JSON.stringify(action.payload));
            return { user: action.payload };
        case 'LOGOUT':
            localStorage.removeItem('user')
            localStorage.removeItem('gameState')
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
        // const user = JSON.parse(localStorage.getItem('user') || 'null');
        const storedUser = localStorage.getItem('user');
        const user = storedUser ? JSON.parse(storedUser) : null;


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
