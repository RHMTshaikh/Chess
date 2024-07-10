// Chess\frontend\src\components\Navbar.tsx

import { useState, useEffect, MouseEventHandler } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../hooks/useAuthContext';

export default function Navbar() {
    const { user, dispatch } = useAuthContext();
    const [name, setName] = useState<string>('');
    const [rank, setRank] = useState<string>('');
	const navigate = useNavigate()


    useEffect(() => {
        if (user) {
            setName(user.name);
            setRank(user.rank);
        }else{
            setName('');
            setRank('');

		}
    }, [user]);

	function logout() {
        dispatch({ type: 'LOGOUT' })
        // navigate('/')
	}



    return (
        <div className="navbar">
            <Link to={'/'}><div className="logo"></div></Link>
            {user && 
             <>
                <div className="rank">{rank ? `rank: ${rank}` : ''}</div>
                <div className="name">{name}</div>
                <div className="profile-pic-div" >
                    {/* <span className="material-symbols-outlined edit-icon" >edit</span> */}
                    {'profilePic' ? 
                        <img className="profile-pic" src='' alt="" />
                        :
                        <span className="material-symbols-outlined account-circle">account_circle</span>
                    }
                    
                </div>
                <button 
                    className='log-out'
                    onClick={logout}
                >Log Out</button>
             </>
            }
            
        </div>
    );
}
