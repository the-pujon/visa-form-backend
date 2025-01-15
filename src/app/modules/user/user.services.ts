import { IUser } from "./user.interface";
import UserModel from "./user.model";

const createUserService = (userData: IUser) => {
    const result = UserModel.create(userData);
    return result;
}


export const UserServices = {
    createUserService
}