import httpStatus from "http-status";
import AppError from "../../errors/AppError";
// import { cloudinaryDestroy, deleteFolderWithFiles } from "../../utils/cloudinaryDelete";
import VisaModel from "./visa.model";
import { ProcessedFiles } from "../../interfaces/fileUpload";
import { extractDocuments, prepareVisaApplicationData, processAndUploadFiles, updateDocumentField } from "./visa.utils";
import { 
  IFile,
  IGeneralDocuments,
  IJobHolderDocuments,
  IOtherDocuments,
  IStudentDocuments,
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

  // Initialize update data with existing fields
  let updateDataWithExistingFields = {
    givenName: updateData.givenName || visaApplication.givenName,
    surname: updateData.surname || visaApplication.surname,
    phone: updateData.phone || visaApplication.phone,
    email: updateData.email || visaApplication.email,
    address: updateData.address || visaApplication.address,
    notes: updateData.notes || visaApplication.notes,
    visaType: updateData.visaType || visaApplication.visaType,
    // Initialize all documents as undefined
    generalDocuments: undefined,
    studentDocuments: undefined,
    jobHolderDocuments: undefined,
    businessDocuments: undefined,
    otherDocuments: undefined
  };

  // First, handle visa type change if needed
  if (updateData.visaType && updateData.visaType !== visaApplication.visaType) {
    console.log('Visa type changed from', visaApplication.visaType, 'to', updateData.visaType);
    
    // Function to safely delete documents and log results
    const deleteDocuments = async (documents: Record<string, IFile> | undefined, type: string) => {
      if (documents) {
        console.log(`Deleting ${type} documents:`, documents);
        for (const [key, file] of Object.entries(documents)) {
          if (file?.id) {
            try {
              console.log(`Attempting to delete ${type} document: ${key} with ID: ${file.id}`);
              const result = await cloudinaryDestroyOneByOne(file.id);
              console.log(`Delete result for ${key}:`, result);
            } catch (error) {
              console.error(`Error deleting ${type} document ${key}:`, error);
            }
          }
        }
      }
    };

    // Delete ALL type-specific documents
    await Promise.all([
      deleteDocuments(visaApplication.studentDocuments, 'student'),
      deleteDocuments(visaApplication.jobHolderDocuments, 'jobHolder'),
      deleteDocuments(visaApplication.businessDocuments, 'business'),
      deleteDocuments(visaApplication.otherDocuments, 'other')
    ]);

    // Copy only general documents
    updateDataWithExistingFields.generalDocuments = visaApplication.generalDocuments ? { ...visaApplication.generalDocuments } : {};

    // Initialize new document type object based on new visa type
    switch (updateData.visaType) {
      case 'student':
        updateDataWithExistingFields.studentDocuments = {};
        break;
      case 'jobHolder':
        updateDataWithExistingFields.jobHolderDocuments = {};
        break;
      case 'business':
        updateDataWithExistingFields.businessDocuments = {};
        break;
      case 'other':
        updateDataWithExistingFields.otherDocuments = {};
        break;
    }
  } else {
    // If visa type hasn't changed, copy existing documents
    updateDataWithExistingFields.generalDocuments = visaApplication.generalDocuments ? { ...visaApplication.generalDocuments } : {};
    
    // Only copy documents for current visa type
    switch (updateDataWithExistingFields.visaType) {
      case 'student':
        updateDataWithExistingFields.studentDocuments = visaApplication.studentDocuments ? { ...visaApplication.studentDocuments } : {};
        break;
      case 'jobHolder':
        updateDataWithExistingFields.jobHolderDocuments = visaApplication.jobHolderDocuments ? { ...visaApplication.jobHolderDocuments } : {};
        break;
      case 'business':
        updateDataWithExistingFields.businessDocuments = visaApplication.businessDocuments ? { ...visaApplication.businessDocuments } : {};
        break;
      case 'other':
        updateDataWithExistingFields.otherDocuments = visaApplication.otherDocuments ? { ...visaApplication.otherDocuments } : {};
        break;
    }
  }

  // Then handle file uploads if any
  if (processedFiles && Object.keys(processedFiles).length > 0) {
    const newUploadedFiles = await processAndUploadFiles(processedFiles, visaApplication.email);
    
    // Process uploaded files based on current visa type
    for (const [key, value] of Object.entries(newUploadedFiles)) {
      const documentKey = key.replace(/^primaryTraveler_/, '');
      updateDocumentField(documentKey, value, updateDataWithExistingFields, visaApplication);
    }
  }

  // Create MongoDB update object with explicit unset operations
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

  console.log('MongoDB update object:', JSON.stringify(mongoUpdateObject, null, 2));

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


    console.log(subTraveler);
    console.log(processedFiles)

    if (!subTraveler) {
      throw new AppError(httpStatus.NOT_FOUND, "Sub-traveler not found");
    }

    // Initialize update data with existing fields
    let updateDataWithExistingFields = {
      givenName: updateData.givenName || subTraveler.givenName,
      surname: updateData.surname || subTraveler.surname,
      phone: updateData.phone || subTraveler.phone,
      email: updateData.email || subTraveler.email,
      address: updateData.address || subTraveler.address,
      notes: updateData.notes || subTraveler.notes,
      visaType: updateData.visaType || subTraveler.visaType,
      // Initialize all documents as undefined
      generalDocuments: undefined,
      studentDocuments: undefined,
      jobHolderDocuments: undefined,
      businessDocuments: undefined,
      otherDocuments: undefined
    };

    // First, handle visa type change if needed
    if (updateData.visaType && updateData.visaType !== subTraveler.visaType) {
      console.log('Visa type changed from', subTraveler.visaType, 'to', updateData.visaType);
      
      // Function to safely delete documents and log results
      const deleteDocuments = async (documents: Record<string, IFile> | undefined, type: string) => {
        if (documents) {
          console.log(`Deleting ${type} documents:`, documents);
          for (const [key, file] of Object.entries(documents)) {
            if (file?.id) {
              try {
                console.log(`Attempting to delete ${type} document: ${key} with ID: ${file.id}`);
                const result = await cloudinaryDestroyOneByOne(file.id);
                console.log(`Delete result for ${key}:`, result);
              } catch (error) {
                console.error(`Error deleting ${type} document ${key}:`, error);
              }
            }
          }
        }
      };

      // Delete ALL type-specific documents
      await Promise.all([
        deleteDocuments(subTraveler.studentDocuments, 'student'),
        deleteDocuments(subTraveler.jobHolderDocuments, 'jobHolder'),
        deleteDocuments(subTraveler.businessDocuments, 'business'),
        deleteDocuments(subTraveler.otherDocuments, 'other')
      ]);

      // Copy only general documents
      updateDataWithExistingFields.generalDocuments = subTraveler.generalDocuments ? { ...subTraveler.generalDocuments } : {};

      // Initialize new document type object based on new visa type
      switch (updateData.visaType) {
        case 'student':
          updateDataWithExistingFields.studentDocuments = {};
          break;
        case 'jobHolder':
          updateDataWithExistingFields.jobHolderDocuments = {};
          break;
        case 'business':
          updateDataWithExistingFields.businessDocuments = {};
          break;
        case 'other':
          updateDataWithExistingFields.otherDocuments = {};
          break;
      }
    } else {
      // If visa type hasn't changed, copy existing documents
      updateDataWithExistingFields.generalDocuments = subTraveler.generalDocuments ? { ...subTraveler.generalDocuments } : {};
      
      // Only copy documents for current visa type
      switch (updateDataWithExistingFields.visaType) {
        case 'student':
          updateDataWithExistingFields.studentDocuments = subTraveler.studentDocuments ? { ...subTraveler.studentDocuments } : {};
          break;
        case 'jobHolder':
          updateDataWithExistingFields.jobHolderDocuments = subTraveler.jobHolderDocuments ? { ...subTraveler.jobHolderDocuments } : {};
          break;
        case 'business':
          updateDataWithExistingFields.businessDocuments = subTraveler.businessDocuments ? { ...subTraveler.businessDocuments } : {};
          break;
        case 'other':
          updateDataWithExistingFields.otherDocuments = subTraveler.otherDocuments ? { ...subTraveler.otherDocuments } : {};
          break;
      }
    }

    // Then handle file uploads if any
    if (processedFiles && Object.keys(processedFiles).length > 0) {
      const newUploadedFiles = await processAndUploadFiles(processedFiles, visaApplication.email);
      
      // Process uploaded files based on current visa type
      for (const [key, value] of Object.entries(newUploadedFiles)) {
        const documentKey = key.replace(/^subTraveler(?:\d+)?_/, '');
        updateDocumentField(documentKey, value, updateDataWithExistingFields, subTraveler);
      }
    }

    // Create MongoDB update object with explicit unset operations
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

    console.log('MongoDB update object:', JSON.stringify(mongoUpdateObject, null, 2));

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

export const VisaServices = {
  createVisaApplication,
  getVisaApplications,
  getVisaApplicationById,
  deleteVisaApplication,
  updateVisaApplication,
  deleteSubTraveler,
  updateSubTraveler,
  getSubTravelerById,
};
