"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudinaryDestroy = void 0;
const cloudinary_1 = require("cloudinary");
const configs_1 = __importDefault(require("../configs"));
cloudinary_1.v2.config({
    cloud_name: configs_1.default.cloud_name,
    api_key: configs_1.default.cloud_api_key,
    api_secret: configs_1.default.cloud_api_secret,
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cloudinaryDestroy = (publicId) => {
    return new Promise((resolve, reject) => {
        cloudinary_1.v2.uploader.destroy(publicId, (err, result) => {
            if (err) {
                console.error("Error deleting image", err);
                reject(err);
            }
            else {
                resolve(result);
                console.log("Image deletion successful", result);
            }
        });
    });
};
exports.cloudinaryDestroy = cloudinaryDestroy;
