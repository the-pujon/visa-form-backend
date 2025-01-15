import { Router } from "express";
import { UserController } from "./user.controllers";

const route = Router()

route.post('/create', UserController.createUserController)
route.get('/get', UserController.getUserController)

export const userRoute = route