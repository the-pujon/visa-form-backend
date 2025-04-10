import { NextFunction, Request, Response, Router } from "express";
import { VisaController } from "./visa.controllers";
import { handleMultipleFiles } from "../../utils/fileUpload";
import validateRequest from "../../middlewares/validateRequest";
import { updateVisaValidationSchema, visaValidationSchema } from "./visa.validation";
import { IVisaForm } from "./visa.interface";
// import { visaValidationSchema } from "./visa.validation";

interface CustomRequest extends Request {
  newTraveler?: IVisaForm; // Change `any` to a specific type if possible
}

const router = Router();

const getUploadFields = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fields: any[] = [];

  const documentTypes = [
    // General Documents
    'passportCopy', 'passportPhoto', 'bankStatement', 'bankSolvency',
    'visitingCard', 'hotelBooking', 'airTicket','previousVisa',
    // Business Documents
    'tradeLicense', 'notarizedId', 'memorandum', 'officePad',
    // Student Documents
    'studentId', 'travelLetter', 'birthCertificate',
    // Job Holder Documents
    'nocCertificate', 'officialId', 'bmdcCertificate',
    'barCouncilCertificate', 'retirementCertificate',
    // Other Documents
    'marriageCertificate','leaveLetter'
  ];

  // Add primary traveler fields
  documentTypes.forEach(docType => {
    fields.push({
      name: `primaryTraveler_${docType}`,
      maxCount: 1
    });
  });

  // Add fields for sub-travelers
  documentTypes.forEach(docType => {
    fields.push({
      name: `subTraveler_${docType}`,
      maxCount: 1
    });
    // Also add numbered format
    fields.push({
      name: new RegExp(`^subTraveler\\d+_${docType}$`),
      maxCount: 1
    });
    // Match sub-travelers with ID format: subTraveler_<mongoId>_<docType>
    fields.push({
      name: new RegExp(`^subTraveler_[a-fA-F0-9]{24}_${docType}$`), // Matches MongoDB ObjectId
      maxCount: 1
    });

    // Match sub-travelers with "new<number>_<docType>"
    fields.push({
      name: new RegExp(`^subTraveler_new\\d+_${docType}$`),
      maxCount: 1
    });

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
      // console.log("Parsed Request Body:", req.body);
      next();
    } catch (error) {
      next(error);
    }
  },
  
  // validateRequest(visaValidationSchema),
  VisaController.createVisaApplication
);

// Get all visa applications
router.get("/", VisaController.getVisaApplications);

// Get single visa application
router.get("/:id", VisaController.getVisaApplicationById);

// Delete visa application
router.delete("/:id", VisaController.deleteVisaApplication);

// Update visa application
router.put(
  "/:id",
  handleMultipleFiles(getUploadFields()),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      if (typeof req.body.data === 'string') {
        req.body = JSON.parse(req.body.data);
      }
      next();
    } catch (error) {
      next(error);
    }
  },
  validateRequest(updateVisaValidationSchema),
  VisaController.updateVisaApplication
);

// Delete sub-traveler
router.delete(
  "/:visaId/sub-traveler/:subTravelerId",
  VisaController.deleteSubTraveler
);

// Update sub-traveler
router.put(
  "/:visaId/sub-traveler/:subTravelerId",
  handleMultipleFiles(getUploadFields()),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      if (typeof req.body.data === 'string') {
        req.body = JSON.parse(req.body.data);
      }
      next();
    } catch (error) {
      next(error);
    }
  },
  validateRequest(updateVisaValidationSchema),
  VisaController.updateSubTraveler
);

// Get sub-traveler by ID
router.get(
  "/:visaId/sub-traveler/:subTravelerId",
  VisaController.getSubTravelerById
);

router.put(
  "/:visaId/primary-traveler",
  handleMultipleFiles(getUploadFields()),
  (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      if (typeof req.body.data === 'string') {
        const data = JSON.parse(req.body.data);
        let newTraveler = undefined;

        if (req.body.newTraveler && typeof req.body.newTraveler === 'string') {
          newTraveler = JSON.parse(req.body.newTraveler);
        }

        req.body = {
          data,
          newTraveler,
        };
      }
      next();
    } catch (error) {
      next(error);
    }
  },
  validateRequest(updateVisaValidationSchema),
  VisaController.updatePrimaryTraveler
);


export const visaRoutes = router;
