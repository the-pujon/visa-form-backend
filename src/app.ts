import express, { Application, NextFunction, Request, Response } from 'express';
import cors from 'cors';
import httpStatus from 'http-status';
import router from './app/routes';
import globalErrorHandler from './app/middlewares/globalErrorHandler';
import fs from 'fs';
import path from 'path';

const app: Application = express();

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Parse JSON bodies (as sent by API clients)
app.use(express.json({ limit: '50mb' }));

// app.use(
//   cors({
//     origin: process.env.FRONTEND_URL || 'http://localhost:3000' || 'http://192.168.68.150:3000',
//     credentials: true,
//   })
// );

app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3000', 
      'http://192.168.68.150:3000', 
      'http://localhost:3000'
    ],
    credentials: true,
  })
);


// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use("/api", router);

// Health check route
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Not found handler
const notFoundRouteHandler = (req: Request, res: Response, next: NextFunction) => {
  res.status(httpStatus.NOT_FOUND).json({
    success: false,
    statusCode: httpStatus.NOT_FOUND,
    message: "Not Found",
  });
  next();
};

app.use(notFoundRouteHandler);
app.use(globalErrorHandler);

export default app;