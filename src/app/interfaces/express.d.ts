
declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface ProcessedFile {
      path: string;
      filename: string;
      originalname: string;
    }

    interface Request {
      processedFiles?: {
        [fieldname: string]: ProcessedFile[];
      };
    }
  }
}

export {}; 