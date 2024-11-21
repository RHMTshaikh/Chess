import { startHttpServer } from "./HTTP-Servers";
import dotenv from 'dotenv';
import startWebSocketServer from "./Websocket";
import { startPoolConnection as connectDB } from "./DBMS";

dotenv.config();

connectDB();
const port = process.env.PORT || 4000;
const server = startHttpServer({ port: Number(port) });
startWebSocketServer({server});