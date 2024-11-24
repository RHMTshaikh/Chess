import React, { useEffect, useState } from "react";
import { ChessPlayer } from "../types";

interface TimerProps {
    player: ChessPlayer;
}

const Timer: React.FC<TimerProps> = ({ player }) => {
    // console.log('color', player.color, 'time', player.time);
    
    const [remainingTime, setRemainingTime] = useState(player.time);
    
    useEffect(() => {
        let intervalId: NodeJS.Timeout | undefined;
        
        if (player.turn) {
            if (player.time !== remainingTime) {
                setRemainingTime(player.time);
            }
            intervalId = setInterval(() => {
                setRemainingTime((prevTime) => prevTime > 0 ? prevTime - 100 : 0);
                player.time -= 100;
            }, 100);
        } else {
            setRemainingTime(player.time);
        }

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [player]);

    const minute = Math.floor(remainingTime / 60000);
    const second = Math.floor((remainingTime % 60000) / 1000);
    const hundredMillisecond = Math.floor((remainingTime % 1000) / 100);

    return (
        <div>
            {`${minute.toString().padStart(2, "0")} : 
                ${second.toString().padStart(2, "0")} : 
                ${hundredMillisecond.toString().padStart(2, "0")}`}
        </div>
    );
};

export default Timer;