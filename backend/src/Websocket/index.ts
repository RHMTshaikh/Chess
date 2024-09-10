import makeWebSocketServer from "./ws";
import {DB_Operations} from "../DBMS";
import GameManager from "../Core/Game-Manager/GameManager";

const gameManager = GameManager.getInstance({ DB_Operations });

const startWebSocketServer = makeWebSocketServer( gameManager );

export default startWebSocketServer;