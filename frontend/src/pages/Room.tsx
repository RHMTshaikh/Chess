import { useState, useRef, useEffect } from "react";
import ChessBoard from "../components/ChessBoard";
import { useGameContext } from "../hooks/useGameContext";
import { useLocation } from "react-router-dom";

function Room() {
    const [connected, setConnected] = useState(false);
    const location = useLocation();
    const color = useRef<string>(location.state.color);
    const opponent = useRef<string>(location.state.opponent);
    const role = useRef<string>(location.state.role);
    const game_id = useRef<number>(location.state.game_id);
    
    const ws = useRef<WebSocket | null>(null);
    const { dispatch: gamedDispatch } = useGameContext();

    if (ws.current === null) {
        if (role.current === 'PLAYER' ) {
            ws.current = new WebSocket(`${process.env.REACT_APP_WEBSOCKET_URL}?color=${color.current}&opponent=${opponent.current}&role=${role.current}`);
        } else if(role.current === 'SPECTATOR') {
            ws.current = new WebSocket(`${process.env.REACT_APP_WEBSOCKET_URL}?role=${role.current}&game_id=${game_id.current}`);
            console.log(game_id.current);
            
        } else {
            throw new Error('Invalid role');
        }
    }

    useEffect(() => {
        if (ws.current) {
            
            ws.current.onopen = () => {
                console.log('WebSocket connection opened');
            };

            ws.current.onmessage = (event: MessageEvent) => {
    
                const json = JSON.parse(event.data);
                console.log('message from websocket server:', json);
                
    
                if (json.type === 'ERROR') {
                    console.error('Error from websocket server:', json.error);
                    return;
                }
                if (json.type === 'CONNECTED') {
                    setConnected(true);
                    gamedDispatch({ type: "START", payload: json });
                    return;
                }
                if (json.type === 'SPECTATE') {
                    gamedDispatch({ type: "SPECTATE", payload: json });
                    setConnected(true);
                    return;
                }
            };
    
            ws.current.onclose = () => {
                console.log('WebSocket connection closed');
            };
    
            ws.current.onerror = (error: Event) => {
                console.error('WebSocket error:', error);
            };
    
        }
        // Cleanup WebSocket connection on component unmount
        return () => {
            ws.current?.close();
        };
    }, []);

    return (
        <div className="room">
            {connected ? 
                <ChessBoard ws={ws} />
                :
                <h1>waiting</h1>
            }
        </div>
    );
}

export default Room;
