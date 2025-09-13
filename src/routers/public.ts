import { Router } from "express";
import userRouter from "./public/user";
import authenticationRouter from "./public/authentication";

const publicRouter = Router();

publicRouter.use('/users', userRouter)
publicRouter.use('/authentication', authenticationRouter)

export default publicRouter;