// Chess\backend\src\index.ts

import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import userRoutes from './routes/user';
import { startWebSocketServer } from './GameManager';
import { passConnection } from './DataBaseLogic/dbLogic';
import { Pool } from 'pg';

dotenv.config();

const app = express();

app.use(cors({
    origin: process.env.ORIGIN, 
    credentials: true // This allows cookies to be included in cross-origin requests
}));
// Handle preflight requests
app.options('*', cors({
    origin: process.env.ORIGIN,
    credentials: true,
  }));
  
app.use(cookieParser())

app.use(express.json()); 

app.use((req, res, next) => {
    console.log('method: ',req.method);
    console.log('path: ',req.path);
    console.log('body: ',req.body);
    console.log('cookie: ',req.headers.cookie);
    next();
});

app.use('/api/user', userRoutes);

(async () => {
    console.log('trying to make database pool connection');
    const pool = new Pool({
        connectionString: process.env.CONNECTION_STRING,
        ssl: {
            rejectUnauthorized: false, 
        },
    });
    passConnection(pool);

    const PORT = process.env.PORT || 4000
	const server = app.listen(PORT, () => {
		console.log('Listening on port', PORT);
	});

    startWebSocketServer(server)

})();