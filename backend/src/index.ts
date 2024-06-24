import WebSocket, { WebSocketServer } from 'ws';
import { GameManager } from './GameManager';
import { INIT_GAME, PICK, PLACE } from './messages';

interface Player extends WebSocket {
	gameId: number ;
	opponent: Player ;
	turn: boolean ;
}

const wss = new WebSocketServer({ port: 8800 });

let games: { player1: Player; player2: Player }[]= [];

const gameManager = new GameManager();
let pendingUser: Player | null = null

const initialBoard = [
	[ 1, 2, 3, 4, 5, 3, 2, 1],
	[ 0, 0, 0, 0, 0, 0, 0, 0],
	[ 9, 9, 9, 9, 9, 9, 9, 9], // 9 means empty
	[ 9, 9, 9, 9, 9, 9, 9, 9],
	[ 9, 9, 9, 9, 9, 9, 9, 9],
	[ 9, 9, 9, 9, 9, 9, 9, 9],
	[10,10,10,10,10,10,10,10],
	[11,12,13,14,15,13,12,11],
]

wss.on('connection', function connection(ws: Player) {

	if (pendingUser) {
		makeMatch(ws);
		ws.send(JSON.stringify({
			type: 'connected',
			board: initialBoard,
			pieceColor: 'black'
		}))
		ws.opponent.send(JSON.stringify({
			type: 'connected',
			board: initialBoard,
			pieceColor: 'white'
		}))
	} else {
		pendingUser = ws
		console.log('waiting for other user to join');
		ws.send(JSON.stringify({type: 'waiting'}))
	}

	ws.on('message', function incoming(data: WebSocket.Data) {
		let json: {
			type: string, 
			position: string,
			imgSrc: string,
			state: string
		} = JSON.parse(data.toString());

		if (json.type === INIT_GAME) {
			console.log('in the game');
			return
		}

		if (json.type === PICK) {
			try {
				gameManager.pickPiece(ws, json.position)
				
			} catch (error) {
				if (error instanceof Error) {
					console.log(error.message);
					ws.send(JSON.stringify({
						type: 'error',
						error: error.message
					}))
				}
			}
			return			
		}

		if (json.type === PLACE) {
			try {
				const move = gameManager.placePiece(ws, json.position)
				ws.opponent.send(JSON.stringify({
					type: 'opponents-move',
					move: move,
					imgSrc: json.imgSrc
				}))
			} catch (error) {
				if (error instanceof Error) {
					console.log(error.message);
					ws.send(JSON.stringify({
						type: 'error',
						error: error.message
					}))
				}
			}
			return
		}
		if (json.type === 'current-state') {
			const currentState = gameManager.currentState(ws)
			ws.send(JSON.stringify({
				type: 'current-state',
				board: currentState
			}))
			return
		}
		ws.opponent.send(data.toString())
		console.log(data.toString());
	});
});

function sendToOpponent(player: Player, message: string) {
	if (player.opponent && player.opponent.readyState === WebSocket.OPEN) {
		player.opponent.send(message);
	}
}
function makeMatch(ws: Player) {
	(pendingUser as Player).opponent = ws;
	ws.opponent = pendingUser as Player;

	let gameId = games.length;

	ws.gameId = gameId;
	(pendingUser as Player).gameId = gameId;

	games[gameId] = {player1: pendingUser as Player, player2: ws};

	(pendingUser as Player).turn = true //white player
	ws.turn = false // black player

	gameManager.startGame((pendingUser as Player), ws);

	pendingUser = null;
}

console.log('WebSocket server is running on ws://localhost:8800');
