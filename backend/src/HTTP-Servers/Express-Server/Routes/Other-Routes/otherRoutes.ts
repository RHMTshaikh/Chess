import express from "express";
import { makeExpressCallback, makeExpressMiddleware } from "../../express";
import { getPublicGames } from "../../../../Controllers";

const router = express.Router();

router.get("/public-games", makeExpressCallback(getPublicGames));

export default router;