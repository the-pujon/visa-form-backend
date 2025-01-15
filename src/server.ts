/* eslint-disable no-console */
import app from "./app";

async function main() {
  try {
    app.listen(3000, () => {
      console.log("Server is running on http://localhost:3000");
    });
  } catch (err) {
    console.log(err);
  }
}

main();
