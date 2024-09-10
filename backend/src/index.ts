import { startHttpServer } from "./HTTP-Servers";
import dotenv from 'dotenv';
import startWebSocketServer from "./Websocket";
import { startPoolConnection as connectDB } from "./DBMS";

dotenv.config();


connectDB();
const port = process.env.PORT || 4000;
const server = startHttpServer({ port: Number(port) });
startWebSocketServer({server});

// const routesConfig: RouteConfig = {
//     route: '/api',
//     routes: [
//         {route: '/refresh-token',
//             methods: [
//                 {method: 'POST', controller: makeCallback(signUpUser)},
//             ]
//         },
//         {route: '/user',
//             methods: [
//                 {method: 'use', controller: makeExpressMiddleware(authorizUser)},
//             ],
//             routes: [
//                 {route: '/login',
//                     methods: [
//                         {method: 'POST', controller: makeCallback(loginUser)},
//                     ]
//                 },
//                 {route: '/signup',
//                     methods:[
//                         {method: 'POST', controller: makeCallback(signUpUser)},
//                     ],
//                 },
//                 {route: '/public-games',
//                     methods:[
//                         {method: 'GET', controller: makeCallback(getPublicGames)},
//                     ],
//                 },
//                 {route: '/games',
//                     methods:[
//                         {method: 'GET', controller: makeCallback(myGames)},
//                     ],
//                 },
//                 {route: '/refresh-token',
//                     methods:[
//                         {method: 'POST', controller: makeCallback(myGames)},
//                     ],
//                 },
//             ],
//         }
//     ]
// };