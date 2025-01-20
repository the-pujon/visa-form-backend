import  httpStatus  from 'http-status';
import { IUser } from "./user.interface";
import UserModel from "./user.model";
import AppError from '../../errors/AppError';
import configs from '../../configs';
import { cacheData, deleteCachedData, getCachedData } from '../../utils/redis.utils';
import { cloudinaryUpload } from '../../utils/cloudinaryUpload';
import { cloudinaryDestroy } from '../../utils/cloudinaryDelete';


const redisCacheKeyPrefix = configs.redis_cache_key_prefix;
const redisTTL = parseInt(configs.redis_ttl as string);

/**
 * Creates a new user in the database.
 * @param {IUser} payload - The payload to create the user with.
 * @returns {Promise<IUser>} - A promise that resolves to the newly created user object.
 * @throws {AppError} - If there is an error creating the user, an error with a BAD_REQUEST status is thrown.
 */
const createUserService =async (payload: IUser) => {
    try{
    const result = await UserModel.create(payload);
   await deleteCachedData(`${redisCacheKeyPrefix}:users`);
    return result;
    }
    catch(err) {
        
        // eslint-disable-next-line no-console
        console.log(err)
        throw new AppError(httpStatus.BAD_REQUEST, 'Error creating user');
    }
}

/**
 * Retrieves all users from the database.
 * @returns {Promise<IUser[]>} - A promise that resolves to an array of user objects.
 * @throws {AppError} - If there is an error retrieving users, an error with a BAD_REQUEST status is thrown.
 */
const getUserService = async () => {

    try{
        //get cached data from the redis
        const cachedKey = `${redisCacheKeyPrefix}:users`;
        const cachedData = await getCachedData(cachedKey);

        // console.log(cachedData);

        if(cachedData){
            return cachedData;
        }

        const result =await UserModel.find();
        //cache the data
       await cacheData(cachedKey, result, redisTTL);
        return result;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    catch(err) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Error getting users');
    }
}

/**
 * Gets a user by email
 * @param {string} email - The email address of the user to get
 * @returns {Promise<IUser>} - The user object
 * @throws {AppError} - If there is an error getting the user
 */
const getUserByEmail = async (email: string) => {

    try{
        const result = await UserModel.findOne({email});
        return result;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    catch(err) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Error getting user');
    }
}



/**
 * Retrieves a user by their ID from the database.
 * @param {string} id - The ID of the user to retrieve.
 * @returns {Promise<IUser>} - A promise that resolves to the user object if found.
 * @throws {AppError} - If there is an error retrieving the user, an error with a BAD_REQUEST status is thrown.
 */

const getUserById = async (id: string) => {

    try{
        const result = await UserModel.findById(id);
        return result;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    catch(err) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Error getting user');
    }
}


/**
 * Updates an existing user in the database.
 * @param {string} id - The ID of the user to update.
 * @param {IUser} payload - The payload to update the user with.
 * @returns {Promise<IUser>} - A promise that resolves to the newly updated user object.
 * @throws {AppError} - If there is an error updating the user, an error with a BAD_REQUEST status is thrown.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const updateUserService = async (id: string, payload: Partial<IUser>, file: any) => {
    try {
    const existingUsers = await UserModel.findById(id);

    if(file){
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const img: any = await cloudinaryUpload(
           existingUsers?.imageId as string,
           file.path as string
         );
         payload.image = img.secure_url;
 }


      // Update the user with the fields provided in the payload
      const result = await UserModel.findByIdAndUpdate(id, payload, {
        new: true, // Return the updated document
        runValidators: true, // Ensure schema validations are applied
      });

    
    //   console.log(payload)
  
      if (!result) {
        throw new AppError(httpStatus.NOT_FOUND, 'User not found');
      }
  
      // Invalidate the cache for users
      await deleteCachedData(`${redisCacheKeyPrefix}:users`);
  
      return result;
    } catch (err) {
      // Log the error for debugging purposes
      // eslint-disable-next-line no-console
      console.error('Error updating user:', err);
  
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Error updating user, please check the input data'
      );
    }
  };
  
/**
 * Deletes an existing user from the database.
 * @param {string} id - The ID of the user to delete.
 * @returns {Promise<IUser>} - A promise that resolves to the deleted user object.
 * @throws {AppError} - If there is an error deleting the user, an error with a BAD_REQUEST status is thrown.
 */

const deleteUserService = async (id: string) => {
    try{
        const result = await UserModel.findByIdAndDelete(id);
        if(result?.imageId){
            await cloudinaryDestroy(result?.imageId as string)
        }
       await deleteCachedData(`${redisCacheKeyPrefix}:users`);
        return result;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    catch(err) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Error deleting user');
    }
}


export const UserServices = {
    createUserService,
    getUserService,
    getUserByEmail,
    updateUserService,
    deleteUserService,
    getUserById
}