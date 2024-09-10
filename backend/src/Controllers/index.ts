import {
    listPublicGames,
    listUsersGames,
    signUp,
    logIn,
    logOut,
    refreshToken
} from '../Use-Cases'

import makeGetPublicGames from './get-publicGames'
import makeGetUsersGames from './get-userGames'
import makeSignUpUser from './post-signup'
import makeLoginUser from './post-login'
import makeLogOutUser from './post-logout'
import makeRenewToken from './post-refreshToken'
import makeSignUpGuest from './post-guestSignUp'


const getPublicGames = makeGetPublicGames({ listPublicGames })

const getUsersGames = makeGetUsersGames({ listUsersGames });

const signUpUser = makeSignUpUser({ signUp });

const loginUser = makeLoginUser({ logIn });

const logOutUser = makeLogOutUser({ logOut });

const renewToken = makeRenewToken({ refreshToken });

const signUpGuest = makeSignUpGuest({ signUp });


export {
    getPublicGames,
    getUsersGames,
    signUpUser,
    loginUser,
    logOutUser,
    renewToken,
    signUpGuest,
}
  