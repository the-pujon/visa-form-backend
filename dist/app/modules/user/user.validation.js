"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userUpdateValidationSchema = exports.userValidationSchema = void 0;
const zod_1 = require("zod");
exports.userValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        _id: zod_1.z.number().optional(), // _id is optional
        name: zod_1.z.string().min(1, "Name is required"), // Name is a required string
        email: zod_1.z.string().email("Invalid email format"), // Email should be a valid email string
        password: zod_1.z.string().min(8, "Password must be at least 8 characters"), // Password should be a string with min length
        role: zod_1.z.enum(["admin", "user"]).optional(), // Role can be either 'admin' or 'user', optional
        address: zod_1.z.string().min(1, "Address is required"), // Address is required
    }),
});
exports.userUpdateValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        _id: zod_1.z.number().optional(), // _id is optional
        name: zod_1.z.string().optional(),
        email: zod_1.z.string().email("Invalid email format").optional(), // Email should be a valid email string
        password: zod_1.z.string().min(8, "Password must be at least 8 characters").optional(), // Password should be a string with min length
        role: zod_1.z.enum(["admin", "user"]).optional(), // Role can be either 'admin' or 'user', optional
        address: zod_1.z.string().min(1, "Address is required").optional(),
    }),
});
