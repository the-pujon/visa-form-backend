import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync.";
import sendResponse from "../../utils/sendResponse";
import { VisaServices } from "./visa.services";
import { Request, Response, NextFunction } from "express";
import { cloudinaryUpload } from "../../utils/cloudinaryUpload";
import { IFile } from "./visa.interface";
import { ProcessedFiles } from '../../interfaces/fileUpload';
import AppError from "../../errors/AppError";


const createVisaApplication = catchAsync(async (req: Request & { processedFiles?: ProcessedFiles }, res: Response, next: NextFunction) => {
  try {
    if (!req.processedFiles || Object.keys(req.processedFiles).length === 0) {
      throw new AppError(httpStatus.BAD_REQUEST, 'No files were uploaded');
    }

    const visaData = req.body;
    const uploadedFiles: { [key: string]: IFile } = {};

    // Process all files from the request
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

    // Initialize visa application data structure
    const visaApplicationData = {
      ...visaData,
      generalDocuments: {},
      businessDocuments: visaData.visaType === 'business' ? {} : undefined,
      studentDocuments: visaData.visaType === 'student' ? {} : undefined,
      jobHolderDocuments: visaData.visaType === 'jobHolder' ? {} : undefined,
      otherDocuments: visaData.visaType === 'other' ? {} : undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      subTravelers: visaData.subTravelers?.map((subTraveler: any) => ({
        ...subTraveler,
        generalDocuments: {},
        businessDocuments: subTraveler.visaType === 'business' ? {} : undefined,
        studentDocuments: subTraveler.visaType === 'student' ? {} : undefined,
        jobHolderDocuments: subTraveler.visaType === 'jobHolder' ? {} : undefined,
        otherDocuments: subTraveler.visaType === 'other' ? {} : undefined
      }))
    };

    // Process primary traveler's files
    Object.entries(uploadedFiles).forEach(([key, value]) => {
      if (key.startsWith('primaryTraveler_')) {
        const documentKey = key.replace('primaryTraveler_', '');
        processDocumentFile(visaApplicationData, documentKey, value, visaData.visaType);
      }
    });

    // Process sub-travelers' files - using regex to match any sub-traveler index
    if (visaApplicationData.subTravelers) {
      Object.entries(uploadedFiles).forEach(([key, value]) => {
        const subTravelerMatch = key.match(/^subTraveler(\d+)_(.+)$/);
        if (subTravelerMatch) {
          const [, indexStr, documentKey] = subTravelerMatch;
          const index = parseInt(indexStr);
          const subTraveler = visaApplicationData.subTravelers[index];
          
          if (subTraveler) {
            processDocumentFile(subTraveler, documentKey, value, subTraveler.visaType);
          }
        }
      });
    }

    const result = await VisaServices.createVisaApplication(visaApplicationData);

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Visa application created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// Helper function to process document files
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const processDocumentFile = (traveler: any, documentKey: string, value: IFile, visaType: string) => {
  if (documentKey.match(/^(passportCopy|passportPhoto|bankStatement|bankSolvency|visitingCard|hotelBooking|airTicket)$/)) {
    traveler.generalDocuments[documentKey] = value;
  } else if (visaType === 'business' && documentKey.match(/^(tradeLicense|notarizedId|memorandum|officePad)$/)) {
    traveler.businessDocuments[documentKey] = value;
  } else if (visaType === 'student' && documentKey.match(/^(studentId|travelLetter|birthCertificate)$/)) {
    traveler.studentDocuments[documentKey] = value;
  } else if (visaType === 'jobHolder' && documentKey.match(/^(nocCertificate|officialId|bmdcCertificate|barCouncilCertificate|retirementCertificate)$/)) {
    traveler.jobHolderDocuments[documentKey] = value;
  } else if (visaType === 'other' && documentKey === 'marriageCertificate') {
    traveler.otherDocuments[documentKey] = value;
  }
};

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
