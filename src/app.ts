import  httpStatus  from 'http-status';
import cors  from 'cors';
// import { express } from 'express';
import express, { Application, NextFunction, Request, Response } from 'express';
import router from './app/routes';
// import notFoundRouteHandler from './app/middlewares/notFoundRouteHandler';
import globalErrorHandler from './app/middlewares/globalErrorHandler';

const app: Application = express();

app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL as string,
    credentials: true,
  }),
);
//start 
app.use("/api", router);
app.get('/api', (req: Request, res: Response) => {
    res.send('Hello World!');
});
const notFoundRouteHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.status(httpStatus.NOT_FOUND).json({
    success: false,
    statusCode: httpStatus.NOT_FOUND,
    message: "Not Found",
  });
  next(); // Add this line to call the next middleware
};
app.use(notFoundRouteHandler);
app.use(globalErrorHandler);

export default app;