import { Router } from "express";
import { logout } from "../../controllers/authentication";

const userRouter = Router();

userRouter.post('/logout', logout)

export default userRouter;