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
import { compressPdf } from './pdfCopressor';

// Create type for file categories
// type FileCategory = 'image' | 'document' | 'video';

// Create storage configuration
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     const folderPath = path.join(process.cwd(), "uploads", "documents");
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

// Configure multer upload with increased size limits
const upload = multer({
  storage: multer.memoryStorage(), // Change to memory storage for PDF compression
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || 
        file.mimetype === 'application/pdf' ||
        file.mimetype === 'application/msword' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDFs and DOC files are allowed.'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 10000 // Allow up to 10000 files to support many travelers
  },
});

// Process uploaded files
const processUploadedFiles = async (files: Express.Multer.File[]): Promise<ProcessedFile[]> => {
  const processedFiles: ProcessedFile[] = [];
  const uploadFolder = path.join(process.cwd(), "uploads", "documents");

  // Ensure upload folder exists
  if (!fs.existsSync(uploadFolder)) {
    fs.mkdirSync(uploadFolder, { recursive: true });
  }

  for (const file of files) {
    let processedFile: ProcessedFile = {
      path: '',
      filename: file.originalname,
      originalname: file.originalname
    };

    try {
      if (file.mimetype.startsWith('image/')) {
        // Generate unique filename
        const timestamp = Date.now();
        const filename = `compressed_${timestamp}_${file.originalname}`;
        const outputPath = path.join(uploadFolder, filename);

        // Process image directly from buffer
        await sharp(file.buffer)
          .resize(1200)
          .jpeg({ quality: 100 })
          .toFile(outputPath);

        processedFile = {
          ...processedFile,
          path: outputPath,
          filename: filename
        };
      } 
      else if (file.mimetype === 'application/pdf') {
        const compressedResult = await compressPdf(file);
        processedFile = {
          ...processedFile,
          path: compressedResult.compressedPath,
          filename: compressedResult.filename
        };
      }
      else {
        // For other file types, save directly
        const timestamp = Date.now();
        const filename = `${timestamp}_${file.originalname}`;
        const outputPath = path.join(uploadFolder, filename);
        await fs.promises.writeFile(outputPath, file.buffer);
        
        processedFile = {
          ...processedFile,
          path: outputPath,
          filename: filename
        };
      }

      processedFiles.push(processedFile);
    } catch (error) {
      console.error('Error processing file:', error);
      throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, `Error processing file ${file.originalname}`);
    }
  }

  return processedFiles;
};

// Middleware for handling multiple file uploads
export const handleMultipleFiles = (fields: { name: string | RegExp; maxCount: number }[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {

    try {
      const uploadMiddleware = upload.any(); // Use any() instead of fields()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      uploadMiddleware(req, res, async (err: any) => {
        if (err instanceof multer.MulterError) {
          return next(new AppError(httpStatus.BAD_REQUEST, err.message));
        } else if (err) {
          return next(new AppError(httpStatus.BAD_REQUEST, err.message));
        }

        if (!req.files || req.files.length === 0) {
          return next(new AppError(httpStatus.BAD_REQUEST, 'No files uploaded'));
        }

        try {
          const files = req.files as Express.Multer.File[];
          console.log("Files:", files);
          const processedFiles: ProcessedFiles = {};

          // Group files by fieldname
          files.forEach(file => {
            // Check if the fieldname matches any of our expected patterns
            const isValidField = fields.some(field => {
              if (typeof field.name === 'string') {
                return file.fieldname === field.name;
              } else {
                return field.name.test(file.fieldname);
              }
            });

            if (!isValidField) {
              throw new Error(`Unexpected field: ${file.fieldname}`);
            }

            if (!processedFiles[file.fieldname]) {
              processedFiles[file.fieldname] = [];
            }
            processedFiles[file.fieldname].push(file);
          });

          // Process each group of files
          for (const [fieldname, fieldFiles] of Object.entries(processedFiles)) {
            processedFiles[fieldname] = await processUploadedFiles(fieldFiles as Express.Multer.File[]);
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

