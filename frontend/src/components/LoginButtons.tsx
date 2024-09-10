import { Link } from 'react-router-dom'

export default function LoginButtons() {
    
    return (
        <div>
            <Link to={'/signup'}>
                <button 
                    className='signup'
                >
                    Sign Up
                </button>
            </Link>
            <Link to={'/login'}>
                <button 
                    className='login'
                >
                    Login
                </button>
            </Link>
        </div>
    )
}