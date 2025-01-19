"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudinaryUpload = void 0;
const cloudinary_1 = require("cloudinary");
const configs_1 = __importDefault(require("../configs"));
cloudinary_1.v2.config({
    cloud_name: configs_1.default.cloud_name,
    api_key: configs_1.default.cloud_api_key,
    api_secret: configs_1.default.cloud_api_secret,
});
const cloudinaryUpload = (imageName, path) => {
    // console.log("uploading image")
    return new Promise((resolve, reject) => {
        cloudinary_1.v2.uploader.upload(path, { public_id: imageName }, (err, result) => {
            if (err) {
                // console.error("error uploading image", err)
                reject(err);
            }
            else {
                resolve(result);
                // console.log("Upload successful")
                //   console.log(result)
                // fs.unlink(path, (err) => {
                //   if (err) throw err;
                //   // console.log('File deleted!');
                // });
            }
        });
    });
};
exports.cloudinaryUpload = cloudinaryUpload;
