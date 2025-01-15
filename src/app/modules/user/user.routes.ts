import { Router } from "express";
import { UserController } from "./user.controllers";

const route = Router()

route.post('/create', UserController.createUserController)
route.get('/get', UserController.getUserController)
route.get("/:email", UserController.getUserByEmailController)
route.put("/:id", UserController.updateUserController)
route.delete("/:id", UserController.deleteUserController)

export const userRoute = route