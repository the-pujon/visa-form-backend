import  httpStatus  from 'http-status';
import { UserServices } from "./user.services";
import catchAsync from "../../utils/catchAsync.";
import sendResponse from "../../utils/sendResponse";

const createUserController = catchAsync(async(req, res) => {
    const result = UserServices.createUserService(req.body);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: 'User created successfully',
        data: result
    })
})

const getUserController = catchAsync(async(req, res) => {
    const result = UserServices.getUserService();

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Users fetched successfully',
        data: result
    })
})

export const UserController = {
    createUserController,
    getUserController
}