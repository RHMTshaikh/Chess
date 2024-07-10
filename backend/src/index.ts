// Chess\backend\src\index.ts

import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import userRoutes from './routes/user';
import { startWebSocketServer } from './GameManager';

startWebSocketServer()

dotenv.config();

const app = express();

app.use(cors({
    origin: 'http://localhost:3000', // Replace with your client's URL
    credentials: true // This allows cookies to be included in cross-origin requests
}));
app.use(cookieParser())

// Middleware
app.use(express.json()); // Parse JSON bodies

app.use((req, res, next) => {
    console.log(req.path, req.method);
    next();
});

// app.post('/api/workouts/analyze', analyzeTranscript);
// app.use('/api/workouts', workoutRoutes);
app.use('/api/user', userRoutes);

(async () => {
	// const DBconnection = await connectDB();
	app.listen(process.env.PORT, () => {
		console.log('Listening on port', process.env.PORT);
	});
})();







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
