import {DB_Operations} from '../DBMS';
import makeListPublicGames from './list-publicGames'
import makeListUsersGames from './list-usersGames'
import makeSignUp from './signup';
import makeLogIn from './login';
import makeLogOut from './logout'
import makeAuthorization from './authorization';
import makeRefreshToken from './refresh-token';

const listPublicGames = makeListPublicGames({ DB_Operations })
const listUsersGames = makeListUsersGames({ DB_Operations })
const signUp = makeSignUp({ DB_Operations });
const logIn = makeLogIn({ DB_Operations });
const logOut = makeLogOut({ DB_Operations })
const authorization = makeAuthorization({ DB_Operations });
const refreshToken = makeRefreshToken({ DB_Operations });


export {
	listPublicGames,
	listUsersGames,
	signUp,
	logIn,
	logOut,
	authorization,
	refreshToken,
}
