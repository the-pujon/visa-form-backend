import multer from "multer";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { NextFunction, Request, Response } from "express";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const folderPath = path.join(process.cwd(), "images");
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    cb(null, folderPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const fileExtension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);
  },
});

const upload = multer({ storage });

export const uploadAndCompress = (req: Request, res: Response, next: NextFunction) => {
  const multerMiddleware = upload.single("file");

  multerMiddleware(req, res, async (err) => {
    if (err) {
      return next(err);
    }

    if (!req.file) {
      return next(new Error("No file uploaded"));
    }

    try {
      const compressedFilePath = path.join(
        req.file.destination,
        `compressed-${req.file.filename}`
      );

      await sharp(req.file.path)
        .resize(1200)
        .jpeg({ quality: 80 })
        .toFile(compressedFilePath);

      fs.unlinkSync(req.file.path);

      req.file.path = compressedFilePath;
      req.file.filename = `compressed-${req.file.filename}`;

      next();
    } catch (error) {
      next(error);
    }
  });
};

