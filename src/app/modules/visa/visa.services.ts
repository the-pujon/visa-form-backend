import httpStatus from "http-status";
import AppError from "../../errors/AppError";
// import { cloudinaryDestroy, deleteFolderWithFiles } from "../../utils/cloudinaryDelete";
import VisaModel from "./visa.model";
import { ProcessedFiles } from "../../interfaces/fileUpload";
import { extractDocuments, prepareVisaApplicationData, processAndUploadFiles, updateDocumentField } from "./visa.utils";
import { 
  IFile,
  // IGeneralDocuments,
  IVisaForm
} from "./visa.interface";
import { v2 as cloudinary } from "cloudinary";
import configs from "../../configs";
import { cloudinaryDestroyOneByOne } from "../../utils/cloudinaryDelete";

cloudinary.config({
  cloud_name: configs.cloud_name,
  api_key: configs.cloud_api_key,
  api_secret: configs.cloud_api_secret,
});

/**
 * Creates a new visa application with uploaded documents
 * @param visaData - The form data for the visa application
 * @param processedFiles - Files uploaded by the user
 * @returns The created visa application document
 * @throws AppError if no files were uploaded
 */
const createVisaApplication = async (visaData: IVisaForm, processedFiles: ProcessedFiles) => {
  if (!processedFiles || Object.keys(processedFiles).length === 0) {
    throw new AppError(httpStatus.BAD_REQUEST, 'No files were uploaded');
  }

  console.log(processedFiles);

  const uploadedFiles = await processAndUploadFiles(processedFiles, visaData.email);
  const visaApplicationData = prepareVisaApplicationData(visaData, uploadedFiles);

  // Check if primary traveler already exists
  const existingApplication = await VisaModel.findOne({ email: visaApplicationData.email });
  
  if (existingApplication) {
    // If application exists and has new subtravelers, append them
    if (visaApplicationData.subTravelers && visaApplicationData.subTravelers.length > 0) {
      const result = await VisaModel.findByIdAndUpdate(
        existingApplication._id,
        {
          $push: {
            subTravelers: {
              $each: visaApplicationData.subTravelers
            }
          }
        },
        { new: true, runValidators: true }
      );

      if (!result) {
        throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to update existing application');
      }

      return result;
    } else {
      throw new AppError(httpStatus.BAD_REQUEST, 'Primary traveler already exists and no new subtravelers provided');
    }
  }
  
  // If no existing application, create new one
  const result = await VisaModel.create(visaApplicationData);
  return result;
};

/**
 * Retrieves all visa applications from the database
 * @returns Array of all visa applications
 * @throws AppError if retrieval fails
 */
const getVisaApplications = async () => {
  try {
    const result = await VisaModel.find();
    return result;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    throw new AppError(httpStatus.BAD_REQUEST, "Failed to retrieve visa applications");
  }
};

/**
 * Retrieves a specific visa application by its ID
 * @param id - The ID of the visa application to retrieve
 * @returns The requested visa application document
 * @throws AppError if application is not found or retrieval fails
 */
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

/**
 * Deletes a visa application and its associated files from both database and cloud storage
 * @param id - The ID of the visa application to delete
 * @returns The deleted visa application document
 * @throws AppError if application is not found or deletion fails
 */
const deleteVisaApplication = async (id: string) => {
  try {
    const application = await VisaModel.findById(id);
    if (!application) {
      throw new AppError(httpStatus.NOT_FOUND, "Visa application not found");
    }

    const fileData: { documentType: string; url: string; id: string }[] = [];

    fileData.push(...extractDocuments(application.toObject().generalDocuments));
    fileData.push(...extractDocuments(application.toObject().businessDocuments || {}));
    fileData.push(...extractDocuments(application.toObject().studentDocuments || {}));
    fileData.push(...extractDocuments(application.toObject().jobHolderDocuments || {}));
    fileData.push(...extractDocuments(application.toObject().otherDocuments || {}));

    application.subTravelers?.forEach((traveler) => {
      fileData.push(...extractDocuments(traveler.generalDocuments || {}));
      fileData.push(...extractDocuments(traveler.businessDocuments || {}));
      fileData.push(...extractDocuments(traveler.studentDocuments || {}));
      fileData.push(...extractDocuments(traveler.jobHolderDocuments || {}));
      fileData.push(...extractDocuments(traveler.otherDocuments || {}));
    });

    await Promise.all(
      fileData.map((file) => cloudinaryDestroyOneByOne(file.id))
    );

    const result = await VisaModel.findByIdAndDelete(id);
    return result;
  } catch (error) {
    console.error("Delete visa application error:", error);
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Failed to delete visa application"
    );
  }
};

/**
 * Updates an existing visa application with new data and/or files
 * @param id - The ID of the visa application to update
 * @param visaData - The new form data to update
 * @param processedFiles - New files to upload and update
 * @returns The updated visa application document
 * @throws AppError if application is not found or update fails
 */
