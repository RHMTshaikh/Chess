import React, { useRef, useState, useEffect } from 'react';
import { useGameContext } from '../hooks/useGameContext';
import { useNavigate } from 'react-router-dom';
import { Move, Position, PositionNotation } from '../types';
import MovesPanel from './MovesPanel';

function boardFromArray(board:number[][], vertcleAxis: number[], horizontalAxis:string[], heightChessBoard:number, widthChessBoard: number) : React.ReactNode[]{
    const tiles: React.ReactNode[] = [];
    let toggle = true;
    const height = heightChessBoard/8;
    const width = widthChessBoard/8;
    console.log(height, width);
    
    
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

interface ActivePiece {
    element: HTMLDivElement,
    position: PositionNotation
}
interface ChessBoardProps {
    ws: React.RefObject<WebSocket | null>;
}

const ChessBoard: React.FC<ChessBoardProps> = ({ ws }) => {
    const {game:gameState, dispatch: gamedDispatch} = useGameContext();
    const chessBoardRef = useRef<HTMLDivElement>(null);
    const activePiece  = useRef<ActivePiece | null>(null);
    const count = useRef<number>(1);
    const validMoves = useRef<PositionNotation[]>([]);
    const opponentLeft = useRef<boolean>(false);
    
    const role = useRef<string>( gameState!.role);
    
    const turn = useRef<boolean>(gameState?.turn!);
    
    const pieceColor = useRef<string | null>(gameState?.pieceColor!);
    
    const movesArray = useRef<Move[]>(gameState!.moves);
    
    const board = useRef<number[][]>(gameState!.board);
    const flip = useRef(false);
    const vertcleAxisState = useRef([8, 7, 6, 5, 4, 3, 2, 1,]);
    const horizontalAxisState = useRef(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']);
    
    const flipBoard = () => {
        flip.current = !flip.current;
        board.current = board.current.map(row => row.slice().reverse()).reverse();
        vertcleAxisState.current = vertcleAxisState.current.reverse();
        horizontalAxisState.current = horizontalAxisState.current.reverse();
        gamedDispatch({type: 'SET-BOARD', payload: { board: board.current }})
    }    

    const [reason, setReason] = useState('')
    const navigate =  useNavigate()
    const dialogRef = useRef<HTMLDialogElement>(null)
    
    useEffect(() => {

        if (pieceColor.current === 'black') {
            console.log('flip in use effect');
            flipBoard();        
            
        }else{
            console.log('no flip in use effect');
            
            gamedDispatch({ type: 'SET-BOARD', payload: { board: board.current }})
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

    ws.current!.onmessage = (event: MessageEvent) => {
        
        const json: {
            type: 'ERROR',
            error: string
        } | {
            type: 'VALID_MOVES',
            validMoves: PositionNotation[]
        } | {
            type: 'OPPONENT_MOVE',
            move: Move,
            board: number[][],
            turn: boolean,
        } | {
            type: 'MOVE',
            move: Move,
            board: number[][]
        } | {
            type: 'CURRENT_STATE',
            board: number[][]
        } | {
            type: 'OPPONENT_LEFT',
            message: string
        } | {
            type: 'PLAYER_LEFT',
            message: string
        } | {
            type: 'GAME_OVER',
            message: string
        } = JSON.parse(event.data);
        console.log('Message from websocket server:', json);

        if (json.type === 'ERROR') {
            console.log(json.error);
            return
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
            const chessboard = chessBoardRef.current;
            
            if (chessboard) {
                if (flip.current) {
                    json.board = json.board.map(row => row.slice().reverse()).reverse();
                }
                board.current = json.board
                
                count.current = 1
                movesArray.current.push(json.move);
                console.log('dispatching move');
                
                gamedDispatch({ type: 'MOVE', payload: { move: json.move, board:board.current, turn:json.turn } });
                    
                turn.current = true
            }
            return
        }
        if (json.type === 'MOVE') { // for spectator
            if (flip.current) {
                json.board = json.board.map(row => row.slice().reverse()).reverse();
            }
            board.current = json.board
            movesArray.current.push(json.move)
            count.current = 1;
            gamedDispatch({ type: 'MOVE', payload: { move: json.move, board: board.current, turn: false } })
            return
        }
        if (json.type === 'CURRENT_STATE') {
            board.current = json.board
            if (board) {
                if (flip.current) {
                    board.current = board.current.map(row => row.slice().reverse()).reverse();
                }
                count.current = 1;
                gamedDispatch({ type: 'SET-BOARD', payload: { board: board.current }})
            }
            return
        }
        if (json.type === 'OPPONENT_LEFT') {
            opponentLeft.current = true
            setReason(json.message)
            dialogRef.current!.showModal()
            ws.current?.close();
            return
        }
        if (json.type === 'PLAYER_LEFT') {
            opponentLeft.current = true
            setReason(json.message)
            dialogRef.current!.showModal()
            ws.current?.close();
            return
        }
        if (json.type === 'GAME_OVER') {
            opponentLeft.current = true
            setReason(json.message)
            dialogRef.current!.showModal()
            ws.current?.close();
            return
        }
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

    // const tileDivElement = (y:number, x:number, piece:number) => {
    //     const imgSrc = piece !== 9 ? `assets/image/${piece<9 ? ('0'+piece):(piece)}.png` : '';

    //     return (
    //         <div 
    //             className={`tile ${((x+y) % 2 === 0) ? 'white-tile' : 'black-tile'}`} 
    //             id={`${horizontalAxisState.current[x]}${vertcleAxisState.current[y]}`} 
    //             key={`${horizontalAxisState.current[x]}${vertcleAxisState.current[y]}`}
    //         >
    //             {imgSrc && <div style={{ backgroundImage: `url(${imgSrc})` }} className="chess-piece"></div>}
    //         </div>
    //     )
    // }
    
    const grabPiece = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if (count.current === 1 && role.current === 'PLAYER' ) {
            const element = e.target as HTMLDivElement; //chess piece element
            
            if (turn.current) {
                if (element.classList.contains('chess-piece')) {
                    const height = chessBoardRef.current?.offsetHeight! / 8;
                    const width = chessBoardRef.current?.offsetWidth! / 8;
                    const x = e.clientX - width / 2;
                    const y = e.clientY - height / 2;
                    element.style.position = 'absolute';
                    element.style.left = `${x}px`;
                    element.style.top = `${y}px`;
                    element.style.zIndex = '5';
                    element.style.width = `${width}px`;
                    element.style.height = `${height}px`;
                    document.addEventListener('mouseup', dropPiece);
                    
                    activePiece.current = {
                        element,
                        position: cellPosition(element)
                    }
                    console.log('grabPiece: ', activePiece.current.position);
                    
                    ws.current!.send(JSON.stringify({
                        type: 'PICK',
                        position: activePiece.current.position
                    }))
                }
            }else console.log('turn: ', turn.current);
        }
    };

    const movePiece = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
       
        const chessboard = chessBoardRef.current;
        if (activePiece.current && chessboard) {
            const height = chessBoardRef.current?.offsetHeight! / 8;
            const width = chessBoardRef.current?.offsetWidth! / 8;
            const minX = chessboard.offsetLeft;
            const minY = chessboard.offsetTop;
            const maxX = minX + chessboard.offsetWidth;
            const maxY = minY + chessboard.offsetHeight;

            const pieceX = e.clientX - height / 2;
            const pieceY = e.clientY - width / 2;
            
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
        console.log('dropPosition: ', dropPosition);
        
        
        if (activePiece.current?.element && chessboard && validMoves.current.includes(dropPosition)) {

            removeValidMoves();

            let {y, x} = index(activePiece.current.position);
            const from = {
                position: (activePiece.current.position),
                piece: board.current[y][x]
            };
            board.current[y][x] = 9;
            ({y,x} = index(dropPosition));
            const to = {
                position: (dropPosition),
                piece: board.current[y][x]
            };
            board.current[y][x] = from.piece;

            const move = {from, to};

            ws.current!.send(JSON.stringify({
                type: 'PLACE',
                position: dropPosition,
                move //imgSrcPrev ? parseInt(imgSrcPrev.slice(-6,-4)) : 9
            }))

            movesArray.current.push(move)
            turn.current = false
            gamedDispatch({ type: 'MOVE', payload: {move:move, board: board.current, turn: turn.current} })

        } else{
            activePiece.current!.element!.style.position = '';
            activePiece.current!.element!.style.left = `0px`
            activePiece.current!.element!.style.top  = `0px`
            activePiece.current!.element!.style.zIndex = '0'
            activePiece.current!.element!.style.width = ''
            activePiece.current!.element!.style.height = ''
        }
        activePiece.current = null
        document.removeEventListener('mouseup', dropPiece);
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
            
            const move = movesArray.current[movesArray.current.length-count.current]
            count.current++;

            let {y, x} = index(move.to.position);
            board.current[y][x] = move.to.piece;
            ({y, x} = index(move.from.position));
            board.current[y][x] = move.from.piece;

            gamedDispatch({ type: 'SET-BOARD', payload: { board: board.current }})
        }
    }

    const redo = () => {
        if (validMoves) {
            validMoves.current.forEach(position => {
                document.getElementById(position)?.classList.remove('valid-move')
            })
        }
        validMoves.current = []

        if (count.current > 1) {
            count.current--;
            const move = movesArray.current[movesArray.current.length-count.current]

            let {y, x} = index(move.to.position);
            board.current[y][x] = move.from.piece;
            ({y, x} = index(move.from.position));
            board.current[y][x] = 9;

            gamedDispatch({ type: 'SET-BOARD', payload: { board: board.current }})
        }
    }
    const currentStateFromLocalStorage = () => {

    }
    const currentStateFromServer = () => {
        ws.current!.send(JSON.stringify({
            type: 'CURRENT_STATE',
        }))        
    }
    const quitGame = () =>{
        if (!opponentLeft.current) {
            ws.current!.send(JSON.stringify({
                type: 'QUIT_GAME',
            }));
            ws.current!.close();
        }
        gamedDispatch({ type: 'END-GAME'})
        navigate('/dashboard');
    }
    const exitGame = () =>{
        if (!opponentLeft.current) {
            ws.current!.send(JSON.stringify({
                type: 'STOP_SPECTATING',
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
                    {vertcleAxisState.current.map((x, index) => (
                        <div key={index}>{x}</div>
                    ))}
                </div>
                <div
                    className='grid'
                    ref={chessBoardRef}
                    onMouseDown={grabPiece}
                    onMouseMove={movePiece}
                >
                    {boardFromArray(board.current, vertcleAxisState.current, horizontalAxisState.current, chessBoardRef.current?.offsetHeight!, chessBoardRef.current?.offsetWidth!)}
                </div>
                <div className='horizontal'>
                    {horizontalAxisState.current.map((x, index) => (
                        <div key={index}>{x}</div>
                    ))}
                </div>
            </div>

            <div className="ingame-buttons">
                <button className="flip" onClick={flipBoard}>Flip</button>

                <button className="quit" onClick={ role.current==='PLAYER' ? quitGame : exitGame }>{ role.current==='PLAYER' ? 'Quit' : 'Exit' }</button>
            </div>

            <MovesPanel movesArray={movesArray} undo={undo} redo={redo} currentStateFromServer={currentStateFromServer} indexToNotation={indexToNotation} />

            <dialog className='dialog-room' ref={dialogRef}>
                <p>{`${reason}`}</p>
            </dialog>
        </>
    )
}

export default ChessBoard;
