
import  httpStatus  from 'http-status';
import { UserServices } from "./user.services";
import catchAsync from "../../utils/catchAsync.";
import sendResponse from "../../utils/sendResponse";
import { cloudinaryUpload } from '../../utils/cloudinaryUpload';

const createUserController = catchAsync(async(req, res) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const img: any = await cloudinaryUpload(req?.file?.filename as string, req?.file?.path as string);
    req.body.image = img.secure_url;

    const result = await UserServices.createUserService(req.body);
    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: 'User created successfully',
        data: result
    })
})

const getUserController = catchAsync(async(req, res) => {
    const result = await UserServices.getUserService();

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Users fetched successfully',
        data: result
    })
})

const getUserByEmailController = catchAsync(async(req, res) => {
    const result = await UserServices.getUserByEmail(req.params.email);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'User fetched successfully',
        data: result
    })
})

const getUserByIdController = catchAsync(async(req, res) => {
    const result = await UserServices.getUserById(req.params.id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'User fetched successfully',
        data: result
    })
})

const updateUserController = catchAsync(async(req, res) => {
    const result =await UserServices.updateUserService(req.params.id, req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'User updated successfully',
        data: result
    })

})

const deleteUserController = catchAsync(async(req, res) => {
    const result = await UserServices.deleteUserService(req.params.id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'User deleted successfully',
        data: result
    })
})

export const UserController = {
    createUserController,
    getUserController,
    getUserByEmailController,
    updateUserController,
    deleteUserController,
    getUserByIdController
}