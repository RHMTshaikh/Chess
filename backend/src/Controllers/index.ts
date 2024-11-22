import {
    listPublicGames,
    listUsersGames,
    signUp,
    logIn,
    logOut,
    refreshToken,
    retriveSingleUserGame,
} from '../Use-Cases'

import makeGetPublicGames from './get-publicGames'
import makeGetUsersGames from './get-userGames'
import makeSignUpUser from './post-signup'
import makeLoginUser from './post-login'
import makeLogOutUser from './post-logout'
import makeRenewToken from './post-refreshToken'
import makeSignUpGuest from './post-guestSignUp'
import makeGetUserGame from './get-userGame'


const getPublicGames = makeGetPublicGames({ listPublicGames })

const getUsersGames = makeGetUsersGames({ listUsersGames });

const getUserGame = makeGetUserGame({ retriveSingleUserGame });

const signUpUser = makeSignUpUser({ signUp });

const loginUser = makeLoginUser({ logIn });

const logOutUser = makeLogOutUser({ logOut });

const renewToken = makeRenewToken({ refreshToken });

const signUpGuest = makeSignUpGuest({ signUp });


export {
    getPublicGames,
    getUsersGames,
    getUserGame,
    signUpUser,
    loginUser,
    logOutUser,
    renewToken,
    signUpGuest,
}
  