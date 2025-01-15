import { Router } from "express";
import { UserController } from "./user.controllers";
import validateRequest from "../../../middlewares/validateRequest";
import {
  userUpdateValidationSchema,
  userValidationSchema,
} from "./user.validation";

const route = Router();

route.post(
  "/create",
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
