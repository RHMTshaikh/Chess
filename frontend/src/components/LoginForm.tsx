// Chess\frontend\src\components\NewLoginForm.tsx

import { useNavigate} from 'react-router-dom'
import { useState } from 'react';
import { useLogin } from '../hooks/useLogin';



function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    
    const { login } = useLogin()
    const navigate = useNavigate()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation
        if (!email || !password) {
            setError('Both fields are required.');
            return;
        }
        setError('');
        try {
            await login({email, password})
            navigate('/dashboard')
            
        } catch (error) {
            console.error(error);
            navigate('/error', { state: { message: 'Login failed. Please try again.' } });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="new-login-form">
            <label htmlFor="email">Email:</label>
            <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
            />
            <label htmlFor="password">Password:</label>
            <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />
            {error && <p className="error">{error}</p>}
            <button type="submit" >
                Login
            </button>
        </form>
    );
}

export default LoginForm;
