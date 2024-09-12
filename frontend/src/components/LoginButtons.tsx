import { Link } from 'react-router-dom'

export default function LoginButtons() {
    
    return (
        <div className='loginSignup' >
            <Link to={'/signup'}>
                <button 
                    className='signup button-73'
                    role="button"
                >
                    Sign Up
                </button>
            </Link>
            <Link to={'/login'}>
                <button 
                    className='login button-73'
                >
                    Login
                </button>
            </Link>
        </div>
    )
}