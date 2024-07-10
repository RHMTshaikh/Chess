// Chess\frontend\src\components\PublicGames.tsx

import { useEffect, useState, useRef } from "react";
import { useGameContext } from "../hooks/useGameContext";
import { useNavigate } from "react-router-dom";
import { connected } from "process";

interface Game {
	game_id: number;
	white_player: string;
	black_player: string;
	moves: number;
}

function PublicGames() {
	const [gamelist, setGamelist] = useState<Game[]>([]);
    const navigate = useNavigate()

	useEffect(() => {
		const fetchGames = async () =>{
			console.log('fetching public games...');
			const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/api/user/public-games`, {
				method: 'GET',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
			});
			const json = await response.json();
			
			if (!response.ok) {
				console.log(json.error);
			} else {
				setGamelist(json);
			}
		};
		fetchGames();

        const intervalId = setInterval(fetchGames, 100000);

        return () => clearInterval(intervalId);
	}, []);

	const spectate = (gameId: number) => {
        navigate('/room', { state: { mode: 'spectate', gameId } });
	};

	return (
        <div className='public-games'>
            <h1>Public Games</h1>
            <div className="list">
                <ul>
                    <li className="header">
                        <div className="serial-no">S.No</div>
                        <div className="opponent white">white</div>
                        <div className="opponent black">black</div>
                        <div className="move-length">Moves</div>
                    </li>
                    {gamelist.map((game, index) => (
                        <li key={index} className="game" onClick={() => spectate(game.game_id)}>
                            <div className="number">{`${index + 1}.`}</div>
                            <div className="email">{game.white_player}</div>
                            <div className="email">{game.black_player}</div>
                            <div className="moves-length">{game.moves}</div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
	);
}

export default PublicGames;
