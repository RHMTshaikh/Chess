import {useRef, useEffect} from 'react';

// interface HomeProps {
//     waiting: boolean;
//     setWaiting: React.Dispatch<React.SetStateAction<boolean>>;
//     connected: boolean;
//     setConnected: React.Dispatch<React.SetStateAction<boolean>>;
// }

// const Home: React.FC<HomeProps> = ({ waiting, setWaiting, connected, setConnected }) => {

//     const ws = useRef<WebSocket | null>(null);

//     const play = ()=>{
//         setWaiting(true)
//         ws.current = new WebSocket('ws://localhost:8800');
//         ws.current.onopen = () => {
//             console.log('WebSocket connection opened');
//         };

//         ws.current.onmessage = (event: MessageEvent) => {
//             console.log('Message from server:', event.data);
//             const json = JSON.parse(event.data);
//             console.log(json.type);
//             if (json.type === 'connected') {
//                 setConnected(true)
//                 setWaiting(false)
//                 console.log(json.board);
                
//             }
            
//         };

//         ws.current.onclose = () => {
//             console.log('WebSocket connection closed');
//         };

//         ws.current.onerror = (error: Event) => {
//             console.error('WebSocket error:', error);
//         };


//     }
    
//     return (
//         <div>
//             {waiting ? (
//                 <p>Waiting for other player...</p>
//             ) : (
//                 <button onClick={play}>Play</button>
//             )}
//         </div>
//     );
// }

// export default Home;
