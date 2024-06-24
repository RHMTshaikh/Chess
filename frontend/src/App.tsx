import React, { useState, useRef } from 'react';
import './App.css';
import ChessBoard from './components/ChessBoard';
// import Home from './pages/Home';

function App() {
    const [connected, setConnected] = useState(false);
    const [waiting, setWaiting] = useState(false);
    const ws = useRef<WebSocket | null>(null);
    const [board, setBoard] = useState<number[][] | null>(null);
    const [pieceColor, setPiececolor] = useState<string | null>(null);

    const play = () => {
        setWaiting(true);
        ws.current = new WebSocket('ws://localhost:8800');
        ws.current.onopen = () => {
            console.log('WebSocket connection opened');
        };

        ws.current.onmessage = (event: MessageEvent) => {
            console.log('Message from server:', event.data);
            const json = JSON.parse(event.data);
            console.log(json.type);
            if (json.type === 'error') {
                console.log(json.error);
                return
            }
            if (json.type === 'connected') {
                setConnected(true);
                setBoard(json.board)
                setPiececolor(json.pieceColor)
                return
            }            
        };

        ws.current.onclose = () => {
            console.log('WebSocket connection closed');
        };

        ws.current.onerror = (error: Event) => {
            console.error('WebSocket error:', error);
        };
    }

    return (
        <div className='App'>
            {waiting ? (
                <>
                {connected ? (
                    <ChessBoard board={board} ws={ws} pieceColor={pieceColor} />
                ) : (
                    <p>Waiting for other player...</p>
                )}
                </>
            ) : (
                <button className='play-button' onClick={play}>Play</button>
            )}
        </div>
    );
}

export default App;
