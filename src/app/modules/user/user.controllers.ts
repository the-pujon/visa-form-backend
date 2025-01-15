import { Request, Response } from "express";
import { UserServices } from "./user.services";

const createUserController = (req: Request, res: Response) => {
    const result = UserServices.createUserService(req.body);

 res.status(200).json(result);
}

export const UserController = {
    createUserController
}