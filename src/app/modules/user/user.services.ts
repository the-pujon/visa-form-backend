import  httpStatus  from 'http-status';
import AppError from "../../../errors/AppError";
import { IUser } from "./user.interface";
import UserModel from "./user.model";

const createUserService = (payload: IUser) => {
    try{
    const result = UserModel.create(payload);
    return result;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    catch(err) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Error creating user');
    }
}

const getUserService = () => {

    try{
        const result = UserModel.find();
        return result;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    catch(err) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Error getting users');
    }
}


export const UserServices = {
    createUserService,
    getUserService
}