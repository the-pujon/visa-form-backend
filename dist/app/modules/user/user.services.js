"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserServices = void 0;
const http_status_1 = __importDefault(require("http-status"));
const user_model_1 = __importDefault(require("./user.model"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const configs_1 = __importDefault(require("../../configs"));
const redis_utils_1 = require("../../utils/redis.utils");
const cloudinaryUpload_1 = require("../../utils/cloudinaryUpload");
const cloudinaryDelete_1 = require("../../utils/cloudinaryDelete");
const redisCacheKeyPrefix = configs_1.default.redis_cache_key_prefix;
const redisTTL = parseInt(configs_1.default.redis_ttl);
/**
 * Creates a new user in the database.
 * @param {IUser} payload - The payload to create the user with.
 * @returns {Promise<IUser>} - A promise that resolves to the newly created user object.
 * @throws {AppError} - If there is an error creating the user, an error with a BAD_REQUEST status is thrown.
 */
const createUserService = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield user_model_1.default.create(payload);
        console.log(result);
        yield (0, redis_utils_1.deleteCachedData)(`${redisCacheKeyPrefix}:users`);
        return result;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    catch (err) {
        console.log(err);
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Error creating user');
    }
});
/**
 * Retrieves all users from the database.
 * @returns {Promise<IUser[]>} - A promise that resolves to an array of user objects.
 * @throws {AppError} - If there is an error retrieving users, an error with a BAD_REQUEST status is thrown.
 */
const getUserService = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        //get cached data from the redis
        const cachedKey = `${redisCacheKeyPrefix}:users`;
        const cachedData = yield (0, redis_utils_1.getCachedData)(cachedKey);
        // console.log(cachedData);
        if (cachedData) {
            return cachedData;
        }
        const result = yield user_model_1.default.find();
        //cache the data
        yield (0, redis_utils_1.cacheData)(cachedKey, result, redisTTL);
        return result;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    catch (err) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Error getting users');
    }
});
/**
 * Gets a user by email
 * @param {string} email - The email address of the user to get
 * @returns {Promise<IUser>} - The user object
 * @throws {AppError} - If there is an error getting the user
 */
const getUserByEmail = (email) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield user_model_1.default.findOne({ email });
        return result;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    catch (err) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Error getting user');
    }
});
/**
 * Retrieves a user by their ID from the database.
 * @param {string} id - The ID of the user to retrieve.
 * @returns {Promise<IUser>} - A promise that resolves to the user object if found.
 * @throws {AppError} - If there is an error retrieving the user, an error with a BAD_REQUEST status is thrown.
 */
const getUserById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield user_model_1.default.findById(id);
        return result;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    catch (err) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Error getting user');
    }
});
/**
 * Updates an existing user in the database.
 * @param {string} id - The ID of the user to update.
 * @param {IUser} payload - The payload to update the user with.
 * @returns {Promise<IUser>} - A promise that resolves to the newly updated user object.
 * @throws {AppError} - If there is an error updating the user, an error with a BAD_REQUEST status is thrown.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const updateUserService = (id, payload, file) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const existingUsers = yield user_model_1.default.findById(id);
        if (file) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const img = yield (0, cloudinaryUpload_1.cloudinaryUpload)(existingUsers === null || existingUsers === void 0 ? void 0 : existingUsers.imageId, file.path);
            payload.image = img.secure_url;
        }
        // Update the user with the fields provided in the payload
        const result = yield user_model_1.default.findByIdAndUpdate(id, payload, {
            new: true, // Return the updated document
            runValidators: true, // Ensure schema validations are applied
        });
        //   console.log(payload)
        if (!result) {
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'User not found');
        }
        // Invalidate the cache for users
        yield (0, redis_utils_1.deleteCachedData)(`${redisCacheKeyPrefix}:users`);
        return result;
    }
    catch (err) {
        // Log the error for debugging purposes
        console.error('Error updating user:', err);
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Error updating user, please check the input data');
    }
});
/**
 * Deletes an existing user from the database.
 * @param {string} id - The ID of the user to delete.
 * @returns {Promise<IUser>} - A promise that resolves to the deleted user object.
 * @throws {AppError} - If there is an error deleting the user, an error with a BAD_REQUEST status is thrown.
 */
const deleteUserService = (id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield user_model_1.default.findByIdAndDelete(id);
        if (result === null || result === void 0 ? void 0 : result.imageId) {
            yield (0, cloudinaryDelete_1.cloudinaryDestroy)(result === null || result === void 0 ? void 0 : result.imageId);
        }
        yield (0, redis_utils_1.deleteCachedData)(`${redisCacheKeyPrefix}:users`);
        return result;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    catch (err) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Error deleting user');
    }
});
exports.UserServices = {
    createUserService,
    getUserService,
    getUserByEmail,
    updateUserService,
    deleteUserService,
    getUserById
};
