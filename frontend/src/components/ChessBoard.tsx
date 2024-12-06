import React, { useRef, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Move, Position, PositionNotation, ChessPlayer } from '../types';
import MovesPanel from './MovesPanel';
import { useAuthContext } from '../hooks/useAuthContext';
import Timer from './Timer';

function boardFromArray(board:number[][], vertcleAxis: number[], horizontalAxis:string[], heightChessBoard:number, widthChessBoard: number) : React.ReactNode[]{
    const tiles: React.ReactNode[] = [];
    let toggle = true;
    
    for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board.length; j++) {
            const piece = board[i][j];
            const imgSrc = piece !== 9 ? `assets/image/${piece<9 ? ('0'+piece):(piece)}.png` : '';
            const style = {
                backgroundImage: `url(${imgSrc})`,
            }
            tiles.push(
                <div 
                    className={`tile ${toggle ? 'white-tile' : 'black-tile'}`} 
                    id={`${horizontalAxis[j]}${vertcleAxis[i]}`} 
                    key={`${horizontalAxis[j]}${vertcleAxis[i]}`} 
                    >
                    {imgSrc && <div style={style} className="chess-piece"></div>}
                </div>
            );
            toggle = !toggle;
        }
        toggle = !toggle;
    }

    return tiles
}

interface PickedPiece {
    element: HTMLDivElement,
    position: PositionNotation
}
interface Opponent {
    name: string,
    rank: number,
    type: string
}

