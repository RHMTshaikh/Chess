import express from "express";
import { makeExpressCallback, makeExpressMiddleware } from "../../express";
import {
    signUpUser,
    loginUser,
    logOutUser,
    renewToken,
    signUpGuest,
    getUsersGames
} from "../../../../Controllers";
import { authorizUser } from "../../../../Middleware/index";

const router = express.Router();


router.post("/signup", makeExpressCallback(signUpUser));

router.get("/guest-signup", makeExpressCallback(signUpGuest));

router.post("/login", makeExpressCallback(loginUser));

router.post("/logout", makeExpressCallback(logOutUser));

router.get("/renew-token", makeExpressCallback(renewToken));

router.get("/games", makeExpressMiddleware(authorizUser), makeExpressCallback(getUsersGames));

export default router;