// Chess\frontend\src\components\LoginButtons.tsx

import {Link, useNavigate} from 'react-router-dom'
import { AuthContext } from '../context/AuthContext';
import { useContext } from 'react';
import { useLogin } from '../hooks/useLogin';
import { useAuthContext } from '../hooks/useAuthContext';

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
function generateUserName(length:number) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      result += characters[randomIndex];
    }
    return `guest#${result}`;
  }

export default function LoginButtons() {

    const { dispatch } = useAuthContext();
	const { newLogin } = useLogin()
    const navigate = useNavigate()


    const guestLogin = async ()=>{
        let user = localStorage.getItem('user');
        if (!user) {
            let email = generateUUID();
            let name = generateUserName(5);

            try{
                await newLogin({email, name})
                navigate('/dashboard')
                
            } catch (error) {
                console.error(error);
                console.log('error');
                
                navigate('/error', { state: { message: 'Login failed. Please try again.' } });
            }
        } else{
            dispatch({ type: 'LOGIN', payload: JSON.parse(user)})
        }
    }
    
    return (
        <div>
            <Link to={'/new-login'}>
                <button 
                    className='new-login'
                >
                    New Login
                </button>
            </Link>
            <Link to={'/login'}>
                <button 
                    className='login'
                >
                    Login
                </button>
            </Link>
                <button 
                    className='guest'
                    onClick={guestLogin}
                >
                    Guest
                </button>
            <Link to={'/dashboard'}>
            </Link>
        </div>
    )
}