const ChessBoard: React.FC = () => {
    const { user, dispatch:dispatchUser } = useAuthContext();
    
    const [board, setBoard] = useState<number[][]>([]);

    
    const [promotionChoices, setPromotionChoices] = useState<number[]>([]);
    const pawnPromotionDialog = useRef<HTMLDialogElement>(null)
    
    const [dialogMessage, setDialogMessage] = useState('')
    const dialogBoxRef = useRef<HTMLDialogElement>(null)
    
    const location = useLocation();
    
    const role = useRef<'PLAYER' | 'SPECTATOR' | 'REVISITOR' >(location.state.role);
    const pieceColor = useRef<'black' | 'white' | null>(location.state.color);
    const game_id = useRef<number>(location.state.game_id);
    
    const chessBoardRef = useRef<HTMLDivElement>(null);
    const pickedPiece  = useRef<PickedPiece | null>(null);
    const count = useRef<number>(1);
    const validMoves = useRef<PositionNotation[]>([]);
    const movesArray = useRef<Move[]>([]);
    const GAME_OVER = useRef<boolean>(true);
    const turn = useRef<boolean>(false);

    const players = useRef<[ChessPlayer | null, ChessPlayer | null]>([null, null]);
    const flip = useRef(false);
    const vertcleAxisState = useRef([8, 7, 6, 5, 4, 3, 2, 1,]);
    const horizontalAxisState = useRef(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']);
    
    const navigate =  useNavigate()   
    
    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        if (role.current === 'PLAYER' ) {
            ws.current = new WebSocket(`${process.env.REACT_APP_WEBSOCKET_URL}?color=${pieceColor.current}&opponent=${location.state.opponent}&role=${role.current}&name=${user!.name}&rank=${user!.rank}`);
            
        } else if(role.current === 'SPECTATOR') {
            ws.current = new WebSocket(`${process.env.REACT_APP_WEBSOCKET_URL}?role=${role.current}&game_id=${game_id.current}&name=${user!.name}&rank=${user!.rank}`);
            
        } else if(role.current === 'REVISITOR') {
            
            fetch(`${process.env.REACT_APP_SERVER_URL}/api/user/game/${game_id.current}`, {
                method: 'GET',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
            })
            .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(json => {
                    movesArray.current = json.game.moves;
                    count.current = movesArray.current.length+1;
                    pieceColor.current = json.game.myColor;
                    if (pieceColor.current === 'black') {
                        flip.current = !flip.current;
                        vertcleAxisState.current = vertcleAxisState.current.reverse();
                        horizontalAxisState.current = horizontalAxisState.current.reverse();
                        json.game.board = (json.game.board as number[][]).map(row => row.slice().reverse()).reverse();        
                    }
                    setBoard(json.game.board);
                    
                })
                .catch(error => {
                    console.error('Error fetching game data:', error);
                });
                
        }else{
            throw new Error('Invalid role');
        }
            
        if (ws.current) {
            ws.current.onmessage = (event: MessageEvent) => {
                const json = JSON.parse(event.data);
                console.log('Message from websocket server:', json);
                
                if (json.type === 'ERROR') {
                    console.log(json.error);
                    return
                }
                if (json.type === 'CONNECTED') {
                    GAME_OVER.current = false;
                    if (pieceColor.current === 'black') {
                        flip.current = !flip.current;
                        vertcleAxisState.current = vertcleAxisState.current.reverse();
                        horizontalAxisState.current = horizontalAxisState.current.reverse();
                        json.board = (json.board as number[][]).map(row => row.slice().reverse()).reverse();        
                    }
                    
                    turn.current = json.turn === pieceColor.current;

                    players.current = [
                        {
                            name:   user!.name,
                            rank:   user!.rank,
                            rating: user!.rating,
                            turn:   json.turn === pieceColor.current,
                            time:   pieceColor.current === 'white' ? json.whiteTime : json.blackTime,
                            color:  pieceColor.current!,
                            type:   'HUMAN'
                        } ,
                        {
                            name: json.opponentName,
                            rank: json.opponentRank,
                            rating: json.opponentRating,
                            turn: json.turn !== pieceColor.current,
                            time:  pieceColor.current !== 'white' ? json.whiteTime : json.blackTime,
                            color: pieceColor.current === 'white' ? 'black' : 'white',
                            type: 'HUMAN',
                        }
                    ];
                    // localStorage.setItem('gameState', JSON.stringify({
                    //     players: players.current, 
                    //     board: json.board, 
                    //     moves: json.moves, 
                    //     turn: turn.current, 
                    //     role: role.current, 
                    //     game_id: game_id.current
                    // }));
                    setBoard(json.board);
                    return;
                }
                if (json.type === 'SPECTATE') {
                    setBoard(json.board);     
                    movesArray.current = json.moves;  
                    players.current = [
                        {
                            name: json.whitePlayer.name,
                            rank: json.whitePlayer.rank,
                            rating: json.whitePlayer.rating,
                            turn: json.turn === 'white',
                            time: json.whitePlayer.time,
                            color: 'white',
                            type:  json.whitePlayer.type
                        } ,
                        {
                            name: json.blackPlayer.name,
                            rank: json.blackPlayer.rank,
                            rating: json.blackPlayer.rating,
                            turn: json.turn === 'black',
                            time: json.blackPlayer.time,
                            color: 'black',
                            type:  json.blackPlayer.type
                        }
                    ];
                    return;
                }
                if (json.type === 'VALID_MOVES') {
                    if (validMoves) {
                        validMoves.current.forEach(position => {
                            document.getElementById(position)?.classList.remove('valid-move')
                        })
                    }
        
                    validMoves.current = json.validMoves || [];
        
                    validMoves.current.forEach(position => {
                        document.getElementById(position)?.classList.add('valid-move')
                    });
                    return
                }
                if (json.type === 'OPPONENT_MOVE') {
                    if (json.checkmate) {
                        console.log('Checkmate');  
                        setDialogMessage('You lost by Checkmate!');
                        dialogBoxRef.current!.showModal();          
                    } else if (json.stalemate) {
                        console.log('Stalemate');
                        setDialogMessage('Stalemate!')              
                    }

                    players.current = [
                        {
                            ...players.current[0]!,
                            time:  players.current[0]?.color === 'white' ? json.whiteTime : json.blackTime,
                            turn: json.turn === players.current[0]?.color,
                        } ,
                        {
                            ...players.current[1]!,
                            time:  players.current[0]?.color !== 'white' ? json.whiteTime : json.blackTime,
                            turn: json.turn === players.current[1]?.color,
                        }
                    ];
                    
                    
                    if (flip.current) {
                        json.board = (json.board as number[][]).map(row => row.slice().reverse()).reverse();
                    }
                    setBoard(json.board);
                    
                    count.current = 1
                    movesArray.current.push(json.move);
                    
                    turn.current = json.turn === pieceColor.current;
                    return
                }
                // if (json.type === 'MOVE') { // for spectator
                //     if (flip.current) {
                //         json.board = (json.board as number[][]).map(row => row.slice().reverse()).reverse();
                //     }
                //     // if (json.checkmate) {
                //     //     console.log('Checkmate');  
                //     //     setDialogMessage(`${json.winner} won by Checkmate!`);
                //     //     dialogBoxRef.current!.showModal();          
                //     // } else if (json.stalemate) {
                //     //     console.log('Stalemate');
                //     //     setDialogMessage('Stalemate!')              
                //     // }

                //     players.current = [
                //         {
                //             ...players.current[0]!,
                //             time:  players.current[0]?.color === 'white' ? json.whiteTime : json.blackTime,
                //             turn: json.turn === players.current[0]?.color
                //         } ,
                //         {
                //             ...players.current[1]!,
                //             time:  players.current[1]?.color === 'black' ? json.blackTime : json.whiteTime,
                //             turn: json.turn === players.current[1]?.color
                //         }
                //     ];
                    
                //     setBoard(json.board)
                //     movesArray.current.push(json.move)
                //     count.current = 1;
                //     return;
                // }
                if (json.type === 'CURRENT_STATE') {
                    if (flip.current) {
                        json.board = (json.board as number[][]).map(row => row.slice().reverse()).reverse();
                    }
                    setBoard(json.board);
                    count.current = 1;
                    turn.current = json.turn === pieceColor.current;
                   
        
                    if (json.move) movesArray.current.push(json.move);
        
                    if(json.promotionChoices){
                        setPromotionChoices(json.promotionChoices);
                        pawnPromotionDialog.current!.showModal();
                        return;
        
                    } else if (json.checkmate) {
                        setDialogMessage('You won by Checkmate!');
                        dialogBoxRef.current!.showModal();
                        
                    } else if (json.stalemate) {
                        setDialogMessage('Stalemate!');
                        dialogBoxRef.current!.showModal();
                    }

                    players.current = [
                        {
                            ...players.current[0]!,
                            time:  players.current[0]?.color === 'white' ? json.whiteTime : json.blackTime,
                            turn: json.turn === players.current[0]?.color
                        } ,
                        {
                            ...players.current[1]!,
                            time:  players.current[0]?.color !== 'white' ? json.whiteTime : json.blackTime,
                            turn: json.turn === players.current[1]?.color
                        }
                    ];
                    
                    return;
                }

                if (json.type === 'GAME_OVER') {
                    GAME_OVER.current = true
                    setDialogMessage(json.message)
                    dialogBoxRef.current!.showModal()
                    ws.current?.close();

                    players.current = [
                        {
                            ...players.current[0]!,
                            time:  players.current[0]?.color === 'white' ? json.whiteTime : json.blackTime,
                            turn: json.turn === players.current[0]?.color,
                        } ,
                        {
                            ...players.current[1]!,
                            time:  players.current[0]?.color !== 'white' ? json.whiteTime : json.blackTime,
                            turn: json.turn === players.current[1]?.color,
                        }
                    ];

                    dispatchUser({ type: 'RATING', payload: json.newRating });
                    return
                }
            }
        }

        const unload = (e: BeforeUnloadEvent) =>{
            e.preventDefault();
            // if (!opponentLeft) {
                // quitGame();
                // localStorage.setItem('gameState', JSON.stringify({
                //     players: players.current, 
                //     board: json.board, 
                //     moves: json.moves, 
                //     turn: turn.current, 
                //     role: role.current, 
                //     game_id: game_id.current
                // }));
            // }
        }
        window.addEventListener('beforeunload', unload);
        
        dialogBoxRef.current!.addEventListener("click", e => {
            const dialogDimensions = dialogBoxRef.current!.getBoundingClientRect()
            if (
                e.clientX < dialogDimensions.left ||
                e.clientX > dialogDimensions.right ||
                e.clientY < dialogDimensions.top ||
                e.clientY > dialogDimensions.bottom
            ) {
                dialogBoxRef.current!.close()
            }
        })
        
        return () =>{
            window.removeEventListener('beforeunload', unload)
        }
    },[]);


    const index = (position: PositionNotation):{
            y: number, //row
            x: number, //column
        } => { // position: a3
        let x = horizontalAxisState.current.indexOf(position.charAt(0));
        let y = vertcleAxisState.current.indexOf(parseInt(position.charAt(1)))
        return {y,x}
    }
    const indexToNotation = (position: Position): PositionNotation => {
        return `${horizontalAxisState.current[position.x]}${vertcleAxisState.current[position.y]}` as PositionNotation;
    }
    const flipBoard = () => {
        vertcleAxisState.current = vertcleAxisState.current.reverse();
        horizontalAxisState.current = horizontalAxisState.current.reverse();
        players.current = [players.current[1], players.current[0]];
        flip.current = !flip.current;
        setBoard(board.map(row => row.slice().reverse()).reverse());
    } 

    const cellPosition = (element: HTMLDivElement): PositionNotation   => {
        const chessboard = chessBoardRef.current;
        const height = chessBoardRef.current?.offsetHeight! / 8;
        const width = chessBoardRef.current?.offsetWidth! / 8;

        const minX = chessboard!.offsetLeft + width / 2;
        const minY = chessboard!.offsetTop + height / 2;

        const pieceX = element.offsetLeft + width / 2;
        const pieceY = element.offsetTop + height / 2;

        const i = (pieceX - minX) % width < (width / 2)
            ? Math.floor(Math.abs(pieceX - minX) / width)
            : Math.ceil(Math.abs(pieceX - minX) / width);

        const j = (pieceY - minY) % height < (height / 2)
            ? Math.floor(Math.abs(pieceY - minY) / height)
            : Math.ceil(Math.abs(pieceY - minY) / height);
        
        return (horizontalAxisState.current[i]+vertcleAxisState.current[j]) as PositionNotation;
    };
    
    const grabPiece = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
        const isTouch = e.type === 'touchstart';
        if (isTouch) {
            e.preventDefault(); // Prevent page scrolling on touch devices
        }
    
        const clientX = isTouch ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = isTouch ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
    
        if (count.current === 1 && role.current === 'PLAYER') {
            const element = e.target as HTMLDivElement; // chess piece element
    
            if (turn.current) {
                if (element.classList.contains('chess-piece')) {
                    const chessboard = chessBoardRef.current!;
                    const height = chessboard.offsetHeight / 8;
                    const width = chessboard.offsetWidth / 8;
    
                    const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
                    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    
                    const pieceX = clientX - width / 2 + scrollLeft;
                    const pieceY = clientY - height / 2 + scrollTop;
    
                    element.style.position = 'absolute';
                    element.style.left = `${pieceX}px`;
                    element.style.top = `${pieceY}px`;
                    element.style.zIndex = '5';
                    element.style.width = `${width}px`;
                    element.style.height = `${height}px`;
    
                    // Add event listeners for touch and mouse
                    document.addEventListener('mouseup', dropPiece);
                    document.addEventListener('touchend', dropPiece);
    
                    pickedPiece.current = {
                        element,
                        position: cellPosition(element)
                    };
                    console.log('grabPiece: ', pickedPiece.current.position);
    
                    ws.current!.send(JSON.stringify({
                        type: 'PICK',
                        position: pickedPiece.current.position
                    }));
                }
            } else {
                console.log('turn: ', turn.current);
            }
        }
    };
    
    const movePiece = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
        const isTouch = e.type === 'touchmove';
        if (isTouch) {
            e.preventDefault(); // Prevent page scrolling on touch devices
        }
    
        const clientX = isTouch ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = isTouch ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
    
        const chessboard = chessBoardRef.current;
        if (pickedPiece.current && chessboard) {
            const height = chessboard.offsetHeight / 8;
            const width = chessboard.offsetWidth / 8;
    
            const minX = chessboard.offsetLeft;
            const minY = chessboard.offsetTop;
            const maxX = minX + chessboard.offsetWidth - width;
            const maxY = minY + chessboard.offsetHeight - height;
    
            const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
    
            const pieceX = clientX - width / 2 + scrollLeft;
            const pieceY = clientY - height / 2 + scrollTop;
    
            pickedPiece.current.element!.style.position = 'absolute';
            pickedPiece.current.element!.style.left =
                pieceX < minX ? `${minX}px` : pieceX > maxX ? `${maxX}px` : `${pieceX}px`;
            pickedPiece.current.element!.style.top =
                pieceY < minY ? `${minY}px` : pieceY > maxY ? `${maxY}px` : `${pieceY}px`;
        }
    };
    
    
    const dropPiece = (e: MouseEvent | TouchEvent) => {
        const chessboard = chessBoardRef.current;
        const dropPosition = cellPosition(pickedPiece.current!.element);
        console.log('dropPosition: ', dropPosition);
    
        if (pickedPiece.current?.element && chessboard && validMoves.current.includes(dropPosition)) {
            removeValidMoves();
    
            const newBoard = board.map(row => row.slice());
    
            let { y, x } = index(pickedPiece.current.position);
            const from = {
                position: pickedPiece.current.position,
                piece: newBoard[y][x]
            };
            newBoard[y][x] = 9;
            ({ y, x } = index(dropPosition));
            const to = {
                position: dropPosition,
                piece: newBoard[y][x]
            };
            newBoard[y][x] = from.piece;
    
            const move = { from, to };
    
            ws.current!.send(JSON.stringify({
                type: 'PLACE',
                position: dropPosition,
                move
            }));
    
            setBoard(newBoard);
            turn.current = false;
    
        } else {
            pickedPiece.current!.element!.style.position = '';
            pickedPiece.current!.element!.style.left = `0px`;
            pickedPiece.current!.element!.style.top = `0px`;
            pickedPiece.current!.element!.style.zIndex = '0';
            pickedPiece.current!.element!.style.width = '';
            pickedPiece.current!.element!.style.height = '';
        }
        pickedPiece.current = null;
    
        document.removeEventListener('mouseup', dropPiece);
        document.removeEventListener('touchend', dropPiece);
    };    

    const removeValidMoves = () => {
        if (validMoves) {
            validMoves.current.forEach(position => {
                document.getElementById(position)?.classList.remove('valid-move')
            })
        }
        validMoves.current = []
    }

    const undo = () => {
        removeValidMoves();
            
        if (count.current <= movesArray.current.length) {
            
            const move = movesArray.current[movesArray.current.length - count.current];
            count.current++;

            const newBoard = board.map(row => row.slice());

            let { y, x } = index(move.to.position);
            newBoard[y][x] = move.to.piece;
            ({ y, x } = index(move.from.position));
            newBoard[y][x] = move.from.piece;

            setBoard(newBoard);
        }
    }

    const redo = () => {
        removeValidMoves();

        if (count.current > 1) {
            count.current--;
            const move = movesArray.current[movesArray.current.length - count.current];

            const newBoard = board.map(row => row.slice());

            let { y, x } = index(move.to.position);
            newBoard[y][x] = move.promoteTo || move.from.piece;
            ({ y, x } = index(move.from.position));
            newBoard[y][x] = 9;

            setBoard(newBoard);
        }
    }
    const currentStateFromLocalStorage = () => {

    }
    const currentStateFromServer = () => {
        if (ws.current) {
            ws.current.send(JSON.stringify({
                type: 'CURRENT_STATE'
            }));            
        }       
    }

    const quitGame = () =>{
        if (!GAME_OVER.current && ws.current) { // in game playing
            ws.current!.send(JSON.stringify({
                type: 'QUIT_GAME',
            }));
        } else if (GAME_OVER.current && ws.current) { // waiting
            ws.current!.send(JSON.stringify({
                type: 'QUIT_WAITING',
            }));
            ws.current!.close();
            navigate('/dashboard');
        } else{
            navigate('/dashboard');
        }
    }

    const exitGame = () =>{
        if (!GAME_OVER.current && ws.current) {
            ws.current!.send(JSON.stringify({
                type: 'STOP_SPECTATING',
            }));
            ws.current!.close();
        }
        navigate('/dashboard')
    }
    const setBoardToThisMove = (moveNnumber: number) => {
        const countDestination = movesArray.current.length-moveNnumber;
        const newBoard = board.map(row => row.slice());

        while (countDestination < count.current) {
            count.current--;
            const move = movesArray.current[movesArray.current.length - count.current];

            let { y, x } = index(move.to.position);
            newBoard[y][x] = move.promoteTo || move.from.piece;
            ({ y, x } = index(move.from.position));
            newBoard[y][x] = 9;
        }
        while (countDestination > count.current) {
            const move = movesArray.current[movesArray.current.length - count.current];
            count.current++;

            let { y, x } = index(move.to.position);
            newBoard[y][x] = move.to.piece;
            ({ y, x } = index(move.from.position));
            newBoard[y][x] = move.from.piece;
        }
        setBoard(newBoard);
    }

    return (
        <div className='room'>
            <div className='chessboard'>
                <div className="opponent">
                    { players.current[1] &&
                        <>
                        {/* <div className="pic">pic</div> */}
                        <div className="name">{players.current[1]!.name}</div>
                        <div className="rating">{players.current[1].rating}</div>
                        {/* <div className="rank">{players.current[1]!.rank}</div> */}
                        <Timer  {...{player: players.current[1]}} />
                        </>
                    }
                </div>

                <div className='verticle'>
                    {vertcleAxisState.current.map((x, index) => (
                        <div key={index}>{x}</div>
                    ))}
                </div>

                <div className='grid'
                    ref={chessBoardRef}
                    onMouseDown={grabPiece}
                    onMouseMove={movePiece}
                    onTouchStart={grabPiece}
                    onTouchMove={movePiece}
                    >
                    {boardFromArray(board, vertcleAxisState.current, horizontalAxisState.current, chessBoardRef.current?.offsetHeight!, chessBoardRef.current?.offsetWidth!)}
                </div>

                <div className='horizontal'>
                    {horizontalAxisState.current.map((x, index) => (
                        <div key={index}>{x}</div>
                    ))}
                </div>

                <div className="player">
                    { players.current[0] &&
                        <>
                        {/* <div className="pic">pic</div> */}
                        <div className="name">{players.current[0].name}</div>
                        <div className="rating">{players.current[0].rating}</div>
                        {/* <div className="rank">{players.current[0].rank}</div> */}
                        {/* <Timer  player={players.current[0]} /> */}
                        <Timer  {...{player: players.current[0]}} />
                        </>
                    }
                </div>
            </div>

            <div className="ingame-buttons">
                <button className="flip" onClick={flipBoard}>Flip</button>

                <button className="quit" onClick={ role.current==='PLAYER' ? quitGame : exitGame }>{ role.current==='PLAYER' ? 'Quit' : 'Exit' }</button>
            </div>

            <MovesPanel {...{movesArray, undo, redo, currentStateFromServer, indexToNotation, setBoardToThisMove}} />

            <dialog className='dialog-room' ref={dialogBoxRef}>
                <p>{`${dialogMessage}`}</p>
            </dialog>

            <dialog className='pawnPromotionDialog' ref={pawnPromotionDialog}>
                {promotionChoices.map((piece, index) => (
                    <button
                        key={index}
                        onClick={() => {
                            ws.current!.send(JSON.stringify({ type: 'PROMOTE_TO', piece }));
                            pawnPromotionDialog.current!.close();
                        }}
                    >
                        {piece % 10 === 1 ? 'Rook' : piece % 10 === 2 ? 'Knight' : piece % 10 === 3 ? 'Bishop' : 'Queen'}
                    </button>
                ))}
            </dialog>
        </div>
    )
}

export default ChessBoard;
