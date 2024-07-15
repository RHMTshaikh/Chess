import express, { Request, Response } from 'express';
import qs from 'qs';
// import axios from 'axios';
import jwt from 'jsonwebtoken';
// import Multer from 'multer';
// import { Storage } from '@google-cloud/storage';
// import { Document, Model } from 'mongoose';
import dotenv from 'dotenv';
import { myGamesDB, publicGamesDB, userLoginDB, newUserLoginDB } from '../DataBaseLogic/dbLogic';

dotenv.config();

interface UserDocument extends Document {
    email: string;
    _id: string;
    login: (email: string, password: string, type: string) => Promise<any>;
    signup: (email: string, password: string, type: string) => Promise<any>;
    saveprofilePicName: (email: string) => Promise<void>;
    deleteprofilePicName: (userId: string) => Promise<string>;
    getProfilePicName: (userId: string) => Promise<string>;
}

const createToken = (_id: string) => {
    return jwt.sign({ _id }, process.env.SECRET as string, { expiresIn: '1d' });
}

interface PublicGames {
    game_id: number;
    white_player: string;
    black_player: string;
    moves: number;
}interface GameResult {
    game_id: number;
    white_player: string;
    black_player: string;
    winner: string;
    moves: string;
}
async function publicGames(req: Request, res: Response) {
    try {
        const list: GameResult[] = await publicGamesDB(); // Assuming publicGamesDB is defined and returns GameResult[]

        const publicGames: PublicGames[] = list.map(game => ({
            game_id: game.game_id,
            white_player: game.white_player,
            black_player: game.black_player,
            moves: game.moves ? JSON.parse(game.moves).length : 0
        }));

        res.status(200).send(JSON.stringify(publicGames));
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}

async function myGames(req: Request, res: Response){
    const email = req.cookies.email
    const list = await myGamesDB(email)
    res.status(200).send(JSON.stringify(list))
}

// Login user
const userLogin = async (req: Request, res: Response) => {
    const { email, password, } = req.body;

    try {
        // Save to database
        const results = await userLoginDB( email, password );
        console.log('userLogin: ', results);
         // Set a cookie
        res.cookie('email', results.data.email, {
            httpOnly: true, // Mitigates XSS attacks by preventing client-side scripts from accessing the cookie
            secure: true, // Ensures the cookie is only sent over HTTPS
            sameSite: 'none', // Ensures the cookie is sent in cross-site requests
        });
        // const { email, name, rank } = results.data;
        res.status(200).send({ user: results.data });

    } catch (error) {
        console.error('Error userLogin:', error);
        res.status(500).send(error);
    }
}
// Login user
const newUserLogin = async (req: Request, res: Response) => {
    const { email, password, name } = req.body;

    try {
        const results = await newUserLoginDB(email, password, name);
        console.log('results', results);
        
        // const { email, name, rank } = results.data;
        res.status(200).send({ user: results.data });

    } catch (error) {
        console.error('Error newUserLogin:', error);
        res.status(500).send(error);
    }
}

// Signup user
const signupUser = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // try {
    //     const user = await (User as UserModel).signup(email, password, 'self');

    //     const token = createToken(user._id);

    //     res.status(200).json({ email, token });
    // } catch (error: any) {
    //     res.status(400).json({ error: error.message });
    // }
}

const loginUserGoogle = async (req: Request, res: Response) => {
    console.log('Logging in Google user...');
    const redirectedURL = req.query.redirected_url as string;
    const parsedURL = qs.parse(redirectedURL.split('?')[1]);

    let redirectURL = redirectedURL.split('?')[0];
    if (redirectURL.endsWith('/')) {
        redirectURL = redirectURL.slice(0, -1);
    }
    const authorizationCode = parsedURL.code as string;
    const clientID = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_SECRET;
    const tokenUrl = process.env.GOOGLE_TOKEN_URL;

    const requestBody = {
        code: authorizationCode,
        client_id: clientID,
        client_secret: clientSecret,
        redirect_uri: redirectURL,
        grant_type: 'authorization_code',
    };
    // try {
    //     const response = await axios.post(tokenUrl, qs.stringify(requestBody), {
    //         headers: {
    //             'Content-Type': 'application/x-www-form-urlencoded',
    //         }
    //     });
    //     console.log('Got the access token from token URL');
    //     const access_token = response.data.access_token;
    //     const id_token = response.data.id_token;

    //     const googleUser = jwt.decode(id_token) as { email: string, sub: string };
    //     const userEmail = googleUser.email;
    //     const userSUB = googleUser.sub;

    //     console.log('Saving to database...');
    //     const user = await (User as UserModel).login(userEmail, userSUB, 'Google');
    //     if (user.error) {
    //         console.log('Error from Mongo: ', user.error);
    //         return res.status(400).json(user);
    //     }
    //     const token = createToken(user._id);

    //     res.status(200).json({ email: userEmail, token });
    // } catch (error: any) {
    //     res.status(400).json({ error: error.message });
    // }
}

