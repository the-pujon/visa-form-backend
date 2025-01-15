import { z } from 'zod';

export const userValidationSchema = z.object({
  _id: z.number().optional(), // _id is optional
  name: z.string().min(1, 'Name is required'), // Name is a required string
  email: z.string().email('Invalid email format'), // Email should be a valid email string
  password: z.string().min(8, 'Password must be at least 8 characters'), // Password should be a string with min length
  role: z.enum(['admin', 'user']).optional(), // Role can be either 'admin' or 'user', optional
  createdAt: z.date().optional(), // createdAt is optional and should be a Date
  updatedAt: z.date().optional(), // updatedAt is optional and should be a Date
  address: z.string().min(1, 'Address is required'), // Address is required
});