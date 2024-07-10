// Chess\frontend\src\hooks\useLogin.ts

import { useAuthContext } from "./useAuthContext";

interface User {
    name: string;
    email: string;
    rank: string
}

interface LoginResponse {
    user: User;
    token: string; 
    error?: string;
}
interface LoginParams {
    email: string;
    name?: string;
    password?: string;
}

export const useLogin = () => {
    const { dispatch } = useAuthContext();

    
    const login = async ({ email, password }: LoginParams) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/api/user/login`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const json = await response.json();
            console.log(json);
            
            if (response.ok) {
                dispatch({ type: 'LOGIN', payload: json.user });
            }

        } catch (error) {
            console.log(error);
        }
    };

    const newLogin = async ({ email, name, password }: LoginParams) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/api/user/new-login`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name })
            });

            const json = await response.json();
            console.log(json);
            
            if (response.ok) {
                dispatch({ type: 'LOGIN', payload: json.user });
            }

        } catch (error) {
            console.log(error);
        }
    };

    return { login, newLogin };
};
