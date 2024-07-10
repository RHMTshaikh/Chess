
export interface Player extends WebSocket {
    emailId: string
	gameId: number ;
	opponent: Player ;
	turn: boolean ;
}