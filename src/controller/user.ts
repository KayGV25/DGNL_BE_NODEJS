import { NextFunction, Request, Response } from 'express';
import { userService } from '../services/user';

export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
    const userId: string | undefined = req.params.id;
    if (!userId) res.status(400).json({ error: "User ID is required" });
    try {
        const user = await userService.getUserById(userId);
        if (user) res.json(user);
    } catch (error){
        next(error)
    }
}