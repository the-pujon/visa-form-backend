"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoute = void 0;
const express_1 = require("express");
const user_controllers_1 = require("./user.controllers");
const user_validation_1 = require("./user.validation");
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const fileUpload_1 = require("../../utils/fileUpload");
// import { upload } from "../../utils/fileUpload";
const route = (0, express_1.Router)();
route.post("/", 
// upload.single("file"),
fileUpload_1.uploadAndCompress, (req, res, next) => {
    req.body = JSON.parse(req.body.data);
    next();
}, (0, validateRequest_1.default)(user_validation_1.userValidationSchema), user_controllers_1.UserController.createUserController);
route.get("/", user_controllers_1.UserController.getUserController);
route.get("/:email", user_controllers_1.UserController.getUserByEmailController);
route.put("/:id", fileUpload_1.uploadAndCompress, (req, res, next) => {
    req.body = JSON.parse(req.body.data);
    next();
}, (0, validateRequest_1.default)(user_validation_1.userUpdateValidationSchema), user_controllers_1.UserController.updateUserController);
route.delete("/:id", user_controllers_1.UserController.deleteUserController);
route.get("/id/:id", user_controllers_1.UserController.getUserByIdController);
exports.userRoute = route;
