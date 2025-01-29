/* eslint-disable no-console */
import { v2 as cloudinary } from "cloudinary";
import configs from "../configs";

cloudinary.config({
  cloud_name: configs.cloud_name,
  api_key: configs.cloud_api_key,
  api_secret: configs.cloud_api_secret,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const cloudinaryDestroyOneByOne = async (publicId: string): Promise<any> => {
  // Remove file extension from publicId if it exists
  // const cleanPublicId = publicId.replace(/\.(pdf|jpg|jpeg|png|webp)$/, '');
  
  // Check if the file is a PDF or image
  const isPDF = publicId.toLowerCase().endsWith('.pdf');
  
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(
      publicId, 
      { resource_type: isPDF ? "raw" : "image" }, 
      (err, result) => {
        if (err) {
          console.error("Error deleting file", err);
          reject(err);
        } else {
          console.log(`File deletion result for ${publicId}:`, result);
          resolve(result);
        }
      }
    );
  });
};


export const cloudinaryDeleteAllResources = async () => {
  try {
    // Delete both types concurrently
    await Promise.all([
      cloudinary.api.delete_resources_by_prefix('pujon', { resource_type: 'image' }),
      cloudinary.api.delete_resources_by_prefix('pujon', { resource_type: 'raw' })
    ]);
    console.log('All files deleted successfully');
  } catch (error) {
    console.error('Error deleting files:', error);
  }
}
