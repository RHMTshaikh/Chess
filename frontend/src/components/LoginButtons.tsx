import { Link } from 'react-router-dom'
import { gsap } from "gsap";
import { useGSAP } from '@gsap/react';

export default function LoginButtons() {
    
    useGSAP(()=>{
        gsap.from(".loginSignup" , {
            duration:1,
            y:400,
            opacity:0,
        })
    })

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