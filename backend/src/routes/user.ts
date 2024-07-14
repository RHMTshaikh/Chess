import express from 'express';
// import requireAuth from '../middleware/requireAuth';
import {
  publicGames,
  myGames,
  signupUser,
  userLogin,
  newUserLogin,
  // signupUserGoogle,
  // loginUserGoogle,
  // loginUserByQR,
  // saveProfilePic,
  // deleteProfilePic,
  // getProfilePic,
  // multer
} from '../controller/user';

const router = express.Router();

router.post('/login', userLogin);
router.post('/new-login', newUserLogin);
router.get('/my-games', myGames);
router.get('/public-games', publicGames);
router.post('/signup', signupUser);
// router.post('/QRlogin', loginUserByQR);

// router.get('/google-auth/signup', signupUserGoogle);
// router.get('/google-auth/login', loginUserGoogle);

// router.post('/profile-pic', requireAuth, multer.single('imgfile'), saveProfilePic);
// router.delete('/profile-pic', requireAuth, multer.none(), deleteProfilePic);
// router.get('/profile-pic', requireAuth, getProfilePic);

export default router;
