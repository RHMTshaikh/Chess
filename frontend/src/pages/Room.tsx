import { useState, useRef, useEffect } from "react";
import ChessBoard from "../components/ChessBoard";
import { useGameContext } from "../hooks/useGameContext";
import { useLocation } from "react-router-dom";

function Room() {
    const [connected, setConnected] = useState(false);
    const ws = useRef<WebSocket| null>(null);
    if (ws.current === null) {
        console.log("new connection");
        
        ws.current = new WebSocket('ws://localhost:8800');
    }
    
    const location = useLocation();
    const mode = useRef<string>(location.state.mode)
    const { game:gameState, dispatch: gamedDispatch } = useGameContext()

    useEffect(() => {
        console.log("useeffect");
        // ws.current = new WebSocket('ws://localhost:8800')

        console.log('WebSocket connection opened');
        ws.current!.onopen = () => {
            if (location.state.mode === 'play') {
                ws.current?.send(JSON.stringify({
                    type: 'init_game',
                }))
                if (!connected) {
                    console.log('not connected');
                }
                
            } else if (location.state.mode === 'spectate') {
                ws.current!.send(JSON.stringify({
                    type: 'spectate',
                    game_id: location.state.gameId,
                }))
            }
        }

        ws.current!.onmessage = (event: MessageEvent) => {
            console.log('Message from server:', event.data);

            const json = JSON.parse(event.data);
            console.log(json);

            if (json.type === 'error') {
                return;
            }
            if (json.type === 'connected') {
                setConnected(true);
                gamedDispatch({type: "START", payload: json })
                return;
            }            
            if (json.type === 'spectate') {
                gamedDispatch({type: "SPECTATE", payload: json })
                setConnected(true);
                return;
            }            
        };

        ws.current!.onclose = () => {
            console.log('WebSocket connection closed');
        };
        
        ws.current!.onerror = (error: Event) => {
            console.error('WebSocket error:', error);
        };

    }, []);

    return (
        <div className="room">
            {connected ? 
                <ChessBoard ws={ws} mode={mode} />
                :
                <h1>waiting</h1>
            }
        </div>
    );
}

export default Room;
