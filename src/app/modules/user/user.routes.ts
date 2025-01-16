import { NextFunction, Request, Response, Router } from "express";
import { UserController } from "./user.controllers";
import {
  userUpdateValidationSchema,
  userValidationSchema,
} from "./user.validation";
import validateRequest from "../../middlewares/validateRequest";
import { uploadAndCompress } from "../../utils/fileUpload";
// import { upload } from "../../utils/fileUpload";

const route = Router();

route.post(
  "/",
  // upload.single("file"),
  uploadAndCompress,
  (req: Request, res: Response, next: NextFunction) => {
    req.body = JSON.parse(req.body.data);
    next();
  },
  validateRequest(userValidationSchema),
  UserController.createUserController,
);
route.get("/", UserController.getUserController);
route.get("/:email", UserController.getUserByEmailController);
route.put(
  "/:id",
  validateRequest(userUpdateValidationSchema),
  UserController.updateUserController,
);
route.delete("/:id", UserController.deleteUserController);

export const userRoute = route;
