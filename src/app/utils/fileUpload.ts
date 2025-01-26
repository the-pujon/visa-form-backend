// import multer from "multer";
// import sharp from "sharp";
// import fs from "fs";
// import path from "path";
// import { NextFunction, Request, Response } from "express";

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     const folderPath = path.join(process.cwd(), "images");
//     if (!fs.existsSync(folderPath)) {
//       fs.mkdirSync(folderPath, { recursive: true });
//     }
//     cb(null, folderPath);
//   },
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
//     const fileExtension = path.extname(file.originalname);
//     cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);
//   },
// });

// const upload = multer({ storage });

// export const uploadAndCompress = (req: Request, res: Response, next: NextFunction) => {
//   const multerMiddleware = upload.single("file");

//   multerMiddleware(req, res, async (err) => {
//     if (err) {
//       return next(err);
//     }

//     if (!req.file) {
//       // return next(new Error("No file uploaded"));
//       next()
//       return null
//     }

//     try {
//       const compressedFilePath = path.join(
//         req.file.destination,
//         `compressed-${req.file.filename}`
//       );

//       await sharp(req.file.path)
//         .resize(1200)
//         .jpeg({ quality: 80 })
//         .toFile(compressedFilePath);

//       fs.unlinkSync(req.file.path);

//       req.file.path = compressedFilePath;
//       req.file.filename = `compressed-${req.file.filename}`;

//       next();
//     } catch (error) {
//       next(error);
//     }
//   });
// };



import multer from "multer";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { NextFunction, Request, Response } from "express";
import AppError from "../errors/AppError";
import httpStatus from "http-status";
// import config from "../configs";
import { ProcessedFile, ProcessedFiles } from '../interfaces/fileUpload';

// Create type for file categories
// type FileCategory = 'image' | 'document' | 'video';

// Create storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const folderPath = path.join(process.cwd(), "uploads", "documents");
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

// Configure multer upload
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and PDFs are allowed.'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// Process uploaded files
const processUploadedFiles = async (files: Express.Multer.File[]): Promise<ProcessedFile[]> => {
  const processedFiles: ProcessedFile[] = [];

  for (const file of files) {
    const processedFile: ProcessedFile = {
      path: file.path,
      filename: file.filename,
      originalname: file.originalname
    };

    if (file.mimetype.startsWith('image/')) {
      const compressedFilePath = path.join(
        file.destination,
        `compressed-${file.filename}`
      );

      await sharp(file.path)
        .resize(1200)
        .jpeg({ quality: 80 })
        .toFile(compressedFilePath);

      fs.unlinkSync(file.path);
      processedFile.path = compressedFilePath;
      processedFile.filename = `compressed-${file.filename}`;
    }

    processedFiles.push(processedFile);
  }

  return processedFiles;
};

// Middleware for handling multiple file uploads
export const handleMultipleFiles = (fields: { name: string; maxCount: number }[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const uploadMiddleware = upload.fields(fields);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      uploadMiddleware(req, res, async (err: any) => {
        if (err instanceof multer.MulterError) {
          return next(new AppError(httpStatus.BAD_REQUEST, err.message));
        } else if (err) {
          return next(new AppError(httpStatus.BAD_REQUEST, err.message));
        }

        if (!req.files || Object.keys(req.files).length === 0) {
          return next(new AppError(httpStatus.BAD_REQUEST, 'No files uploaded'));
        }

        try {
          const files = req.files as { [fieldname: string]: Express.Multer.File[] };
          const processedFiles: ProcessedFiles = {};

          for (const [fieldname, fieldFiles] of Object.entries(files)) {
            processedFiles[fieldname] = await processUploadedFiles(fieldFiles);
          }

          req.processedFiles = processedFiles;
          next();
        } catch (error) {
          next(error);
        }
      });
    } catch (error) {
      next(error);
    }
  };
};

