import express, { Express, Request, Response } from "express";
import cookieParser from 'cookie-parser';
import { HttpResponse, StartHttpServerOptions, RouteConfig } from "../../types";
import routes from './Routes'
import { log } from "console";

interface CustomRequest extends Request {
    email: string;
}

const app: Express = express();

app.use(cookieParser());
app.use(express.json());

app.use('/',(req, res, next) => {
    console.log(req.method, req.path);
    next();
})

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', process.env.ORIGIN);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
});

app.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', process.env.ORIGIN);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.sendStatus(200);
});

app.use('/api', routes);

export default function startExpressHttpServer( { port }: StartHttpServerOptions)  {
    const server = app.listen(port, () => {
        console.log(`Listening on port ${port}`);
    });
    
    return server;
};

export function makeExpressCallback (controller: Function) { // here we are separating express from our controller
    return (req: Request, res: Response, next: Function) => {
        
        const httpRequest = {
            body: req.body,
            query: req.query,
            params: req.params,
            ip: req.ip,
            method: req.method,
            path: req.path,
            cookies: req.cookies,
            email: (req as CustomRequest).email,
            headers: {
                'Content-Type': req.get('Content-Type'),
                Referer: req.get('referer'),
                'User-Agent': req.get('User-Agent')
            }
        }
        controller(httpRequest)
            .then((httpResponse: HttpResponse) => {
                if (httpResponse.headers) {
                    res.set(httpResponse.headers)
                }
                res.status(httpResponse.statusCode);
                
                if (httpResponse.body) {
                    res.type('json')
                    res.send(httpResponse.body);
                }else{
                    res.end();
                }
            })
        .catch((error: any) => next(error))
    }
};

export function makeExpressMiddleware(middleware: Function) {
    return (req: Request, res: Response, next: Function) => {
        const httpRequest = {
            body: req.body,
            query: req.query,
            params: req.params,
            ip: req.ip,
            method: req.method,
            path: req.path,
            cookies: req.cookies,
            headers: {
                'Content-Type': req.get('Content-Type'),
                Referer: req.get('referer'),
                'User-Agent': req.get('User-Agent')
            }
        };

        middleware(httpRequest)
            .then((data : Record<string, any> ) => {
                // Perform a deep copy of `data` and add its fields to `req`
                const deepCopiedData = JSON.parse(JSON.stringify(data));
                Object.assign(req, deepCopiedData);
                // Proceed to the next middleware or route handler
                next();
            })
        .catch((error: any) => next(error));
    };
};

app.use((err: any, req: Request, res: Response, next: Function) => {
    console.log('error message', err.message);
    console.log('error stack', err.stack);
    res.status(err.statusCode).json({ error: err.message });
});

