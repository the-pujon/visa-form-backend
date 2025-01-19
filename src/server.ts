/* eslint-disable no-console */
import mongoose from "mongoose";
import app from "./app";
import config from "./app/configs";
import { Server } from 'http';

let server: Server;

async function main() {
  try {
    await mongoose.connect(config.database_url as string);
    console.log("Database connected successfully");
    server = app.listen(config.port, () => {
      console.log(`Server is running on port ${config.port}`);
    });
  } catch (err) {
    console.error('Failed to connect database', err);
  }
}

main();

// Export the server and app for Vercel
export default app;

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.log('Unhandled Rejection. Shutting down...');
  console.log(err);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});
