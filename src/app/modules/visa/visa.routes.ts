import { NextFunction, Request, Response, Router } from "express";
import { VisaController } from "./visa.controllers";
import { handleMultipleFiles } from "../../utils/fileUpload";
import validateRequest from "../../middlewares/validateRequest";
import { visaValidationSchema } from "./visa.validation";
// import { visaValidationSchema } from "./visa.validation";

const router = Router();

const getUploadFields = () => {
  const fields = [];
  
  const documentTypes = [
    // General Documents
    'passportCopy', 'passportPhoto', 'bankStatement', 'bankSolvency', 
    'visitingCard', 'hotelBooking', 'airTicket',
    // Business Documents
    'tradeLicense', 'notarizedId', 'memorandum', 'officePad',
    // Student Documents
    'studentId', 'travelLetter', 'birthCertificate',
    // Job Holder Documents
    'nocCertificate', 'officialId', 'bmdcCertificate', 
    'barCouncilCertificate', 'retirementCertificate',
    // Other Documents
    'marriageCertificate'
  ];

  // Add primary traveler fields
  documentTypes.forEach(docType => {
    fields.push({ 
      name: `primaryTraveler_${docType}`, 
      maxCount: 1 
    });
  });

  // Add a single field for sub-travelers that matches any index
  fields.push({
    name: /^subTraveler\d+_.*$/,
    maxCount: 1
  });

  return fields;
};

// Create visa application route
router.post(
  "/create",
  handleMultipleFiles(getUploadFields()),
  (req: Request, res: Response, next: NextFunction) => {
    // console.log("Request Body:", req.body);
    try {
      if (typeof req.body.data === 'string') {
        req.body = JSON.parse(req.body.data);
      }
      next();
    } catch (error) {
      next(error);
    }
  },
  validateRequest(visaValidationSchema),
  VisaController.createVisaApplication
);

// Get all visa applications
router.get("/", VisaController.getVisaApplications);

// Get single visa application
router.get("/:id", VisaController.getVisaApplicationById);

// Delete visa application
router.delete("/:id", VisaController.deleteVisaApplication);

export const visaRoutes = router;