const updateVisaApplication = async (id: string, visaData: Partial<IVisaForm>, processedFiles: ProcessedFiles) => {
  try {
    const existingApplication = await VisaModel.findById(id);
    if (!existingApplication) {
      throw new AppError(httpStatus.NOT_FOUND, "Visa application not found");
    }

    const existingData = existingApplication.toObject();
    const updateData = {
      givenName: visaData.givenName || existingData.givenName,
      surname: visaData.surname || existingData.surname,
      phone: visaData.phone || existingData.phone,
      email: visaData.email || existingData.email,
      address: visaData.address || existingData.address,
      notes: visaData.notes ?? existingData.notes,
      visaType: visaData.visaType || existingData.visaType,
      generalDocuments: { ...existingData.generalDocuments },
      businessDocuments: existingData.businessDocuments ? { ...existingData.businessDocuments } : undefined,
      studentDocuments: existingData.studentDocuments ? { ...existingData.studentDocuments } : undefined,
      jobHolderDocuments: existingData.jobHolderDocuments ? { ...existingData.jobHolderDocuments } : undefined,
      otherDocuments: existingData.otherDocuments ? { ...existingData.otherDocuments } : undefined,
      subTravelers: existingData.subTravelers ? existingData.subTravelers.map(traveler => ({
        ...traveler,
      })) : undefined
    };

    // Process and upload new files if any were provided
    let newUploadedFiles: Record<string, IFile> = {};

    if (processedFiles && Object.keys(processedFiles).length > 0) {
      newUploadedFiles = await processAndUploadFiles(processedFiles, existingApplication.email);
      
      // Iterate through uploaded files and organize them
      for (const [key, value] of Object.entries(newUploadedFiles)) {
        // Handle primary traveler documents
        if (key.startsWith('primaryTraveler_')) {
          const documentKey = key.replace('primaryTraveler_', '');
          updateDocumentField(documentKey, value, updateData, existingApplication);
        }
        // Handle sub-travelers documents
        // else if (key.match(/^subTraveler\d+_/)) {
        //   const [, indexStr, documentKey] = key.match(/^subTraveler(\d+)_(.+)$/) || [];
        //   if (indexStr && documentKey) {
        //     const index = parseInt(indexStr);
            
        //     // Ensure sub-travelers array exists
        //     if (!updateData.subTravelers) {
        //       updateData.subTravelers = [...(existingApplication.subTravelers || [])];
        //     }
            
        //     // Ensure specific sub-traveler exists
        //     if (!updateData.subTravelers[index]) {
        //       updateData.subTravelers[index] = { 
        //         ...existingApplication.subTravelers?.[index],
        //         givenName: existingApplication.subTravelers?.[index]?.givenName || '',
        //         surname: existingApplication.subTravelers?.[index]?.surname || '',
        //         phone: existingApplication.subTravelers?.[index]?.phone || '',
        //         email: existingApplication.subTravelers?.[index]?.email || '',
        //         address: existingApplication.subTravelers?.[index]?.address || '',
        //         visaType: existingApplication.subTravelers?.[index]?.visaType || '',
        //         generalDocuments: existingApplication.subTravelers?.[index]?.generalDocuments as IGeneralDocuments,
        //         businessDocuments: existingApplication.subTravelers?.[index]?.businessDocuments,
        //         studentDocuments: existingApplication.subTravelers?.[index]?.studentDocuments,
        //         jobHolderDocuments: existingApplication.subTravelers?.[index]?.jobHolderDocuments,
        //         otherDocuments: existingApplication.subTravelers?.[index]?.otherDocuments,
        //       };
        //     }

        //     updateDocumentField(
        //       documentKey, 
        //       value, 
        //       updateData.subTravelers[index], 
        //       existingApplication.subTravelers?.[index] || {}
        //     );
        //   }
        // }
      }
    }

    // Update the application in database
    const result = await VisaModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!result) {
      throw new AppError(httpStatus.NOT_FOUND, "Failed to update visa application");
    }

    return result;
  } catch (error) {
    console.error('Update visa application error:', error);
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Failed to update visa application"
    );
  }
};

const deleteSubTraveler = async (visaId: string, subTravelerId: string) => {
  try {
    // First get the subtraveler's documents to delete from cloudinary
    const application = await VisaModel.findOne(
      { 
        _id: visaId,
        'subTravelers._id': subTravelerId 
      },
      { 
        'subTravelers.$': 1 
      }
    );

    if (!application || !application.subTravelers?.[0]) {
      throw new AppError(httpStatus.NOT_FOUND, "Sub-traveler not found");
    }

    const subTraveler = application.subTravelers[0];

    // Extract all files from the subtraveler's documents
    const fileData: { documentType: string; url: string; id: string }[] = [];
    fileData.push(...extractDocuments(subTraveler.generalDocuments || {}));
    fileData.push(...extractDocuments(subTraveler.businessDocuments || {}));
    fileData.push(...extractDocuments(subTraveler.studentDocuments || {}));
    fileData.push(...extractDocuments(subTraveler.jobHolderDocuments || {}));
    fileData.push(...extractDocuments(subTraveler.otherDocuments || {}));

    // Delete all files from cloudinary
    await Promise.all(
      fileData.map((file) => cloudinaryDestroyOneByOne(file.id))
    );

    // Remove the subtraveler using $pull operator in a single operation
    const result = await VisaModel.findByIdAndUpdate(
      visaId,
      {
        $pull: {
          subTravelers: { _id: subTravelerId }
        }
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!result) {
      throw new AppError(httpStatus.NOT_FOUND, "Visa application not found");
    }

    return result;

  } catch (error) {
    console.error("Delete sub-traveler error:", error);
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Failed to delete sub-traveler"
    );
  }
};

