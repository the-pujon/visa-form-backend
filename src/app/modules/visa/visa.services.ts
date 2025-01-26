/* eslint-disable @typescript-eslint/no-unused-vars */
import httpStatus from "http-status";
import { IVisaForm } from "./visa.interface";
// import { VisaModel } from "./visa.model";
import AppError from "../../errors/AppError";
import { cloudinaryDestroy } from "../../utils/cloudinaryDelete";
import VisaModel from "./visa.model";

const createVisaApplication = async (payload: IVisaForm) => {
    // console.log("Payload:", payload);
  try {
    const result = await VisaModel.create(payload);
    console.log("Result:", result);
    return result;
  } catch (error) {
    throw new AppError(httpStatus.BAD_REQUEST, "Failed to create visa application");
  }
};

const getVisaApplications = async () => {
  try {
    const result = await VisaModel.find();
    return result;
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
