import { useNavigate } from 'react-router-dom';

function PlayGame() {
    const navigate = useNavigate();

    const goToRoom = ({color, opponent}:{
        color: string,
        opponent: string
        }) => {

        navigate('/room', { state: { role: 'PLAYER', color, opponent } });
    };

    return (
        <div className="play-game">
            <div className="human">
                <button className="play"     onClick={() => goToRoom({ color: 'random', opponent: 'HUMAN' })}>Play Against Human</button>
                <button className="as-white" onClick={() => goToRoom({ color: 'white', opponent: 'HUMAN' })}>Play as White</button>
                <button className="as-black" onClick={() => goToRoom({ color: 'black', opponent: 'HUMAN' })}>Play as Black</button>
            </div>
            <div className="bot">
                <button className="play"     onClick={() => goToRoom({ color: 'random', opponent: 'BOT' })}>Play Against Bot</button>
                <button className="as-white" onClick={() => goToRoom({ color: 'white', opponent: 'BOT' })}>Play as White</button>
                <button className="as-black" onClick={() => goToRoom({ color: 'black', opponent: 'BOT' })}>Play as Black</button>
            </div>
        </div>
    );
}

export default PlayGame;
