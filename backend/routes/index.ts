import express from 'express'
import userRouter from './user';
import accountRouter from './account';

const rootRouter = express.Router();

rootRouter.use("/user", userRouter);
rootRouter.use("/account", accountRouter);


export default rootRouter

