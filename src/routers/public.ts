import { Router } from "express";
import userRouter from "./public/user";

const publicRouter = Router();

publicRouter.use('/', userRouter)

export default publicRouter;