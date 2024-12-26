import { startHttpServer } from "./HTTP-Servers";
import dotenv from 'dotenv';
import startWebSocketServer from "./Websocket";
import { startPoolConnection as connectDB } from "./DBMS";

dotenv.config();

connectDB();
const port = process.env.PORT || 4000;
const server = startHttpServer({ port: Number(port) });
startWebSocketServer({server});

// setInterval(() => {
//     const memoryUsage = process.memoryUsage();
//     console.log(`
//     Memory Usage:
//     - RSS: ${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB
//     - Heap Total: ${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB
//     - Heap Used: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB
//     - External: ${(memoryUsage.external / 1024 / 1024).toFixed(2)} MB
//     - Array Buffers: ${(memoryUsage.arrayBuffers / 1024 / 1024).toFixed(2)} MB
//     `);
// }, 2000); // Log memory usage every 5 seconds
