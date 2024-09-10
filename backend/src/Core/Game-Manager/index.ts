import GameManager from './GameManager';
import {DB_Operations} from '../../DBMS';

const gameManager = GameManager.getInstance({ DB_Operations });

export default gameManager;
