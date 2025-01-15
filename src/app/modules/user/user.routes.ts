import { Router } from "express";
import { UserController } from "./user.controllers";

const route = Router()

route.post('/create', UserController.createUserController)
route.get('/get', UserController.getUserController)
route.get("/:email", UserController.getUserByEmailController)

export const userRoute = route