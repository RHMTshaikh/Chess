import { useNavigate} from 'react-router-dom'
function PlayGame() {
    const navigate = useNavigate()
    const goToRoom = ()=>{
        navigate('/room', {state: {mode: 'play'} })
    }
    return (
        <>
        <div className="play-game">
            <p></p>   
            <div className="human">
                <button className="play" onClick={goToRoom}>Play Online</button>
                <button className="as-white" onClick={goToRoom}>Play as White</button>
                <button className="as-black" onClick={goToRoom}>Play as Black</button>
            </div>
            <div className="bot">
                <button className="play" onClick={goToRoom}>Play Against Bot</button>
                <button className="as-white" onClick={goToRoom}>Play as White</button>
                <button className="as-black" onClick={goToRoom}>Play as Black</button>
            </div>
        </div>
        </>
    )
}

export default PlayGame