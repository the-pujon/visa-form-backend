/* eslint-disable no-console */
import mongoose from "mongoose";
import app from "./app";
import configs from "./app/configs";
import { Server } from 'http';

let server: Server;

async function main() {
  try {
    await mongoose.connect(configs.database_url as string);
    console.log("Successfully connected to the database");
    server = app.listen(configs.port || 3000, () => {
      console.log(`Server is running on http://localhost:${configs.port || 3000}`);
    });
  } catch (err) {
    console.log(err);
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