const loginUserByQR = async (req: Request, res: Response) => {
//     try {
//         const { _id } = jwt.verify(req.body.token, process.env.SECRET as string) as { _id: string };
//         const userMongo = await User.findById(_id) as UserDocument;

//         if (req.body.email != userMongo.email) {
//             return res.status(400).json({ error: 'Email did not match' });
//         }
//         return res.status(200).json(req.body);
//     } catch (error) {
//         console.error(error);
//     }
}

// let projectId = process.env.PROJECT_ID;
// let keyFilename = '../backend/mykey.json';
// const storage = new Storage({
//     projectId,
//     keyFilename,
// });
// const bucket = storage.bucket('profile-pic-workoutbuddy');

const saveProfilePic = async (req: Request, res: Response) => {
//     console.log(req.body.email);
//     try {
//         console.log('File found, trying to upload');
//         const fileObj = bucket.file(req.file.originalname);
//         console.log(req.file.originalname);
//         console.log('Blob created:', fileObj.name);

//         const blobStream = fileObj.createWriteStream();

//         blobStream.on('error', (err) => {
//             console.log('Error in blobStream:', err);
//             res.status(500).send({ error: err.message });
//         });
//         blobStream.on('finish', async () => {
//             await (User as UserModel).saveprofilePicName(req.body.email);
//             res.status(200).end();
//         });
//         blobStream.end(req.file.buffer);
//     } catch (error: any) {
//         console.log('Catch block error:', error);
//         res.status(500).send({ error: error.message });
//     }
}

const deleteProfilePic = async (req: Request, res: Response) => {
//     try {
//         const fileName = await (User as UserModel).deleteprofilePicName(req.user.id);
//         if (fileName) {
//             const file = bucket.file(fileName);

//             file.delete()
//                 .then(() => {
//                     res.status(200).end();
//                 })
//                 .catch((err) => {
//                     console.error('Error deleting file:', err);
//                     res.status(500).send({ error: err.message });
//                 });
//         }
//         res.status(200).end();
//     } catch (error: any) {
//         console.log('Catch block error:', error);
//         res.status(500).send({ error: error.message });
//     }
}

const getProfilePic = async (req: Request, res: Response) => {
//     console.log("Get");
//     console.log(req.query.email);
//     console.log(req.user.id);

//     try {
//         const fileName = await (User as UserModel).getProfilePicName(req.user.id);
//         if (fileName) {
//             const File = bucket.file(fileName);
//             const readStream = File.createReadStream();

//             readStream.on('error', (err) => {
//                 console.error('Error reading file from bucket:', err);
//                 res.status(500).send({ error: err.message });
//             });
//             readStream.on('response', () => {
//                 res.setHeader('Content-Type', 'image/jpeg');
//             });
//             readStream.pipe(res);
//         } else {
//             res.status(200).end();
//         }
//     } catch (error: any) {
//         console.log('Catch block error:', error);
//         res.status(500).send({ error: error.message });
//     }
}

// const multer = Multer({
//     storage: Multer.memoryStorage(),
//     limits: {
//         fileSize: 5 * 1024 * 1024, // No larger than 5mb, change as you need
//     },
// });

export { signupUser, userLogin, newUserLogin, myGames, loginUserGoogle, loginUserByQR, saveProfilePic, deleteProfilePic, getProfilePic,publicGames };
