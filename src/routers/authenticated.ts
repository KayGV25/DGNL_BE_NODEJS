import { Router } from "express";
import userRouter from "./authenticated/user";

const authenticatedRouter = Router();

authenticatedRouter.use('/users', userRouter)

export default authenticatedRouter;