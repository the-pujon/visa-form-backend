import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import configs from "../configs";

cloudinary.config({
  cloud_name: configs.cloud_name,
  api_key: configs.cloud_api_key,
  api_secret: configs.cloud_api_secret,
});

export const cloudinaryUpload = (imageName: string, path: string, email: string) => {
  // Check if file exists before attempting upload
  if (!fs.existsSync(path)) {
    return Promise.reject(new Error(`File not found at path: ${path}`));
  }

  const fileExtension = path.split('.').pop()?.toLowerCase();
  const uploadOptions = {
    public_id: imageName,
    folder: email,
    ...(fileExtension === 'pdf' ? {
      resource_type: 'raw' as const,
      format: 'pdf'
    } : {
      transformation: [{
        quality: 'auto',
      }]
    })
  };

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      path,
      uploadOptions,
      (err, result) => {
        if (err) {
          console.error("Error uploading to cloudinary:", err);
          reject(err);
        } else {
          // console.log(result)
          resolve(result);
          
          // Delete file after successful upload
          fs.unlink(path, (unlinkErr) => {
            if (unlinkErr) {
              console.error('Error deleting file after upload:', unlinkErr);
            } else {
              console.log('File uploaded and deleted successfully');
            }
          });
        }
      },
    );
  });
};
