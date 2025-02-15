import { Link } from 'react-router-dom';
import { useAuthContext } from '../hooks/useAuthContext';

export default function Navbar() {
    const { user, dispatch } = useAuthContext();

	async function logout() {
        const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/api/user/logout`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
            console.log('logging out...');
            dispatch({ type: 'LOGOUT' })
        } else{
            const json = await response.json()
            if (json.error === 'TokenExpiredError') {
				console.log('access token has expierd ,asking for renew token');
				const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/api/user/renew-token`, {
					method: 'GET',
					credentials: 'include',
					headers: { 'Content-Type': 'application/json' },
				});
				if (response.ok) {
                    console.log('retrying logging out again...');
					logout();
				} else {
					const json = await response.json()
					console.log('error occured while refreshing the token: ',json.error);
				}
			}
        }
	}

    return (
        <div className="navbar">
            <Link to={'/'}><div className="logo"></div></Link>
            {user && 
             <>
                <div className="rating">{`rating: ${user.rating}`}</div>
                <div className="name">{user.name}</div>
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
