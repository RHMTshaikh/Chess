// Chess\frontend\src\components\NewLoginForm.tsx

import { useNavigate} from 'react-router-dom'
import { useState } from 'react';
import { useLogin } from '../hooks/useLogin';

function SignupForm() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const { signup } = useLogin()
    const navigate = useNavigate()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password || !name) {
            setError('All fields are required.');
            return;
        }
        setError('');

        try {
            await signup({email, name, password})
            navigate('/dashboard')
            
        } catch (error) {
            console.error(error);
            navigate('/error', { state: { message: 'Login failed. Please try again.' } });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="new-login-form">
            <label htmlFor="name">Name:</label>
            <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
            />
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
            <button className="button-73" role="button" type="submit" >
                Submit
            </button>
        </form>
    );
}

export default SignupForm;

<button >Button 73</button>

/* CSS */
