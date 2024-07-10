// Chess\frontend\src\components\ChessBoard.tsx

import React, { useRef, useState, useEffect } from 'react';
import { useGameContext } from '../hooks/useGameContext';
import { useNavigate, useLocation } from 'react-router-dom';

function boardFromArray(board:number[][], vertcleAxis: number[], horizontalAxis:string[]) : React.ReactNode[]{
    const tiles: React.ReactNode[] = [];
    let toggle = true;
    vertcleAxis.forEach(v => {
        horizontalAxis.forEach(h => {
            let piece = board[8-v][h.charCodeAt(0)-'a'.charCodeAt(0)];
            const imgSrc = piece !== 9 ? `assets/image/${piece<9 ? ('0'+piece):(piece)}.png` : '';
            
            tiles.push(
                <div 
                    className={`tile ${toggle ? 'white-tile' : 'black-tile'}`} 
                    id={`${h}${v}`} 
                    key={`${h}${v}`}
                    >
                    {imgSrc && <div style={{ backgroundImage: `url(${imgSrc})` }} className="chess-piece"></div>}
                </div>
            );
            toggle = !toggle;
        })
        toggle = !toggle;
    })
    return tiles
}
interface Move {
    from: string,
    to: string,
    piece: number,
}
interface ActivePiece {
    element: HTMLDivElement,
    position: string
}
interface ChessBoardProps {
    ws: React.RefObject<WebSocket | null>;
    mode: React.RefObject<string>
}

