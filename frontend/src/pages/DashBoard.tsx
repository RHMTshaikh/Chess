import MyGames from "../components/MyGames"
import PublicGames from "../components/PublicGames"
import PlayGame from "../components/PlayGame"

function DashBoard() {
	return (
		<div className="dashboard">
			<PublicGames/>
			<PlayGame/>
			<MyGames/>
		</div>
	)
}

export default DashBoard