/**
 * Updates a specific sub-traveler in a visa application
 * @param visaId - The ID of the main visa application
 * @param subTravelerId - The ID of the sub-traveler to update
 * @param updateData - The data to update for the sub-traveler
 * @param processedFiles - New files to upload and update
 * @returns The updated visa application document
 * @throws AppError if application is not found or update fails
 */
const updateSubTraveler = async (
  visaId: string,
  subTravelerId: string,
  updateData: Partial<IVisaForm>,
  processedFiles?: ProcessedFiles
) => {
  try {
    // Find the visa application and the specific sub-traveler
    const visaApplication = await VisaModel.findById(visaId);
    if (!visaApplication) {
      throw new AppError(httpStatus.NOT_FOUND, "Visa application not found");
    }

    const subTraveler = visaApplication.subTravelers!.find(
      (st) => st._id?.toString() === subTravelerId
    );


    console.log(subTraveler);

    if (!subTraveler) {
      throw new AppError(httpStatus.NOT_FOUND, "Sub-traveler not found");
    }

    // Initialize update data with existing fields
    const updateDataWithExistingFields = {
      givenName: updateData.givenName || subTraveler.givenName,
      surname: updateData.surname || subTraveler.surname,
      phone: updateData.phone || subTraveler.phone,
      email: updateData.email || subTraveler.email,
      address: updateData.address || subTraveler.address,
      notes: updateData.notes || subTraveler.notes,
      visaType: updateData.visaType || subTraveler.visaType,
      generalDocuments: { ...subTraveler.generalDocuments },
      businessDocuments: subTraveler.businessDocuments ? { ...subTraveler.businessDocuments } : undefined,
      studentDocuments: subTraveler.studentDocuments ? { ...subTraveler.studentDocuments } : undefined,
      jobHolderDocuments: subTraveler.jobHolderDocuments ? { ...subTraveler.jobHolderDocuments } : undefined,
      otherDocuments: subTraveler.otherDocuments ? { ...subTraveler.otherDocuments } : undefined,
    };

    // Handle file uploads if new files are provided
    let newUploadedFiles: Record<string, IFile> = {};

    if (processedFiles && Object.keys(processedFiles).length > 0) {
      // Upload new files
      newUploadedFiles = await processAndUploadFiles(processedFiles, visaApplication.email);
      
      // Process uploaded files
      for (const [key, value] of Object.entries(newUploadedFiles)) {
        // Handle both formats: subTraveler_documentType and subTravelerN_documentType
        const documentKey = key.replace(/^subTraveler(?:\d+)?_/, '');

        updateDocumentField(documentKey, value, updateDataWithExistingFields, subTraveler);
      }
    }

    // Update the sub-traveler
    const result = await VisaModel.findOneAndUpdate(
      { 
        _id: visaId,
        'subTravelers._id': subTravelerId 
      },
      { 
        $set: {
          'subTravelers.$.givenName': updateDataWithExistingFields.givenName,
          'subTravelers.$.surname': updateDataWithExistingFields.surname,
          'subTravelers.$.phone': updateDataWithExistingFields.phone,
          'subTravelers.$.email': updateDataWithExistingFields.email,
          'subTravelers.$.address': updateDataWithExistingFields.address,
          'subTravelers.$.notes': updateDataWithExistingFields.notes,
          'subTravelers.$.visaType': updateDataWithExistingFields.visaType,
          'subTravelers.$.generalDocuments': updateDataWithExistingFields.generalDocuments,
          'subTravelers.$.businessDocuments': updateDataWithExistingFields.businessDocuments,
          'subTravelers.$.studentDocuments': updateDataWithExistingFields.studentDocuments,
          'subTravelers.$.jobHolderDocuments': updateDataWithExistingFields.jobHolderDocuments,
          'subTravelers.$.otherDocuments': updateDataWithExistingFields.otherDocuments
        }
      },
      { new: true, runValidators: true }
    );

    if (!result) {
      throw new AppError(httpStatus.NOT_FOUND, "Failed to update sub-traveler in db");
    }

    return result;
  } catch (error) {
    console.error("Update sub-traveler error:", error);
    throw new AppError(
      httpStatus.BAD_REQUEST,
      error instanceof AppError ? error.message : "Failed to update sub-traveler"
    );
  }
};

export const VisaServices = {
  createVisaApplication,
  getVisaApplications,
  getVisaApplicationById,
  deleteVisaApplication,
  updateVisaApplication,
  deleteSubTraveler,
  updateSubTraveler,
};
