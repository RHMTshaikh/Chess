"use strict";
// Chess\backend\src\index.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const user_1 = __importDefault(require("./routes/user"));
const GameManager_1 = require("./GameManager");
const dbLogic_1 = require("./DataBaseLogic/dbLogic");
const pg_1 = require("pg");
(0, GameManager_1.startWebSocketServer)();
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: 'http://localhost:3000', // Replace with your client's URL
    credentials: true // This allows cookies to be included in cross-origin requests
}));
app.use((0, cookie_parser_1.default)());
// Middleware
app.use(express_1.default.json()); // Parse JSON bodies
app.use((req, res, next) => {
    console.log(req.path, req.method);
    next();
});
// app.post('/api/workouts/analyze', analyzeTranscript);
// app.use('/api/workouts', workoutRoutes);
app.use('/api/user', user_1.default);
(() => __awaiter(void 0, void 0, void 0, function* () {
    const pool = new pg_1.Pool({
        connectionString: "postgresql://rahmat:M0bi_tpBMkfAV4ABAmr2Zw@chess24-5329.7s5.aws-ap-south-1.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full",
        ssl: {
            rejectUnauthorized: false, // Adjust according to your SSL configuration
        },
    });
    (0, dbLogic_1.passConnection)(pool);
    app.listen(process.env.PORT, () => {
        console.log('Listening on port', process.env.PORT);
    });
}))();
// // Chess\backend\src\index.ts
// import WebSocket, { WebSocketServer } from 'ws';
// import { GameManager } from './GameManager';
// import { INIT_GAME, PICK, PLACE } from './messages';
// export interface Player extends WebSocket {
//     emailId: string
// 	gameId: number ;
// 	opponent: Player ;
// 	turn: boolean ;
// }
// const wss = new WebSocketServer({ port: 8800 });
// let games: { player1: Player; player2: Player }[]= [];
// const gameManager = new GameManager();
// wss.on('connection', function connection(ws: Player & WebSocket) {
// 	ws.on('message', async function incoming(data: WebSocket.Data) {
// 		let json: {
// 			type: string, 
// 			position: string,
// 			imgSrc: string,
// 			email: string,
// 		} = JSON.parse(data.toString());
// 		if (json.type === PICK) {
// 			try {
// 				gameManager.pickPiece(ws, json.position)
// 			} catch (error) {
// 				if (error instanceof Error) {
// 					console.log(error.message);
// 					ws.send(JSON.stringify({
// 						type: 'error',
// 						error: error.message
// 					}))
// 				}
// 			}
// 			return			
// 		}
// 		if (json.type === PLACE) {
// 			try {
// 				const move = gameManager.placePiece(ws, json.position)
// 				await saveMoveDB(ws.gameId, move, json.imgSrc)
// 				ws.opponent.send(JSON.stringify({
// 					type: 'opponents-move',
// 					move: move,
// 					imgSrc: json.imgSrc
// 				}))
// 			} catch (error) {
// 				if (error instanceof Error) {
// 					console.log(error.message);
// 					ws.send(JSON.stringify({
// 						type: 'error',
// 						error: error.message
// 					}))
// 				}
// 			}
// 			return
// 		}
// 		if (json.type === 'current-state') {
// 			const currentState = gameManager.currentState(ws)
// 			ws.send(JSON.stringify({
// 				type: 'current-state',
// 				board: currentState
// 			}))
// 			return
// 		}
// 		if (json.type === INIT_GAME) {
// 			console.log('index.ts:47:email',json.email);
// 			ws.emailId = json.email
// 			gameManager.createGame(ws)
// 			return
// 		}
// 		ws.opponent.send(data.toString())
// 		console.log(data.toString());		
// 	});
// });
// console.log('WebSocket server is running on ws://localhost:8800');
// //---------------------------------------------------------------------------
// import dotenv from 'dotenv';
// import express from 'express';
// import userRoutes from './routes/user';
// import cors from 'cors';
// dotenv.config();
// const app = express();
// app.use(cors());
// // Middleware
// app.use(express.json()); // Parse JSON bodies
// app.use((req, res, next) => {
//     console.log(req.path, req.method);
//     next();
// });
// // app.post('/api/workouts/analyze', analyzeTranscript);
// // app.use('/api/workouts', workoutRoutes);
// app.use('/api/user', userRoutes);
// import mysql, { Connection, MysqlError} from 'mysql';
// import { saveMoveDB } from './DataBaseLogic/dbLogic';
// let connection: Connection
// const connectDB = async()=>{
// 	connection = mysql.createConnection({
// 		host     : 'sql12.freesqldatabase.com',
// 		user     : 'sql12716054',
// 		password : 'PJeSU8QzSc',
// 		database: 'sql12716054'
// 	});
// 	connection.connect((err) => {
// 		if (err) {
// 			console.error('Error connecting to MySQL:', err.stack);
//             setTimeout(connectDB, 2000); // Reconnect after 2 seconds
// 			return;
// 		}
// 		console.log('Connected to MySQL as id', connection.threadId);
// 		app.listen(process.env.PORT, () => {
// 			console.log('Listening on port', process.env.PORT);
// 		});
// 	});
// 	connection.on('error', (err: MysqlError) => {
//         console.error('MySQL Connection Error:', err);
//         if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNRESET' || err.code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
//             console.warn('Re-establishing connection...');
//             connection.destroy();
//             connectDB();
//         } else {
//             throw err;
//         }
//     });
// }
// connectDB()
// export  {connection};
//# sourceMappingURL=index.js.map