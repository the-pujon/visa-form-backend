import httpStatus from "http-status";
import AppError from "../../errors/AppError";
// import { cloudinaryDestroy } from "../../utils/cloudinaryDelete";
import VisaModel from "./visa.model";
import { ProcessedFiles } from "../../interfaces/fileUpload";
import { extractDocuments, prepareVisaApplicationData, processAndUploadFiles, updateDocumentField } from "./visa.utils";
import {
  IBusinessDocuments,
  IFile,
  IGeneralDocuments,
  IJobHolderDocuments,
  IOtherDocuments,
  IStudentDocuments,
  IVisaForm
} from "./visa.interface";
import { cloudinaryDestroyOneByOne } from "../../utils/cloudinaryDelete";

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
 * @param updateData - The new form data to update
 * @param processedFiles - New files to upload and update
 * @returns The updated visa application document
 * @throws AppError if application is not found or update fails
 */
const updateVisaApplication = async (
  id: string,
  updateData: Partial<IVisaForm>,
  processedFiles?: ProcessedFiles
): Promise<IVisaForm | null> => {
  // Find the visa application
  const visaApplication = await VisaModel.findById(id);
  if (!visaApplication) {
    throw new AppError(httpStatus.NOT_FOUND, 'Visa application not found');
  }

  // Create update data object with existing fields
  const updateDataWithExistingFields: Partial<IVisaForm> = {
    givenName: visaApplication.givenName,
    surname: visaApplication.surname,
    phone: visaApplication.phone,
    email: visaApplication.email,
    address: visaApplication.address,
    notes: visaApplication.notes,
    visaType: updateData.visaType,
    generalDocuments: {
      passportCopy: visaApplication.generalDocuments?.passportCopy || {} as IFile,
      passportPhoto: visaApplication.generalDocuments?.passportPhoto || {} as IFile,
      bankStatement: visaApplication.generalDocuments?.bankStatement || {} as IFile,
      bankSolvency: visaApplication.generalDocuments?.bankSolvency || {} as IFile,
      visitingCard: visaApplication.generalDocuments?.visitingCard || {} as IFile,
      hotelBooking: visaApplication.generalDocuments?.hotelBooking || {} as IFile,
      airTicket: visaApplication.generalDocuments?.airTicket || {} as IFile,
    } as IGeneralDocuments
  };

  let oldVisaTypeDoc;

  if (updateData.visaType) {
    if (updateData.visaType !== visaApplication.visaType) {
      switch (visaApplication.visaType) {
        case 'student':
          oldVisaTypeDoc = visaApplication.studentDocuments;
          break;
        case 'jobHolder':
          oldVisaTypeDoc = visaApplication.jobHolderDocuments;
          break;
        case 'business':
          oldVisaTypeDoc = visaApplication.businessDocuments;
          break;
        case 'other':
          oldVisaTypeDoc = visaApplication.otherDocuments;
          break;
      }
    }
  }

  if (oldVisaTypeDoc) {
    const oldVisaTypeDocPlain = oldVisaTypeDoc.toObject();
    for (const [key, value] of Object.entries(oldVisaTypeDocPlain)) {

      if (key !== '_id') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await cloudinaryDestroyOneByOne((value as any).id)
      }
    }
  }

  // Initialize new document type object based on new visa type
  // Only change document types if visa type has changed
  if (updateData.visaType && updateData.visaType !== visaApplication.visaType) {
    switch (updateData.visaType) {
      case 'student':
        updateDataWithExistingFields.studentDocuments = {} as IStudentDocuments;
        updateDataWithExistingFields.jobHolderDocuments = undefined;
        updateDataWithExistingFields.businessDocuments = undefined;
        updateDataWithExistingFields.otherDocuments = undefined;
        break;
      case 'jobHolder':
        updateDataWithExistingFields.studentDocuments = undefined;
        updateDataWithExistingFields.jobHolderDocuments = {} as IJobHolderDocuments;
        updateDataWithExistingFields.businessDocuments = undefined;
        updateDataWithExistingFields.otherDocuments = undefined;
        break;
      case 'business':
        updateDataWithExistingFields.studentDocuments = undefined;
        updateDataWithExistingFields.jobHolderDocuments = undefined;
        updateDataWithExistingFields.businessDocuments = {} as IBusinessDocuments;
        updateDataWithExistingFields.otherDocuments = undefined;
        break;
      case 'other':
        updateDataWithExistingFields.studentDocuments = undefined;
        updateDataWithExistingFields.jobHolderDocuments = undefined;
        updateDataWithExistingFields.businessDocuments = undefined;
        updateDataWithExistingFields.otherDocuments = {} as IOtherDocuments;
        break;
    }
  } else {
    // Keep existing document data if visa type hasn't changed
    updateDataWithExistingFields.studentDocuments = visaApplication.studentDocuments;
    updateDataWithExistingFields.jobHolderDocuments = visaApplication.jobHolderDocuments;
    updateDataWithExistingFields.businessDocuments = visaApplication.businessDocuments;
    updateDataWithExistingFields.otherDocuments = visaApplication.otherDocuments;
  }

  // Then handle file uploads if any
  if (processedFiles && Object.keys(processedFiles).length > 0) {
    // Delete existing files that are being replaced
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const [key, _] of Object.entries(processedFiles)) {
      const documentKey = key.replace(/^primaryTraveler_/, '');

      // Find the existing file in the appropriate document section
      let existingFile: IFile | undefined;

      if (documentKey in (visaApplication.generalDocuments || {})) {
        existingFile = (visaApplication.generalDocuments as never)[documentKey];
      } else if (documentKey in (visaApplication.studentDocuments || {})) {
        existingFile = (visaApplication.studentDocuments as never)[documentKey];
      } else if (documentKey in (visaApplication.jobHolderDocuments || {})) {
        existingFile = (visaApplication.jobHolderDocuments as never)[documentKey];
      } else if (documentKey in (visaApplication.businessDocuments || {})) {
        existingFile = (visaApplication.businessDocuments as never)[documentKey];
      } else if (documentKey in (visaApplication.otherDocuments || {})) {
        existingFile = (visaApplication.otherDocuments as never)[documentKey];
      }

      // Delete the existing file from Cloudinary if it exists
      if (existingFile?.id) {
        try {
          await cloudinaryDestroyOneByOne(existingFile.id);
        } catch (error) {
          console.error(`Failed to delete file ${existingFile.id} from Cloudinary:`, error);
        }
      }
    }

    const newUploadedFiles = await processAndUploadFiles(processedFiles, visaApplication.email);

    // Process uploaded files based on current visa type
    for (const [key, value] of Object.entries(newUploadedFiles)) {
      const documentKey = key.replace(/^primaryTraveler_/, '');
      updateDocumentField(documentKey, value, updateDataWithExistingFields, visaApplication);
    }
  }

  // Create MongoDB update object with explicit unset operations
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mongoUpdateObject: any = {
    $set: {
      givenName: updateDataWithExistingFields.givenName,
      surname: updateDataWithExistingFields.surname,
      phone: updateDataWithExistingFields.phone,
      email: updateDataWithExistingFields.email,
      address: updateDataWithExistingFields.address,
      notes: updateDataWithExistingFields.notes,
      visaType: updateDataWithExistingFields.visaType,
      generalDocuments: updateDataWithExistingFields.generalDocuments || {},
    },
    $unset: {} as Record<string, 1>
  };

  // Set the active document type and unset others based on visa type
  switch (updateDataWithExistingFields.visaType) {
    case 'student':
      mongoUpdateObject.$set.studentDocuments = updateDataWithExistingFields.studentDocuments || {};
      mongoUpdateObject.$unset.jobHolderDocuments = 1;
      mongoUpdateObject.$unset.businessDocuments = 1;
      mongoUpdateObject.$unset.otherDocuments = 1;
      break;
    case 'jobHolder':
      mongoUpdateObject.$set.jobHolderDocuments = updateDataWithExistingFields.jobHolderDocuments || {};
      mongoUpdateObject.$unset.studentDocuments = 1;
      mongoUpdateObject.$unset.businessDocuments = 1;
      mongoUpdateObject.$unset.otherDocuments = 1;
      break;
    case 'business':
      mongoUpdateObject.$set.businessDocuments = updateDataWithExistingFields.businessDocuments || {};
      mongoUpdateObject.$unset.studentDocuments = 1;
      mongoUpdateObject.$unset.jobHolderDocuments = 1;
      mongoUpdateObject.$unset.otherDocuments = 1;
      break;
    case 'other':
      mongoUpdateObject.$set.otherDocuments = updateDataWithExistingFields.otherDocuments || {};
      mongoUpdateObject.$unset.studentDocuments = 1;
      mongoUpdateObject.$unset.jobHolderDocuments = 1;
      mongoUpdateObject.$unset.businessDocuments = 1;
      break;
  }

  // Only include $unset if there are fields to unset
  if (Object.keys(mongoUpdateObject.$unset).length === 0) {
    delete mongoUpdateObject.$unset;
  }

  // Update the visa application with explicit unset operations
  const result = await VisaModel.findByIdAndUpdate(
    id,
    mongoUpdateObject,
    { new: true }
  );

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Failed to update visa application');
  }

  return result;
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

    if (!subTraveler) {
      throw new AppError(httpStatus.NOT_FOUND, "Sub-traveler not found");
    }

    // Create update data object with existing fields
    const updateDataWithExistingFields: Partial<IVisaForm> = {
      givenName: subTraveler.givenName,
      surname: subTraveler.surname,
      phone: subTraveler.phone,
      email: subTraveler.email,
      address: subTraveler.address,
      notes: subTraveler.notes,
      visaType: updateData.visaType,
      generalDocuments: {
        passportCopy: subTraveler.generalDocuments?.passportCopy || {} as IFile,
        passportPhoto: subTraveler.generalDocuments?.passportPhoto || {} as IFile,
        bankStatement: subTraveler.generalDocuments?.bankStatement || {} as IFile,
        bankSolvency: subTraveler.generalDocuments?.bankSolvency || {} as IFile,
        visitingCard: subTraveler.generalDocuments?.visitingCard || {} as IFile,
        hotelBooking: subTraveler.generalDocuments?.hotelBooking || {} as IFile,
        airTicket: subTraveler.generalDocuments?.airTicket || {} as IFile,
      } as IGeneralDocuments
    };

    // Initialize new document type object based on new visa type
    // Only change document types if visa type has changed
    if (updateData.visaType && updateData.visaType !== subTraveler.visaType) {
      switch (updateData.visaType) {
        case 'student':
          updateDataWithExistingFields.studentDocuments = {} as IStudentDocuments;
          updateDataWithExistingFields.jobHolderDocuments = undefined;
          updateDataWithExistingFields.businessDocuments = undefined;
          updateDataWithExistingFields.otherDocuments = undefined;
          break;
        case 'jobHolder':
          updateDataWithExistingFields.studentDocuments = undefined;
          updateDataWithExistingFields.jobHolderDocuments = {} as IJobHolderDocuments;
          updateDataWithExistingFields.businessDocuments = undefined;
          updateDataWithExistingFields.otherDocuments = undefined;
          break;
        case 'business':
          updateDataWithExistingFields.studentDocuments = undefined;
          updateDataWithExistingFields.jobHolderDocuments = undefined;
          updateDataWithExistingFields.businessDocuments = {} as IBusinessDocuments;
          updateDataWithExistingFields.otherDocuments = undefined;
          break;
        case 'other':
          updateDataWithExistingFields.studentDocuments = undefined;
          updateDataWithExistingFields.jobHolderDocuments = undefined;
          updateDataWithExistingFields.businessDocuments = undefined;
          updateDataWithExistingFields.otherDocuments = {} as IOtherDocuments;
          break;
      }
    } else {
      // Keep existing document data if visa type hasn't changed
      updateDataWithExistingFields.studentDocuments = subTraveler.studentDocuments;
      updateDataWithExistingFields.jobHolderDocuments = subTraveler.jobHolderDocuments;
      updateDataWithExistingFields.businessDocuments = subTraveler.businessDocuments;
      updateDataWithExistingFields.otherDocuments = subTraveler.otherDocuments;
    }

    // Then handle file uploads if any
    if (processedFiles && Object.keys(processedFiles).length > 0) {
      // Delete existing files that are being replaced
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for (const [key, _] of Object.entries(processedFiles)) {
        const documentKey = key.replace(/^subTraveler(?:\d+)?_/, '');

        // Find the existing file in the appropriate document section
        let existingFile: IFile | undefined;

        // Check in general documents
        if (documentKey in (subTraveler.generalDocuments || {})) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          existingFile = (subTraveler.generalDocuments as any)[documentKey];
        }
        // Check in visa type specific documents
        else {
          const documentType = `${subTraveler.visaType}Documents` as keyof IVisaForm;
          const documents = subTraveler[documentType];
          if (documents && typeof documents === 'object' && documentKey in documents) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            existingFile = (documents as any)[documentKey];
          }
        }

        // Delete the existing file if found
        if (existingFile?.id) {
          try {
            await cloudinaryDestroyOneByOne(existingFile.id);
            console.log(`Successfully deleted old file: ${existingFile.id}`);
          } catch (error) {
            console.error(`Error deleting old file: ${existingFile.id}`, error);
          }
        }
      }

      // Handle visa type change file cleanup
      let oldVisaTypeDoc;
      if (updateData.visaType && updateData.visaType !== subTraveler.visaType) {
        switch (subTraveler.visaType) {
          case 'student':
            oldVisaTypeDoc = subTraveler.studentDocuments;
            break;
          case 'jobHolder':
            oldVisaTypeDoc = subTraveler.jobHolderDocuments;
            break;
          case 'business':
            oldVisaTypeDoc = subTraveler.businessDocuments;
            break;
          case 'other':
            oldVisaTypeDoc = subTraveler.otherDocuments;
            break;
        }

        if (oldVisaTypeDoc) {
          const oldVisaTypeDocPlain = oldVisaTypeDoc;
          for (const [key, value] of Object.entries(oldVisaTypeDocPlain)) {
            if (key !== '_id') {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              await cloudinaryDestroyOneByOne((value as any).id);
            }
          }
        }
      }

      const newUploadedFiles = await processAndUploadFiles(processedFiles, visaApplication.email);

      // Process uploaded files based on current visa type
      for (const [key, value] of Object.entries(newUploadedFiles)) {
        const documentKey = key.replace(/^subTraveler(?:\d+)?_/, '');
        updateDocumentField(documentKey, value, updateDataWithExistingFields, subTraveler);
      }
    }

    // Create MongoDB update object with explicit unset operations
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mongoUpdateObject: any = {
      $set: {
        'subTravelers.$.givenName': updateDataWithExistingFields.givenName,
        'subTravelers.$.surname': updateDataWithExistingFields.surname,
        'subTravelers.$.phone': updateDataWithExistingFields.phone,
        'subTravelers.$.email': updateDataWithExistingFields.email,
        'subTravelers.$.address': updateDataWithExistingFields.address,
        'subTravelers.$.notes': updateDataWithExistingFields.notes,
        'subTravelers.$.visaType': updateDataWithExistingFields.visaType,
        'subTravelers.$.generalDocuments': updateDataWithExistingFields.generalDocuments || {},
      },
      $unset: {} as Record<string, 1>
    };

    // Set the active document type and unset others based on visa type
    switch (updateDataWithExistingFields.visaType) {
      case 'student':
        mongoUpdateObject.$set['subTravelers.$.studentDocuments'] = updateDataWithExistingFields.studentDocuments || {};
        mongoUpdateObject.$unset['subTravelers.$.jobHolderDocuments'] = 1;
        mongoUpdateObject.$unset['subTravelers.$.businessDocuments'] = 1;
        mongoUpdateObject.$unset['subTravelers.$.otherDocuments'] = 1;
        break;
      case 'jobHolder':
        mongoUpdateObject.$set['subTravelers.$.jobHolderDocuments'] = updateDataWithExistingFields.jobHolderDocuments || {};
        mongoUpdateObject.$unset['subTravelers.$.studentDocuments'] = 1;
        mongoUpdateObject.$unset['subTravelers.$.businessDocuments'] = 1;
        mongoUpdateObject.$unset['subTravelers.$.otherDocuments'] = 1;
        break;
      case 'business':
        mongoUpdateObject.$set['subTravelers.$.businessDocuments'] = updateDataWithExistingFields.businessDocuments || {};
        mongoUpdateObject.$unset['subTravelers.$.studentDocuments'] = 1;
        mongoUpdateObject.$unset['subTravelers.$.jobHolderDocuments'] = 1;
        mongoUpdateObject.$unset['subTravelers.$.otherDocuments'] = 1;
        break;
      case 'other':
        mongoUpdateObject.$set['subTravelers.$.otherDocuments'] = updateDataWithExistingFields.otherDocuments || {};
        mongoUpdateObject.$unset['subTravelers.$.studentDocuments'] = 1;
        mongoUpdateObject.$unset['subTravelers.$.jobHolderDocuments'] = 1;
        mongoUpdateObject.$unset['subTravelers.$.businessDocuments'] = 1;
        break;
    }

    // Only include $unset if there are fields to unset
    if (Object.keys(mongoUpdateObject.$unset).length === 0) {
      delete mongoUpdateObject.$unset;
    }

    // Update the sub-traveler with explicit unset operations
    const result = await VisaModel.findOneAndUpdate(
      { _id: visaApplication._id, 'subTravelers._id': subTraveler._id },
      mongoUpdateObject,
      { new: true }
    );

    if (!result) {
      throw new AppError(httpStatus.NOT_FOUND, 'Failed to update sub-traveler');
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


const getSubTravelerById = async (visaId: string, subTravelerId: string) => {
  try {
    const result = await VisaModel.findOne(
      { _id: visaId, 'subTravelers._id': subTravelerId },
      {
        'subTravelers.$': 1
      }
    );
    if (!result) {
      throw new AppError(httpStatus.NOT_FOUND, "Sub-traveler not found");
    }
    return result.subTravelers![0];
  } catch (error) {
    console.error("Error getting sub-traveler:", error);
    throw new AppError(
      httpStatus.BAD_REQUEST,
      error instanceof AppError ? error.message : "Failed to get sub-traveler"
    );
  }
}



/**
 * Updates a primary traveler in a visa application. Handles
 * updating the primary traveler's documents and visa type, as well as
 * adding or updating sub-travelers and their documents and visa types.
 *
 * @param {string} visaId - The ID of the visa application
 * @param {Partial<IVisaForm>} updateData - The updated data for the primary traveler                                  
 * @param {Partial<IVisaForm>[]} newTraveler - The new sub-travelers to add
 * @param {ProcessedFiles} [processedFiles] - The files that have been uploaded and processed                
 * @returns {Promise<IVisaForm | null>} - The updated visa application
 */
const updatePrimaryTraveler = async (
  visaId: string,
  updateData: Partial<IVisaForm>,
  newTraveler: Partial<IVisaForm>[],
  processedFiles?: ProcessedFiles
): Promise<IVisaForm | null> => {
  // Find the visa application
  const visaApplication = await VisaModel.findById(visaId);
  if (!visaApplication) {
    throw new AppError(httpStatus.NOT_FOUND, 'Visa application not found');
  }

  // Create a deep copy of the update data to avoid modifying the original
  const finalUpdateData = {
    ...updateData,
    generalDocuments: updateData.generalDocuments || { ...visaApplication.generalDocuments?.toObject() },
    subTravelers: updateData.subTravelers || (visaApplication.subTravelers ? [...visaApplication.subTravelers] : [])
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const newSubTravelerArray: any[] = []
  const processedSubTravelerIds = new Set<string>();

  // Handle file updates if any
  if (processedFiles && Object.keys(processedFiles).length > 0) {
    // Upload all files once and store results
    const newUploadedFiles = await processAndUploadFiles(processedFiles, visaApplication.email);
    // console.log("newUploadedFiles", newUploadedFiles);
    let oldVisaTypeDoc;
    let oldSubTravelerVisaTypeDoc;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const [key, _] of Object.entries(processedFiles)) {
      if (key.includes('primaryTraveler_')) {
        const documentKey = key.replace(/^primaryTraveler_/, '');

        // Find the existing file in the appropriate document section
        let existingFile: IFile | undefined;

        
        if (documentKey in (visaApplication.generalDocuments || {})) {
          existingFile = (visaApplication.generalDocuments as never)[documentKey];
        } else if (documentKey in (visaApplication.studentDocuments || {})) {
          existingFile = (visaApplication.studentDocuments as never)[documentKey];
        } else if (documentKey in (visaApplication.jobHolderDocuments || {})) {
          existingFile = (visaApplication.jobHolderDocuments as never)[documentKey];
        } else if (documentKey in (visaApplication.businessDocuments || {})) {
          existingFile = (visaApplication.businessDocuments as never)[documentKey];
        } else if (documentKey in (visaApplication.otherDocuments || {})) {
          existingFile = (visaApplication.otherDocuments as never)[documentKey];
        }

        // Delete the existing file from Cloudinary if it exists
        if (existingFile?.id) {
          try {
            await cloudinaryDestroyOneByOne(existingFile.id);
            console.log("main traveler file deleted")
          } catch (error) {
            console.error(`Failed to delete file ${existingFile.id} from Cloudinary:`, error);
          }
        }

        if (updateData.visaType) {
          if (updateData.visaType !== visaApplication.visaType) {
            switch (visaApplication.visaType) {
              case 'student':
                oldVisaTypeDoc = visaApplication.studentDocuments;
                break;
              case 'jobHolder':
                oldVisaTypeDoc = visaApplication.jobHolderDocuments;
                break;
              case 'business':
                oldVisaTypeDoc = visaApplication.businessDocuments;
                break;
              case 'other':
                oldVisaTypeDoc = visaApplication.otherDocuments;
                break;
            }
          }
        }
      
        // Update document data based on new visa type
        if (updateData.visaType && updateData.visaType !== visaApplication.visaType) {
          switch (updateData.visaType) {
            case 'student':
              finalUpdateData.studentDocuments = finalUpdateData.studentDocuments || {} as IStudentDocuments;
              finalUpdateData.jobHolderDocuments = undefined;
              finalUpdateData.businessDocuments = undefined;
              finalUpdateData.otherDocuments = undefined;
              break;
            case 'jobHolder':
              finalUpdateData.studentDocuments = undefined;
              finalUpdateData.jobHolderDocuments = finalUpdateData.jobHolderDocuments || {} as IJobHolderDocuments;
              finalUpdateData.businessDocuments = undefined;
              finalUpdateData.otherDocuments = undefined;
              break;
            case 'business':
              finalUpdateData.studentDocuments = undefined;
              finalUpdateData.jobHolderDocuments = undefined;
              finalUpdateData.businessDocuments = finalUpdateData.businessDocuments || {} as IBusinessDocuments;
              finalUpdateData.otherDocuments = undefined;
              break;
            case 'other':
              finalUpdateData.studentDocuments = undefined;
              finalUpdateData.jobHolderDocuments = undefined;
              finalUpdateData.businessDocuments = undefined;
              finalUpdateData.otherDocuments = finalUpdateData.otherDocuments || {} as IOtherDocuments;
              break;
          }
        } else {
          // Keep existing document data if visa type hasn't changed
          finalUpdateData.studentDocuments = visaApplication.studentDocuments? visaApplication.studentDocuments : undefined;
          finalUpdateData.jobHolderDocuments = visaApplication.jobHolderDocuments? visaApplication.jobHolderDocuments : undefined;
          finalUpdateData.businessDocuments = visaApplication.businessDocuments? visaApplication.businessDocuments : undefined;
          finalUpdateData.otherDocuments = visaApplication.otherDocuments? visaApplication.otherDocuments : undefined;
        }

        // Process uploaded files based on current visa type
        const value = newUploadedFiles[key];
        if (value) {
          updateDocumentField(documentKey, value, finalUpdateData, visaApplication);
        }
      }
      else if(key.includes('subTraveler_new')){
        const parts = key.split('_');
        const subTravelerId = parts[1];
        const lastDocKey = parts.slice(2).join('_');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newSubTraveler = newTraveler?.find((subTraveler: any) => subTraveler.id.toString() === subTravelerId);

        const value = newUploadedFiles[key];
        if (value) {
          updateDocumentField(lastDocKey, value, newSubTraveler as Partial<IVisaForm>, newSubTraveler as IVisaForm);
        }

        if (newSubTraveler && !processedSubTravelerIds.has(subTravelerId)) {
          processedSubTravelerIds.add(subTravelerId);
          
          switch (newSubTraveler.visaType) {
            case 'student':
              newSubTraveler.studentDocuments = newSubTraveler.studentDocuments || {} as IStudentDocuments;
              newSubTraveler.jobHolderDocuments = undefined;
              newSubTraveler.businessDocuments = undefined;
              newSubTraveler.otherDocuments = undefined;
              break;
            case 'jobHolder':
              newSubTraveler.studentDocuments = undefined;
              newSubTraveler.jobHolderDocuments = newSubTraveler.jobHolderDocuments || {} as IJobHolderDocuments;
              newSubTraveler.businessDocuments = undefined;
              newSubTraveler.otherDocuments = undefined;
              break;
            case 'business':
              newSubTraveler.studentDocuments = undefined;
              newSubTraveler.jobHolderDocuments = undefined;
              newSubTraveler.businessDocuments = newSubTraveler.businessDocuments || {} as IBusinessDocuments;
              newSubTraveler.otherDocuments = undefined;
              break;
            case 'other':
              newSubTraveler.studentDocuments = undefined;
              newSubTraveler.jobHolderDocuments = undefined;
              newSubTraveler.businessDocuments = undefined;
              newSubTraveler.otherDocuments = newSubTraveler.otherDocuments || {} as IOtherDocuments;
              break;
          }

          // Create a copy without the ID before pushing
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, ...newSubTravelerWithoutId } = newSubTraveler;
          newSubTravelerArray.push(newSubTravelerWithoutId);
        }
      }
      else if (key.includes('subTraveler_')) {
        const parts = key.split('_');
        const subTravelerId = parts[1];
        const lastDocKey = parts.slice(2).join('_');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subTraveler = visaApplication.subTravelers?.find((subTraveler: any) => subTraveler._id.toString() === subTravelerId);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updatedSubTraveler = finalUpdateData.subTravelers?.find((subTraveler: any) => subTraveler._id.toString() === subTravelerId);

        if (!subTraveler && !updatedSubTraveler) {
          throw new AppError(httpStatus.NOT_FOUND, 'Sub-traveler not found');
        }

        const existingSubTraveler = {
          ...updatedSubTraveler,
          generalDocuments: updatedSubTraveler?.generalDocuments || { ...subTraveler?.generalDocuments },
        }

        if (existingSubTraveler.visaType) {
          if (existingSubTraveler.visaType !== subTraveler!.visaType) {
            switch (subTraveler!.visaType) {
              case 'student':
                oldSubTravelerVisaTypeDoc = subTraveler!.studentDocuments;
                break;
              case 'jobHolder':
                oldSubTravelerVisaTypeDoc = subTraveler!.jobHolderDocuments;
                break;
              case 'business':
                oldSubTravelerVisaTypeDoc = subTraveler!.businessDocuments;
                break;
              case 'other':
                oldSubTravelerVisaTypeDoc = subTraveler!.otherDocuments;
                break;
            }
          }
        }
      
        if (existingSubTraveler!.visaType && existingSubTraveler!.visaType !== subTraveler!.visaType) {
          switch (updatedSubTraveler!.visaType) {
            case 'student':
              existingSubTraveler!.studentDocuments = existingSubTraveler!.studentDocuments || {} as IStudentDocuments;
              existingSubTraveler!.jobHolderDocuments = undefined;
              existingSubTraveler!.businessDocuments = undefined;
              existingSubTraveler!.otherDocuments = undefined;
              break;
            case 'jobHolder':
              existingSubTraveler!.studentDocuments = undefined;
              existingSubTraveler!.jobHolderDocuments = existingSubTraveler!.jobHolderDocuments || {} as IJobHolderDocuments;
              existingSubTraveler!.businessDocuments = undefined;
              existingSubTraveler!.otherDocuments = undefined;
              break;
            case 'business':
              existingSubTraveler!.studentDocuments = undefined;
              existingSubTraveler!.jobHolderDocuments = undefined;
              existingSubTraveler!.businessDocuments = existingSubTraveler!.businessDocuments || {} as IBusinessDocuments;
              existingSubTraveler!.otherDocuments = undefined;
              break;
            case 'other':
              existingSubTraveler!.studentDocuments = undefined;
              existingSubTraveler!.jobHolderDocuments = undefined;
              existingSubTraveler!.businessDocuments = undefined;
              existingSubTraveler!.otherDocuments = existingSubTraveler!.otherDocuments || {} as IOtherDocuments;
              break;
          }
        } else {
          // Keep existing document data if visa type hasn't changed
          existingSubTraveler!.studentDocuments = visaApplication.studentDocuments?  visaApplication.studentDocuments : undefined;
          existingSubTraveler!.jobHolderDocuments = visaApplication.jobHolderDocuments? visaApplication.jobHolderDocuments : undefined;
          existingSubTraveler!.businessDocuments = visaApplication.businessDocuments? visaApplication.businessDocuments : undefined;
          existingSubTraveler!.otherDocuments = visaApplication.otherDocuments? visaApplication.otherDocuments : undefined;
        }

        let existingFile: IFile | undefined;

        if (lastDocKey in (existingSubTraveler!.generalDocuments || {})) {
          existingFile = (existingSubTraveler!.generalDocuments as never)[lastDocKey];
        } else if (lastDocKey in (existingSubTraveler!.studentDocuments || {})) {
          existingFile = (existingSubTraveler!.studentDocuments as never)[lastDocKey];
        } else if (lastDocKey in (existingSubTraveler!.jobHolderDocuments || {})) {
          existingFile = (existingSubTraveler!.jobHolderDocuments as never)[lastDocKey];
        } else if (lastDocKey in (existingSubTraveler!.businessDocuments || {})) {
          existingFile = (existingSubTraveler!.businessDocuments as never)[lastDocKey];
        } else if (lastDocKey in (existingSubTraveler!.otherDocuments || {})) {
          existingFile = (existingSubTraveler!.otherDocuments as never)[lastDocKey];
        }
        // Delete the existing file from Cloudinary if it exists
        if (existingFile?.id) {
          try {
            await cloudinaryDestroyOneByOne(existingFile.id);
            console.log("sub traveler file deleted")
          } catch (error) {
            console.error(`Failed to delete file ${existingFile.id} from Cloudinary:`, error);
          }
        }
        // Use the already uploaded file
        const value = newUploadedFiles[key];
        if (value) {
          updateDocumentField(lastDocKey, value, existingSubTraveler, existingSubTraveler as IVisaForm);
        }

        // Update the sub-traveler in the finalUpdateData
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (finalUpdateData.subTravelers as any) = finalUpdateData.subTravelers.map((st: IVisaForm) =>
          st._id === subTravelerId ? existingSubTraveler : st
        );
      }
    }

    if (oldVisaTypeDoc) {
      const oldVisaTypeDocPlain = oldVisaTypeDoc.toObject();
      for (const [key, value] of Object.entries(oldVisaTypeDocPlain)) {
  
        if (key !== '_id') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await cloudinaryDestroyOneByOne((value as any).id)
        }
      }
    }

    if (oldSubTravelerVisaTypeDoc) {
      for (const [key, value] of Object.entries(oldSubTravelerVisaTypeDoc)) {
  
        if (key !== '_id') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await cloudinaryDestroyOneByOne((value as any).id)
        }
      }
    }
  }

  // Update finalUpdateData with newSubTravelerArray only once, after the loop
  if (newSubTravelerArray.length > 0) {
    // Get existing sub-travelers that are not being updated
    const existingSubTravelers = finalUpdateData.subTravelers.filter(
      (traveler) => !processedSubTravelerIds.has(traveler.id?.toString() || '')
    );
  
    // Combine existing and new sub-travelers
    finalUpdateData.subTravelers = [...existingSubTravelers, ...newSubTravelerArray];
  }
  const result = await VisaModel.findOneAndReplace({_id: visaId}, finalUpdateData, {
    new: true
  });

  return result;
};

export const VisaServices = {
  createVisaApplication,
  getVisaApplications,
  getVisaApplicationById,
  deleteVisaApplication,
  updateVisaApplication,
  deleteSubTraveler,
  updateSubTraveler,
  getSubTravelerById,
  updatePrimaryTraveler
};
