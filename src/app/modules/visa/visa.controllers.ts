import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync.";
import sendResponse from "../../utils/sendResponse";
import { VisaServices } from "./visa.services";
import { Request, Response, NextFunction } from "express";
import { cloudinaryUpload } from "../../utils/cloudinaryUpload";
import { IFile } from "./visa.interface";
import { ProcessedFiles } from '../../interfaces/fileUpload';
import AppError from "../../errors/AppError";

interface UploadedFiles {
  [key: string]: IFile;
}

const createVisaApplication = catchAsync(async (req: Request & { processedFiles?: ProcessedFiles }, res: Response, next: NextFunction) => {
  try {
    // console.log("Request headers:", req.headers);
    // console.log("Raw request body:", req.body);
    // console.log("Request files:", req.processedFiles);

    if (!req.processedFiles || Object.keys(req.processedFiles).length === 0) {
      throw new AppError(httpStatus.BAD_REQUEST, 'No files were uploaded');
    }

    let visaData;
    try {
      // Check if data is already parsed
      if (typeof req.body.data === 'string') {
        visaData = JSON.parse(req.body.data);
      } else {
        visaData = req.body.data;
      }
      
      if (!visaData) {
        throw new Error('No data found in request');
      }

      console.log("Parsed Visa Data:", visaData);
    } catch (error) {
      console.error("JSON Parse Error:", error);
      throw new AppError(httpStatus.BAD_REQUEST, "Invalid form data format");
    }

    const uploadedFiles: UploadedFiles = {};

    // Upload files to cloudinary and get URLs
    for (const [fieldname, fieldFiles] of Object.entries(req.processedFiles)) {
      if (fieldFiles && fieldFiles.length > 0) {
        const file = fieldFiles[0];
        try {
          const uploadedFile = await cloudinaryUpload(file.filename, file.path);
          if (uploadedFile && typeof uploadedFile === 'object' && 'secure_url' in uploadedFile && 'public_id' in uploadedFile) {
            uploadedFiles[fieldname] = {
              url: String(uploadedFile.secure_url),
              id: String(uploadedFile.public_id)
            };
          }
        } catch (error) {
          console.error(`Error uploading ${fieldname}:`, error);
          throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, `Failed to upload ${fieldname}`);
        }
      }
    }

    console.log("Uploaded Files:", uploadedFiles);

    // Create the final visa application data with proper document organization
    const visaApplicationData = {
      ...visaData,
      generalDocuments: {},
      businessDocuments: visaData.visaType === 'business' ? {} : undefined,
      studentDocuments: visaData.visaType === 'student' ? {} : undefined,
      jobHolderDocuments: visaData.visaType === 'jobHolder' ? {} : undefined,
      otherDocuments: visaData.visaType === 'other' ? {} : undefined
    };

    // Organize uploaded files into their respective categories
    Object.entries(uploadedFiles).forEach(([key, value]) => {
      if (key.match(/^(passportCopy|passportPhoto|bankStatement|bankSolvency|visitingCard|hotelBooking|airTicket)$/)) {
        visaApplicationData.generalDocuments[key] = value;
      } else if (visaData.visaType === 'business' && key.match(/^(tradeLicense|notarizedId|memorandum|officePad)$/)) {
        visaApplicationData.businessDocuments[key] = value;
      } else if (visaData.visaType === 'student' && key.match(/^(studentId|travelLetter|birthCertificate)$/)) {
        visaApplicationData.studentDocuments[key] = value;
      } else if (visaData.visaType === 'jobHolder' && key.match(/^(nocCertificate|officialId|bmdcCertificate|barCouncilCertificate|retirementCertificate)$/)) {
        visaApplicationData.jobHolderDocuments[key] = value;
      } else if (visaData.visaType === 'other' && key === 'marriageCertificate') {
        visaApplicationData.otherDocuments[key] = value;
      }
    });

    console.log("Final Visa Application Data:", visaApplicationData);

    const result = await VisaServices.createVisaApplication(visaApplicationData);

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Visa application created successfully",
      data: result,
    });
  } catch (error) {
    console.error("Controller Error:", error);
    next(error);
  }
});

const getVisaApplications = catchAsync(async (req: Request, res: Response) => {
  const result = await VisaServices.getVisaApplications();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Visa applications retrieved successfully",
    data: result,
  });
});

const getVisaApplicationById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await VisaServices.getVisaApplicationById(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Visa application retrieved successfully",
    data: result,
  });
});

export const VisaController = {
  createVisaApplication,
  getVisaApplications,
  getVisaApplicationById,
};
