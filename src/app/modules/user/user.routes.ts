import { Router } from "express";
import { UserController } from "./user.controllers";
import {
  userUpdateValidationSchema,
  userValidationSchema,
} from "./user.validation";
import validateRequest from "../../middlewares/validateRequest";

const route = Router();

route.post(
  "/",
  validateRequest(userValidationSchema),
  UserController.createUserController,
);
route.get("/get", UserController.getUserController);
route.get("/:email", UserController.getUserByEmailController);
route.put(
  "/:id",
  validateRequest(userUpdateValidationSchema),
  UserController.updateUserController,
);
route.delete("/:id", UserController.deleteUserController);

export const userRoute = route;
