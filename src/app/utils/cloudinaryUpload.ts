import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'

cloudinary.config({ 
    cloud_name: 'my_cloud_name', 
    api_key: 'my_key', 
    api_secret: 'my_secret'
  });


  export const cloudinaryUpload = (imageName: string, path: string)  => {

    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(path, { public_id: imageName }, (err, result) => {
        if (err) {
          reject(err)
        } else {
          resolve(result)

          fs.unlink(path,(err) => {
            if (err) throw err;
            console.log('File deleted!');
          })
          
        }
      })
    })
  }