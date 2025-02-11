import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync.";
import sendResponse from "../../utils/sendResponse";
import { VisaServices } from "./visa.services";
import { Request, Response } from "express";
// import { cloudinaryUpload } from "../../utils/cloudinaryUpload";
// import { IFile } from "./visa.interface";
import { ProcessedFiles } from '../../interfaces/fileUpload';
// import AppError from "../../errors/AppError";
// import { processDocumentFile } from "./visa.utils";


const createVisaApplication = catchAsync(async (req: Request & { processedFiles?: ProcessedFiles }, res: Response) => {
  const result = await VisaServices.createVisaApplication(req.body, req.processedFiles!);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Visa application created successfully",
    data: result,
  });
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

const deleteVisaApplication = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await VisaServices.deleteVisaApplication(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Visa application deleted successfully",
    data: result,
  });
});

const updateVisaApplication = catchAsync(async (req: Request & { processedFiles?: ProcessedFiles }, res: Response) => {
  const { id } = req.params;
  const result = await VisaServices.updateVisaApplication(id, req.body, req.processedFiles!);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Visa application updated successfully",
    data: result,
  });
});

const deleteSubTraveler = catchAsync(async (req: Request, res: Response) => {
  const { visaId, subTravelerId } = req.params;
  const result = await VisaServices.deleteSubTraveler(visaId, subTravelerId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Sub-traveler deleted successfully",
    data: result,
  });
});

const updateSubTraveler = catchAsync(async (req: Request, res: Response) => {
  const { visaId, subTravelerId } = req.params;
  const result = await VisaServices.updateSubTraveler(visaId, subTravelerId, req.body, req.processedFiles!);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Sub-traveler updated successfully",
    data: result,
  });
});

const getSubTravelerById = catchAsync(async (req: Request, res: Response) => {
  const { visaId, subTravelerId } = req.params;
  const result = await VisaServices.getSubTravelerById(visaId, subTravelerId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Sub-traveler retrieved successfully",
    data: result,
  });
});

const updatePrimaryTraveler = catchAsync(async (req: Request, res: Response) => {
  const { visaId } = req.params;
  const newTraveler = req.body.newTraveler;
  console.log("newTraveler", newTraveler);
  // const result = await VisaServices.updatePrimaryTraveler(visaId, req.body, req.processedFiles!);

  // sendResponse(res, {
  //   statusCode: httpStatus.OK,
  //   success: true,
  //   message: "Primary traveler updated successfully",
  //   data: result,
  // });
});

export const VisaController = {
  createVisaApplication,
  getVisaApplications,
  getVisaApplicationById,
  deleteVisaApplication,
  updateVisaApplication,
  deleteSubTraveler,
  updateSubTraveler,
  getSubTravelerById,
  updatePrimaryTraveler,
};
