// Helper function to process document files

import AppError from "../../errors/AppError";
import { ProcessedFiles } from "../../interfaces/fileUpload";
import { cloudinaryUpload } from "../../utils/cloudinaryUpload";
import { IFile, IVisaForm } from "./visa.interface";
import httpStatus from "http-status";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const processDocumentFile = (traveler: any, documentKey: string, value: IFile, visaType: string) => {
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


 export const processAndUploadFiles = async (processedFiles: ProcessedFiles, email: string) => {
    const uploadedFiles: { [key: string]: IFile } = {};
  
    for (const [fieldname, fieldFiles] of Object.entries(processedFiles)) {
      if (fieldFiles && fieldFiles.length > 0) {
        const file = fieldFiles[0];
        try {
          const uploadedFile = await cloudinaryUpload(file.filename, file.path, email);
          if (uploadedFile && typeof uploadedFile === 'object' && 'secure_url' in uploadedFile && 'public_id' in uploadedFile) {
            uploadedFiles[fieldname] = {
              url: String(uploadedFile.secure_url),
              id: String(uploadedFile.public_id)
            };
          }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
          throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, `Failed to upload ${fieldname}`);
        }
      }
    }
    return uploadedFiles;
  };


  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const prepareVisaApplicationData = (visaData: any, uploadedFiles: { [key: string]: IFile }) => {
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
  
    // Process sub-travelers' files
    if (visaApplicationData.subTravelers) {
      Object.entries(uploadedFiles).forEach(([key, value]) => {
        const subTravelerMatch = key.match(/^subTraveler(\d+)?_(.+)$/)
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
  
    return visaApplicationData;
  };
  
      // Helper function to extract documents from a source object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
export const extractDocuments = (source: Record<string, any>) => {
      return Object.entries(source || {}).reduce((acc, [key, value]) => {
        if (key !== "_id" && value?.url && value?.id) {
          acc.push({ documentType: key, url: value.url, id: value.id });
        }
        return acc;
      }, [] as { documentType: string; url: string; id: string }[]);
    };


/**
 * Helper function to update document fields based on document type and visa category
 * @param documentKey - The key/name of the document (e.g., 'passportCopy', 'studentId')
 * @param value - The file information including URL and ID
 * @param targetData - The object where the document should be stored
 * @param existingData - The existing visa application data for reference
 */
export const updateDocumentField = (
  documentKey: string,
  value: IFile,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  targetData: Record<string, any>,
  existingData: Partial<IVisaForm>
) => {
  if (documentKey.match(/^(passportCopy|passportPhoto|bankStatement|bankSolvency|visitingCard|hotelBooking|airTicket)$/)) {
    if (!targetData.generalDocuments) {
      targetData.generalDocuments = {};
    }
    targetData.generalDocuments[documentKey] = value;
  } 
  else if (existingData.visaType === 'business' && 
           documentKey.match(/^(tradeLicense|notarizedId|memorandum|officePad)$/)) {
    if (!targetData.businessDocuments) {
      targetData.businessDocuments = {};
    }
    targetData.businessDocuments[documentKey] = value;
  } 
  else if (existingData.visaType === 'student' && 
           documentKey.match(/^(studentId|travelLetter|birthCertificate)$/)) {
    if (!targetData.studentDocuments) {
      targetData.studentDocuments = {};
    }
    targetData.studentDocuments[documentKey] = value;
  } 
  else if (existingData.visaType === 'jobHolder' && 
           documentKey.match(/^(nocCertificate|officialId|bmdcCertificate|barCouncilCertificate|retirementCertificate)$/)) {
    if (!targetData.jobHolderDocuments) {
      targetData.jobHolderDocuments = {};
    }
    targetData.jobHolderDocuments[documentKey] = value;
  } 
  else if (existingData.visaType === 'other' && documentKey === 'marriageCertificate') {
    if (!targetData.otherDocuments) {
      targetData.otherDocuments = {};
    }
    targetData.otherDocuments[documentKey] = value;
  }
};