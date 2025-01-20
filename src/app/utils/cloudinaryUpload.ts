import { v2 as cloudinary } from "cloudinary";
// import fs from "fs";
import configs from "../configs";

cloudinary.config({
  cloud_name: configs.cloud_name,
  api_key: configs.cloud_api_key,
  api_secret: configs.cloud_api_secret,
});

export const cloudinaryUpload = (imageName: string, path: string) => {
  // console.log("uploading image")
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      path,
      { public_id: imageName },
      (err, result) => {
        if (err) {
          // console.error("error uploading image", err)
          reject(err);
        } else {
          resolve(result);
          // console.log("Upload successful")
          //   console.log(result)

          // fs.unlink(path, (err) => {
          //   if (err) throw err;
          //   // console.log('File deleted!');
          // });
        }
      },
    );
  });
};
