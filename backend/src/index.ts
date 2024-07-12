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
app.use(cookieParser())

// Middleware
app.use(express.json()); // Parse JSON bodies

app.use((req, res, next) => {
    console.log(req.path, req.method);
    next();
});

app.use('/api/user', userRoutes);

(async () => {
    startWebSocketServer()
    const pool = new Pool({
        connectionString: process.env.CONNECTION_STRING,
        ssl: {
            rejectUnauthorized: false, // Adjust according to your SSL configuration
        },
    });
    
    passConnection(pool);
    const PORT = process.env.PORT || 4000
	app.listen(PORT, () => {
		console.log('Listening on port', PORT);
	});
})();