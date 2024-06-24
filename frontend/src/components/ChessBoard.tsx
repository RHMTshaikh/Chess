// ChessBoard.tsx
import React, { useRef, useState, useEffect } from 'react';
import './ChessBoard.css';

interface ChessBoardProps {
    board: number[][] | null;
    ws: React.RefObject<WebSocket | null>;
    pieceColor: React.SetStateAction<string | null>
}
interface Move {
    from: string,
    to: string,
    imgSrc: string
}
interface ActivePiece {
    element: HTMLDivElement,
    position: string
}

function boardFromArray(board:number[][], vertcleAxis: number[], horizontalAxis:string[]) : React.ReactNode[]{
    const tiles: React.ReactNode[] = [];
    let toggle = true;
    vertcleAxis.forEach(v => {
        horizontalAxis.forEach(h => {
            const piece = board[8-v][h.charCodeAt(0)-'a'.charCodeAt(0)];
            const imgSrc = piece !== 9 ? `assets/image/${piece}.png` : '';
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

const ChessBoard: React.FC<ChessBoardProps> = ({ board, ws, pieceColor}) => {
    const [boardState, setBoardState] = useState<React.ReactNode[]>([]);
    const chessBoardRef = useRef<HTMLDivElement>(null);
    let activePiece  = useRef<ActivePiece | null>(null);
    let turn = useRef<Boolean>(pieceColor==='black'? false : true)
    let movesArray = useRef<Move[]>([]);
    let count = useRef<number>(1);
    let validMoves:string[] | null = null

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
    }, []);

    ws.current!.onmessage = (event: MessageEvent) => {
        console.log('Message from server:', event.data);
        const json = JSON.parse(event.data);
        console.log(json.type);
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
                const newTilesState = [...boardState];
                
                let {y, x} = index(from)
                newTilesState[y*8 + x] = (
                    tileDivElement(y,x,'')
                );

                const pieceElement = chessboard.querySelector(`#${from}`) as HTMLElement;
                let imgSrc = window.getComputedStyle(pieceElement.firstElementChild!).backgroundImage.slice(5, -2);
                
                ({ y, x } = index(to));
                newTilesState[y*8 + x] = (
                    tileDivElement(y,x,imgSrc)
                );
                turn.current= !turn.current
                movesArray.current.push({from, to, imgSrc: json.imgSrc})
                setBoardState(newTilesState);
            }
            return
        }
        if (json.type === 'current-state') {
            const board = json.board
            if (board) {
                const tiles = boardFromArray(board, vertcleAxis, horizontalAxis)
                setBoardState(tiles);
            }
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

    function tileDivElement(y:number, x:number, imgSrc:string) {
        if (imgSrc) {
            return (
                <div 
                    className={`tile ${((x+y) % 2 === 0) ? 'white-tile' : 'black-tile'}`} 
                    id={`${horizontalAxis[x]}${vertcleAxis[y]}`} 
                    key={`${horizontalAxis[x]}${vertcleAxis[y]}`}
                >
                    <div style={{ backgroundImage: `url(${imgSrc})` }} className="chess-piece"></div>
                </div>
            )
        }else{
            return (
                <div 
                    className={`tile ${((x+y) % 2 === 0) ? 'white-tile' : 'black-tile'}`} 
                    id={`${horizontalAxis[x]}${vertcleAxis[y]}`} 
                    key={`${horizontalAxis[x]}${vertcleAxis[y]}`}
                >
                </div>
            )
        }
    }
    
    
    const grabPiece = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if (count.current === 1) {
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
                    ws.current?.send(JSON.stringify({
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
            let imgSrcPrev = '';
            const dropSquare = document.getElementById(dropPosition);
            
            if (dropSquare?.hasChildNodes()) {
                const firstElementChild = dropSquare.firstElementChild;
                if (firstElementChild) {
                    imgSrcPrev = window.getComputedStyle(firstElementChild).backgroundImage.slice(5, -2);
                }
            }
            let {y, x} = index(dropPosition)
            
            const newTilesState = [...boardState];
            const imgSrc = window.getComputedStyle(activePiece.current.element!).backgroundImage.slice(5, -2);
            
            newTilesState[y*8 + x] = (
                tileDivElement(y,x,imgSrc)
            );

            ({y, x} = index(activePiece.current.position!));
            newTilesState[y*8 + x] = (
                tileDivElement(y,x,'')
            );

            validMoves.forEach(position => {
                document.getElementById(position)?.classList.remove('valid-move')
            })
            validMoves = []

            ws.current?.send(JSON.stringify({
                type: 'place',
                position: dropPosition,
                imgSrc: imgSrcPrev
            }))

            movesArray.current.push({
                from: activePiece.current.position,
                to : dropPosition,
                imgSrc: imgSrcPrev
            })

            turn.current = !turn.current
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
            let {y, x} = index(move.from)
            let imgSrcPrev = '';
            const dropSquare = document.getElementById(move.to);
        
            if (dropSquare?.hasChildNodes()) {
                const firstElementChild = dropSquare.firstElementChild;
                if (firstElementChild) {
                    imgSrcPrev = window.getComputedStyle(dropSquare!.firstElementChild!).backgroundImage.slice(5, -2);
                }
            }
            newTilesState[y*8 + x] = (
                tileDivElement(y,x,imgSrcPrev)
            );
            ({y, x} = index(move.to))
            newTilesState[y*8 + x] = (
                tileDivElement(y,x,move.imgSrc)
            );
        
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
            let imgSrcPrev = '';
            const dropSquare = document.getElementById(move.from);
            
            if (dropSquare?.hasChildNodes()) {
                const firstElementChild = dropSquare.firstElementChild;
                if (firstElementChild) {
                    imgSrcPrev = window.getComputedStyle(dropSquare!.firstElementChild!).backgroundImage.slice(5, -2);
                }
            }
            newTilesState[y*8 + x] = (
                tileDivElement(y,x,'')
            );

            ({y, x} = index(move.to))
            newTilesState[y*8 + x] = (
                tileDivElement(y,x,imgSrcPrev)
            );
            setBoardState(newTilesState)
        }
    }
    const currentState = () => {
        count.current = 1;
        ws.current?.send(JSON.stringify({
            type: 'current-state'
        }))
    }

    return (
        <div className='chessboard'>
            <div className='verticle'>
                {vertcleAxis.map(x => (
                    <div>{x}</div>
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
                {horizontalAxis.map(x => (
                    <div>{x}</div>
                ))}
            </div>
            <div>
                <button onClick={undo}>undo</button>
                <button onClick={redo}>redo</button>
                <button onClick={currentState}>current</button>
            </div>
        </div>
    );
}

export default ChessBoard;
