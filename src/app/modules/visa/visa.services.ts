import httpStatus from "http-status";
import AppError from "../../errors/AppError";
// import { cloudinaryDestroy, deleteFolderWithFiles } from "../../utils/cloudinaryDelete";
import VisaModel from "./visa.model";
import { ProcessedFiles } from "../../interfaces/fileUpload";
import { extractDocuments, prepareVisaApplicationData, processAndUploadFiles } from "./visa.utils";
import { IVisaForm } from "./visa.interface";
import { v2 as cloudinary } from "cloudinary";
import configs from "../../configs";
import { cloudinaryDestroyOneByOne } from "../../utils/cloudinaryDelete";
cloudinary.config({
  cloud_name: configs.cloud_name,
  api_key: configs.cloud_api_key,
  api_secret: configs.cloud_api_secret,
});


// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createVisaApplication = async (visaData: IVisaForm, processedFiles: ProcessedFiles) => {
  if (!processedFiles || Object.keys(processedFiles).length === 0) {
    throw new AppError(httpStatus.BAD_REQUEST, 'No files were uploaded');
  }

  const uploadedFiles = await processAndUploadFiles(processedFiles, visaData.email);
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

// const deleteVisaApplication = async (id: string) => {
//   try {
//     const application = await VisaModel.findById(id);
//     if (!application) {
//       throw new AppError(httpStatus.NOT_FOUND, "Visa application not found");
//     }

//     const fileData: { documentType: string; url: string; id: string }[] = []
    
//     const generalDocs = application.toObject().generalDocuments;

//     Object.entries(generalDocs).forEach(([key, value]) => {
//       if(key !== '_id'){
//         fileData.push({
//           documentType: key,
//           url: value.url,
//           id: value.id
//         })
//       }
//      })

//     let businessDocs;
//     let studentDocs;
//     let jobHolderDocs;
//     let otherDocs;

//     if(application.businessDocuments){
//       businessDocs = application.toObject().businessDocuments;
//       // eslint-disable-next-line @typescript-eslint/no-explicit-any
//       Object.entries(businessDocs as Record<string, any>).forEach(([key, value]) => {
//         if(key !== '_id'){
//           fileData.push({
//             documentType: key,
//             url: value.url,
//             id: value.id
//           })
//         }
//       })
//     }

//     if(application.studentDocuments){
//       studentDocs = application.toObject().studentDocuments;
//       // eslint-disable-next-line @typescript-eslint/no-explicit-any
//       Object.entries(studentDocs as Record<string, any>).forEach(([key, value]) => {
//         if(key !== '_id'){
//           fileData.push({
//             documentType: key,
//             url: value.url,
//             id: value.id
//           })
//         }
//       })
//     }

//     if(application.jobHolderDocuments){
//       jobHolderDocs = application.toObject().jobHolderDocuments;
//       // eslint-disable-next-line @typescript-eslint/no-explicit-any
//       Object.entries(jobHolderDocs as Record<string, any>).forEach(([key, value]) => {
//         if(key !== '_id'){
//           fileData.push({
//             documentType: key,
//             url: value.url,
//             id: value.id
//           })
//         }
//       })
//     }

//     if(application.otherDocuments){
//       otherDocs = application.toObject().otherDocuments;
//       // eslint-disable-next-line @typescript-eslint/no-explicit-any
//       Object.entries(otherDocs as Record<string, any>).forEach(([key, value]) => {

//         if(key !== '_id'){
//           fileData.push({
//             documentType: key,
//             url: value.url,
//             id: value.id
//           })
//         }
//       })
//     }
  
//     application.subTravelers?.forEach((traveler)=>{
//       const generalDocs = traveler.generalDocuments;

//       Object.entries(generalDocs).forEach(([key, value]) => {
//         if(key !== '_id'){
//           fileData.push({
//             documentType: key,
//             url: value.url,
//             id: value.id
//           })
//         }
//        })
  
//       let businessDocs;
//       let studentDocs;
//       let jobHolderDocs;
//       let otherDocs;
  
//       if(traveler.businessDocuments){
//         businessDocs = traveler.businessDocuments;
//         Object.entries(businessDocs).forEach(([key, value]) => {
//           if(key !== '_id'){
//             fileData.push({
//               documentType: key,
//               url: value.url,
//               id: value.id
//             })
//           }
//         })
//       }
  
//       if(traveler.studentDocuments){
//         studentDocs = traveler.studentDocuments;
//         Object.entries(studentDocs).forEach(([key, value]) => {
//           if(key !== '_id'){
//             fileData.push({
//               documentType: key,
//               url: value.url,
//               id: value.id
//             })
//           }
//         })
//       }
  
//       if(traveler.jobHolderDocuments){
//         jobHolderDocs = traveler.jobHolderDocuments;
//         Object.entries(jobHolderDocs).forEach(([key, value]) => {
//           if(key !== '_id'){
//             fileData.push({
//               documentType: key,
//               url: value.url,
//               id: value.id
//             })
//           }
//         })
//       }
  
//       if(traveler.otherDocuments){
//         otherDocs = traveler.otherDocuments;
//         // console.log(otherDocs)
//         Object.entries(otherDocs).forEach(([key, value]) => {
  
//           if(key !== '_id'){
//             fileData.push({
//               documentType: key,
//               url: value.url,
//               id: value.id
//             })
//           }
//         })
//       }
      
//     })

//     fileData.forEach(async (file) => {
//       await cloudinaryDestroy(file.id);
//     })


//     // Delete the application from database
//     const result = await VisaModel.findByIdAndDelete(id);
//     return result;
//   } catch (error) {
//     console.error('Delete visa application error:', error);
//     throw new AppError(
//       httpStatus.BAD_REQUEST,
//       "Failed to delete visa application"
//     );
//   }
// };

const deleteVisaApplication = async (id: string) => {
  try {
    const application = await VisaModel.findById(id);
    if (!application) {
      throw new AppError(httpStatus.NOT_FOUND, "Visa application not found");
    }

    // Collect all document data
    const fileData: { documentType: string; url: string; id: string }[] = [];

    // Extract main application documents
    fileData.push(...extractDocuments(application.toObject().generalDocuments));
    fileData.push(...extractDocuments(application.toObject().businessDocuments || {}));
    fileData.push(...extractDocuments(application.toObject().studentDocuments || {}));
    fileData.push(...extractDocuments(application.toObject().jobHolderDocuments || {}));
    fileData.push(...extractDocuments(application.toObject().otherDocuments || {}));

    // Extract documents for sub-travelers
    application.subTravelers?.forEach((traveler) => {
      fileData.push(...extractDocuments(traveler.generalDocuments || {}));
      fileData.push(...extractDocuments(traveler.businessDocuments || {}));
      fileData.push(...extractDocuments(traveler.studentDocuments || {}));
      fileData.push(...extractDocuments(traveler.jobHolderDocuments || {}));
      fileData.push(...extractDocuments(traveler.otherDocuments || {}));
    });

    // Delete all files from Cloudinary
    await Promise.all(
      fileData.map(async (file) => {
        await cloudinaryDestroyOneByOne(file.id);
      })
    );

    // Delete the application from the database
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


export const VisaServices = {
  createVisaApplication,
  getVisaApplications,
  getVisaApplicationById,
  deleteVisaApplication,
};
