import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import { cloudinaryDestroy } from "../../utils/cloudinaryDelete";
import VisaModel from "./visa.model";
import { ProcessedFiles } from "../../interfaces/fileUpload";
import { prepareVisaApplicationData, processAndUploadFiles } from "./visa.utils";


// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createVisaApplication = async (visaData: any, processedFiles: ProcessedFiles) => {
  if (!processedFiles || Object.keys(processedFiles).length === 0) {
    throw new AppError(httpStatus.BAD_REQUEST, 'No files were uploaded');
  }

  const uploadedFiles = await processAndUploadFiles(processedFiles);
  const visaApplicationData = prepareVisaApplicationData(visaData, uploadedFiles);
  
  const result = await VisaModel.create(visaApplicationData);
  return result;
};

const getVisaApplications = async () => {
  try {
    const result = await VisaModel.find();
    return result;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    throw new AppError(httpStatus.BAD_REQUEST, "Failed to retrieve visa applications");
  }
};

const getVisaApplicationById = async (id: string) => {
  try {
    const result = await VisaModel.findById(id);
    if (!result) {
      throw new AppError(httpStatus.NOT_FOUND, "Visa application not found");
    }
    return result;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Failed to retrieve visa application"
    );
  }
};

const deleteVisaApplication = async (id: string) => {
  try {
    const application = await VisaModel.findById(id);
    if (!application) {
      throw new AppError(httpStatus.NOT_FOUND, "Visa application not found");
    }

    // Delete all associated files from cloudinary
    const documents = [
      ...Object.values(application.generalDocuments || {}),
      ...Object.values(application.businessDocuments || {}),
      ...Object.values(application.studentDocuments || {}),
      ...Object.values(application.jobHolderDocuments || {}),
      ...Object.values(application.otherDocuments || {})
    ];

    for (const doc of documents) {
      if (doc && doc.id) {
        await cloudinaryDestroy(doc.id);
      }
    }

    const result = await VisaModel.findByIdAndDelete(id);
    return result;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Failed to delete visa application"
    );
  }
};

export const VisaServices = {
  createVisaApplication,
  getVisaApplications,
  getVisaApplicationById,
  deleteVisaApplication,
};
