import React, { MouseEventHandler } from "react";
import { Move } from "../types";

interface MovesPanelProps {
    movesArray: React.MutableRefObject<Move[]>;
    undo: MouseEventHandler<HTMLButtonElement>;
    redo: MouseEventHandler<HTMLButtonElement>;
    currentStateFromServer: MouseEventHandler<HTMLButtonElement>;
    setBoardToThisMove: Function;
}

const MovesPanel: React.FC<MovesPanelProps> = ({ movesArray, undo, redo, currentStateFromServer, setBoardToThisMove}) => {

    return (
        <div className="move-panel">
            <div className="moves">
                <ul>
                    {movesArray.current.map((move, index) => (
                        <li key={index} onClick={()=>setBoardToThisMove(index)}>
                            <div className="number">{`  ${index + 1}.`}</div>
                            <div className="from">{(move.from.position)}</div>
                            <div className="to">{(move.to.position)}</div>
                            <div className={`piece piece-${move.to.piece < 9 ? ('0' + move.to.piece) : (move.to.piece)}`}></div>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="undo-redo-btn">
                <button onClick={undo}>undo</button>
                <button onClick={redo}>redo</button>
                <button onClick={currentStateFromServer}>current</button>
            </div>
        </div>
    )
}

export default MovesPanel;