/* eslint-disable no-console */
import mongoose from "mongoose";
import app from "./app";
import configs from "./app/configs";

const port = configs.port || 3000;

async function main() {
  try {
    await mongoose.connect(configs.database_url as string);
    console.log("Successfully connected to the database");
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } catch (err) {
    console.log(err);
  }
}

main();
