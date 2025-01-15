import { Router } from "express";
import { UserController } from "./user.controllers";

const route = Router()

route.post('/create', UserController.createUserController)

export const userRoute = route