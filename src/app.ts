import cors  from 'cors';
// import { express } from 'express';
import express, { Application, Request, Response } from 'express';

const app: Application = express();

app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL as string,
    credentials: true,
  }),
);

app.get('/api/v1', (req: Request, res: Response) => {
    res.send('Hello World!');
});

export default app;