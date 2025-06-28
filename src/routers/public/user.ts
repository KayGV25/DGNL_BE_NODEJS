import { Router } from "express";
import { getUserById } from "../../controller/user";


const userRouter = Router();

userRouter.get('/users/:id', getUserById);

export default userRouter;