const ChessBoard: React.FC<ChessBoardProps> = ({ ws , mode }) => {
    const [boardState, setBoardState] = useState<React.ReactNode[]>([]);
    const chessBoardRef = useRef<HTMLDivElement>(null);
    let activePiece  = useRef<ActivePiece | null>(null);
    const {game:gameState, dispatch: gamedDispatch} = useGameContext()
    let movesArray = useRef<Move[]>(gameState!.moves);
    let count = useRef<number>(1);
    let validMoves:string[] | null = null
    let opponentLeft = useRef<boolean>(false)
    
    let turn = useRef<Boolean>( gameState!.pieceColor === 'black' ? false : true )
    let board: number[][]
    board = gameState!.board
    
    
    let pieceColor = gameState!.pieceColor
    const [reason, setReason] = useState('')
    const navigate =  useNavigate()
    const dialogRef = useRef<HTMLDialogElement>(null)
    
    const vertcleAxis = 
        pieceColor === 'black' ? 
        [1, 2, 3, 4, 5, 6, 7, 8] : 
        [8, 7, 6, 5, 4, 3, 2, 1,] ;
    const horizontalAxis = 
        pieceColor === 'black' ? 
        ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'] : 
        ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

    function index(position: string):{
        y: number, //row
        x: number, //column
    } { // position: a3
        let x = horizontalAxis.indexOf(position.charAt(0));
        let y = vertcleAxis.indexOf(parseInt(position.charAt(1)))
        return {y,x}
    }

    useEffect(() => {
        if (board) {
            const tiles = boardFromArray(board, vertcleAxis, horizontalAxis)
            setBoardState(tiles);
        }
        const unload = (e: BeforeUnloadEvent) =>{
            e.preventDefault();
            if (!opponentLeft) {
                quitGame()
            }
        }
        window.addEventListener('beforeunload', unload)
        dialogRef.current!.addEventListener("click", e => {
            const dialogDimensions = dialogRef.current!.getBoundingClientRect()
            if (
              e.clientX < dialogDimensions.left ||
              e.clientX > dialogDimensions.right ||
              e.clientY < dialogDimensions.top ||
              e.clientY > dialogDimensions.bottom
            ) {
              dialogRef.current!.close()
            }
        })
        
        return () =>{
            window.removeEventListener('beforeunload', unload)
        }
    }, []);

    ws.current!.onmessage = (event: MessageEvent) => {
        console.log('Message from server:', event.data);

        const json = JSON.parse(event.data);
        console.log(json);

        if (json.type === 'error') {
            console.log(json.error);
            return
        }
        if (json.type === 'valid-moves') {
            if (validMoves) {
                validMoves.forEach(position => {
                    document.getElementById(position)?.classList.remove('valid-move')
                })
            }
            validMoves = json.validMoves
            if (validMoves) {
                validMoves.forEach(position => {
                    document.getElementById(position)?.classList.add('valid-move')
                });
            }
            return
        }
        if (json.type === 'opponents-move') {
            const chessboard = chessBoardRef.current;
            
            if (chessboard) {
                const {from, to} = json.move
                const board = json.board

                if (count.current > 1) {
                    count.current = 1
                    const tiles = boardFromArray(board, vertcleAxis, horizontalAxis)
                    gamedDispatch({ type: 'MOVE', payload: { move: json.move, board } })
                    setBoardState(tiles);
                } else {
                    const newTilesState = [...boardState];
                    
                    let {y, x} = index(to);
                    let piece:number
    
                    if (pieceColor === 'black') {
                        piece = board[7-y][7-x]
                    }else{
                        piece = board[y][x]
                    }
                    newTilesState[y*8 + x] = (
                        tileDivElement(y,x,piece)
                    );
    
                    ({y, x} = index(from))
                    
                    newTilesState[y*8 + x] = (
                        tileDivElement(y,x,9)
                    );
                    
                    turn.current= true
                    movesArray.current.push(json.move)
                    gamedDispatch({ type: 'MOVE', payload: { move: json.move, board } })
                    setBoardState(newTilesState);
                }
            }
            return
        }
        if (json.type === 'move') {
            board = json.board
            const tiles = boardFromArray(board, vertcleAxis, horizontalAxis)
            movesArray.current.push(json.move)
            count.current = 1;
            gamedDispatch({ type: 'MOVE', payload: { move: json.move, board } })
            setBoardState(tiles);
            return
        }
        if (json.type === 'current-state') {
            board = json.board
            if (board) {
                const tiles = boardFromArray(board, vertcleAxis, horizontalAxis)
                count.current = 1;
                gamedDispatch({ type: 'SET-BOARD', payload: { board }})
                setBoardState(tiles);
            }
            return
        }
        if (json.type === 'opponent-left') {
            opponentLeft.current = true
            setReason(json.type+' '+json.winner+' wins')
            dialogRef.current!.showModal()
            ws.current?.close();
            return
        }
        if (json.type === 'game-ended') {
            opponentLeft.current = true
            setReason(json.type+' '+json.winner+' wins')
            dialogRef.current!.showModal()
            return
        }
    }

    const cellPosition = (element: HTMLDivElement): string  => {
        const chessboard = chessBoardRef.current;
        if (element && chessboard) {
            const minX = chessboard.offsetLeft + 30;
            const minY = chessboard.offsetTop + 30;
    
            const pieceX = element.offsetLeft + 30;
            const pieceY = element.offsetTop + 30;
    
            const i = (pieceX - minX) % 60 < 30
                ? Math.floor(Math.abs(pieceX - minX) / 60)
                : Math.ceil(Math.abs(pieceX - minX) / 60);
    
            const j = (pieceY - minY) % 60 < 30
                ? Math.floor(Math.abs(pieceY - minY) / 60)
                : Math.ceil(Math.abs(pieceY - minY) / 60);
            
            return horizontalAxis[i]+vertcleAxis[j];
        }
        return ''
    }
    function tileDivElement(y:number, x:number, piece:number) {
        const imgSrc = piece !== 9 ? `assets/image/${piece<9 ? ('0'+piece):(piece)}.png` : '';

        return (
            <div 
                className={`tile ${((x+y) % 2 === 0) ? 'white-tile' : 'black-tile'}`} 
                id={`${horizontalAxis[x]}${vertcleAxis[y]}`} 
                key={`${horizontalAxis[x]}${vertcleAxis[y]}`}
            >
                {imgSrc && <div style={{ backgroundImage: `url(${imgSrc})` }} className="chess-piece"></div>}
            </div>
        )
    }
    
    
    const grabPiece = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if (count.current === 1 && mode.current === 'play' ) {
            const element = e.target as HTMLDivElement; //chess piece element
            
            if (turn.current) {
                if (element.classList.contains('chess-piece')) {
                    const x = e.clientX - 30;
                    const y = e.clientY - 30;
                    element.style.position = 'absolute';
                    element.style.left = `${x}px`;
                    element.style.top = `${y}px`;
                    element.style.zIndex = '5'
                    document.addEventListener('mouseup', dropPiece);
                    
                    activePiece.current = {
                        element,
                        position: cellPosition(element)
                    }
                    ws.current!.send(JSON.stringify({
                        type: 'pick',
                        position: activePiece.current.position
                    }))
                }
            }else console.log('turn: ', turn.current);
        }
        
    };

    const movePiece = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
       
        const chessboard = chessBoardRef.current;
        if (activePiece.current && chessboard) {
            const minX = chessboard.offsetLeft;
            const minY = chessboard.offsetTop;
            const maxX = minX + chessboard.offsetWidth;
            const maxY = minY + chessboard.offsetHeight;

            const pieceX = e.clientX - 30;
            const pieceY = e.clientY - 30;
            
            activePiece.current.element!.style.position = 'absolute';
            activePiece.current.element!.style.left = 
                e.clientX < minX ? 
                `${minX - 25}px` : 
                e.clientX > maxX ? 
                    `${maxX - 35}px` : 
                    `${pieceX}px`;
            activePiece.current.element!.style.top = 
                e.clientY < minY ? 
                    `${minY - 25}px` : 
                    e.clientY > maxY ? 
                        `${maxY - 35}px` : 
                        `${pieceY}px`;         
        }
    };

    const dropPiece = (e: MouseEvent) => {
        const chessboard = chessBoardRef.current;
        const dropPosition = cellPosition(activePiece.current!.element)
        
        if (activePiece.current?.element && chessboard && validMoves?.includes(dropPosition)) {
            let {y, x} = index(dropPosition);
            let piece:number
            if (pieceColor === 'black') {
                piece = board[7-y][7-x]
            }else{
                piece = board[y][x]
            }
            const move = {
                from: activePiece.current.position,
                to : dropPosition,
                piece,
            };
            
            ({y, x} = index(activePiece.current.position!))
            if (pieceColor === 'black') {
                piece = board[7-y][7-x]
                board[7-y][7-x] = 9
            }else{
                piece = board[y][x]
                board[y][x] = 9
            }
            const newTilesState = [...boardState];
            newTilesState[y*8 + x] = (
                tileDivElement(y,x,9)
            );

            ({y, x} = index(dropPosition))
            if (pieceColor === 'black') {
                board[7-y][7-x] = piece
            }else{
                board[y][x] = piece
            }
            newTilesState[y*8 + x] = (
                tileDivElement(y,x,piece)
            );

           

            validMoves.forEach(position => {
                document.getElementById(position)?.classList.remove('valid-move')
            })
            validMoves = []

            ws.current!.send(JSON.stringify({
                type: 'place',
                position: dropPosition,
                piece: move.piece //imgSrcPrev ? parseInt(imgSrcPrev.slice(-6,-4)) : 9
            }))

            
            movesArray.current.push(move)
            gamedDispatch({ type: 'MOVE', payload: {move, board} })


            turn.current = false
            setBoardState(newTilesState);
        } else{
            activePiece.current!.element!.style.position = '';
            activePiece.current!.element!.style.left = `0px`
            activePiece.current!.element!.style.top  = `0px`
        }
        activePiece.current = null
        document.removeEventListener('mouseup', dropPiece);
    };

    const undo = () => {
        if (validMoves) {
            validMoves.forEach(position => {
                document.getElementById(position)?.classList.remove('valid-move')
            })
        }
        validMoves = []
            
        if (count.current <= movesArray.current.length) {
            
            let newTilesState = [...boardState]
            const move = movesArray.current[movesArray.current.length-count.current]
            count.current++;

            let {y, x} = index(move.to)
            let piece:number
            if (pieceColor === 'black') {
                piece = board[7-y][7-x]
                board[7-y][7-x] = move.piece
            }else{
                piece = board[y][x]
                board[y][x] = move.piece
            }
            newTilesState[y*8 + x] = (
                tileDivElement(y,x,move.piece)
            );
            
            ({y, x} = index(move.from))
            newTilesState[y*8 + x] = (
                tileDivElement(y,x,piece)
            );
            if (pieceColor === 'black') {
                board[7-y][7-x] = piece
            }else{
                board[y][x] = piece
            }

            gamedDispatch({ type: 'SET-BOARD', payload: { board }})
            setBoardState(newTilesState)
        }
    }
    const redo = () => {
        if (validMoves) {
            validMoves.forEach(position => {
                document.getElementById(position)?.classList.remove('valid-move')
            })
        }
        validMoves = []

        if (count.current > 1) {
            let newTilesState = [...boardState]
            count.current--;
            const move = movesArray.current[movesArray.current.length-count.current]

            let {y, x} = index(move.from)
            let piece:number
            if (pieceColor === 'black') {
                piece = board[7-y][7-x]
                board[7-y][7-x] = 9
            }else{
                piece = board[y][x]
                board[y][x] = 9
            }
            newTilesState[y*8 + x] = (
                tileDivElement(y,x,9)
            );
            
            ({y, x} = index(move.to))
            newTilesState[y*8 + x] = (
                tileDivElement(y,x,piece)
            );
            if (pieceColor === 'black') {
                board[7-y][7-x] = piece
            }else{
                board[y][x] = piece
            }

            gamedDispatch({ type: 'SET-BOARD', payload: { board }})
            setBoardState(newTilesState)
        }
    }
    const currentState = () => {
        ws.current!.send(JSON.stringify({
            type: 'current-state'
        }))
    }
    const quitGame = () =>{
        if (!opponentLeft.current) {
            ws.current!.send(JSON.stringify({
                type: 'leave-game',
            }));
            ws.current!.close();
        }
        gamedDispatch({ type: 'END-GAME'})
        navigate('/dashboard');
    }
    const exitGame = () =>{
        if (!opponentLeft.current) {
            ws.current!.send(JSON.stringify({
                type: 'stop-spectating',
            }))
            ws.current!.close();
        }
        gamedDispatch({ type: 'END-GAME'})
        navigate('/dashboard')
    }

    return (
        <>
            <div className='chessboard'>
                <div className='verticle'>
                    {vertcleAxis.map((x, index) => (
                        <div key={index}>{x}</div>
                    ))}
                </div>
                <div
                    className='grid'
                    ref={chessBoardRef}
                    onMouseDown={grabPiece}
                    onMouseMove={movePiece}
                >
                    {boardState}
                </div>
                <div className='horizontal'>
                    {horizontalAxis.map((x, index) => (
                        <div key={index}>{x}</div>
                    ))}
                </div>
            </div>
            <div>
                <div className="move-panel">
                    <div className="moves">
                        <ul>
                            {movesArray.current.map((move, index) => (
                                <li key={index}>
                                    <div className="number">{`${index+1}.`}</div><div className="from">{move.from}</div><div className="to">{move.to}</div> <div className={`piece piece-${move.piece<9 ? ('0'+move.piece):(move.piece)}`}></div>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="undo-redo-btn">
                        <button onClick={undo}>undo</button>
                        <button onClick={redo}>redo</button>
                        <button onClick={currentState}>current</button>
                    </div>
                </div>
                <button className="quit" onClick={ mode.current==='play' ? quitGame : exitGame }>{ mode.current==='play' ? 'Quit' : 'Exit' }</button>
            </div>
            <dialog className='dialog-room' ref={dialogRef}>
                <p>{`${reason}`}</p>
            </dialog>
        </>
    )
}

export default ChessBoard;
