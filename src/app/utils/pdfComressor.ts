import { exec } from 'child_process';
import { existsSync } from 'fs';
import fs from 'fs/promises';
import path from 'path';
import { promisify } from 'util';

const execPromise = promisify(exec);
const cwd = process.cwd();

export async function compressPdf(file: Express.Multer.File) {
    try {
      const uploadFolder = path.join(cwd, "uploads", "original");
      const compressedFolder = path.join(process.cwd(), "uploads", "documents");

      // Ensure folders exist
      for (const folder of [uploadFolder, compressedFolder]) {
        if (!existsSync(folder)) {
          await fs.mkdir(folder, { recursive: true });
        }
      }

      // Generate unique filename using timestamp
      const timestamp = Date.now();
      const originalFilename = `original_${timestamp}.pdf`;
      const compressedFilename = `compressed_${timestamp}.pdf`;

      const originalFilePath = path.join(uploadFolder, originalFilename);
      const compressFilePath = path.join(compressedFolder, compressedFilename);

      // Save the file based on whether we have a buffer or path
      if (file.buffer) {
        await fs.writeFile(originalFilePath, file.buffer);
      } else if (file.path) {
        await fs.copyFile(file.path, originalFilePath);
        await fs.unlink(file.path); // Clean up the original file
      } else {
        throw new Error('No file content available');
      }

      // Windows-specific Ghostscript command
      const gsCommand = `gswin64c -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/screen -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${compressFilePath}" "${originalFilePath}"`;

      await execPromise(gsCommand);

      // Delete the original file after compression
      await fs.unlink(originalFilePath);

      return {
        originalPath: originalFilePath,
        compressedPath: compressFilePath,
        filename: compressedFilename
      };
    } catch (error) {
      console.error('Compression error:', error);
      throw error;
    }
  }