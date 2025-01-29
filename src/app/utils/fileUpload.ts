import multer from "multer";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { NextFunction, Request, Response } from "express";
import AppError from "../errors/AppError";
import httpStatus from "http-status";
import { ProcessedFile, ProcessedFiles } from '../interfaces/fileUpload';
import { compressPdf } from './pdfComressor';

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
      // eslint-disable-next-line no-console
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
          // return next(new AppError(httpStatus.BAD_REQUEST, 'No files uploaded'));
          return next();
        }

        try {
          const files = req.files as Express.Multer.File[];
          // console.log("Files:", files);
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

