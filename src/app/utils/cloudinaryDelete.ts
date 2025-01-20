/* eslint-disable no-console */
import { v2 as cloudinary } from "cloudinary";
import configs from "../configs";

cloudinary.config({
  cloud_name: configs.cloud_name,
  api_key: configs.cloud_api_key,
  api_secret: configs.cloud_api_secret,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const cloudinaryDestroy = (publicId: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (err, result) => {
      if (err) {
        console.error("Error deleting image", err);
        reject(err);
      } else {
        resolve(result);
        console.log("Image deletion successful", result);
      }
    });
  });
};
