import express from "express";
import userRoutes from './User-Routes/userRoutes';
import otherRoutes from './Other-Routes/otherRoutes';

const router = express.Router();

router.use("/user", userRoutes);
router.use( otherRoutes);

export default router;