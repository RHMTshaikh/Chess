import { WebSocket } from "ws"
import { INIT_GAME, MOVE } from "./messages"
import { Game } from "./Game"

interface Player extends WebSocket {
	gameId: number ;
	opponent: Player ;
	turn: boolean ;
}

export class GameManager{
    private games: Map<number, Game> ;
    private pendingUser: WebSocket | null
    private users: WebSocket[]
    
    constructor(){
        this.games = new Map()
        this.pendingUser = null
        this.users = []
    }
    pickPiece(player: Player, position: string ){
        if (player.turn) {
            const game = this.games.get(player.gameId)
            const validMoves = game?.pickPiece(position)
            player.send(JSON.stringify({
                type: 'valid-moves',
                validMoves: validMoves
            }))
        } else {
            throw new Error("its not your turn")            
        }
    }
    placePiece(player: Player, position: string ){
        const game = this.games.get(player.gameId)
        const move = game?.placePiece(position)
        return move
    }
    currentState(player: Player){
        const game = this.games.get(player.gameId)
        const board = game?.currentState()
        return board
    }


    startGame(player1: Player, player2: Player){
        const game = new Game(player1, player2); // player1 is always white
        this.games.set(player1.gameId, game)
    }

    makeMatch(player: WebSocket){
        if (this.pendingUser) {
            // const game = new Game(this.pendingUser, player)
            this.pendingUser = null
        } else {
            this.pendingUser = player
            console.log('waiting for other player')            
        }
    }

    makeMove(player: Player, move: string){
        console.log(player.gameId);
        const game = this.games.get(player.gameId)
        player.opponent?.send(move)
    }

    addUser(socket: WebSocket){
        this.users.push(socket)
        console.log('added');
        
    }

    removeUser(socket: WebSocket){
        this.users = this.users.filter(user => user !== socket)
        console.log('removed');
        
    }

    private addHandler(socket: WebSocket) {
        socket.on('message', (data) => {
            const message = JSON.parse(data.toString())

            if (message.type === INIT_GAME) {
                if (this.pendingUser) {
                    // const game = new Game(this.pendingUser, socket)
                    // this.games.push(game)
                    this.pendingUser = null
                } else {
                    this.pendingUser  = socket
                }
            }

            // if (message.type === MOVE) {
            //     const game = this.games.find(game => game.player1 === socket || game.player2 === socket)
            //     if (game) {
            //         game.makeMove(socket, message.move)
            //     }
            // }
        })
    }
}