import { Router } from "express";
import { VisaController } from "./visa.controllers";
import { handleMultipleFiles } from "../../utils/fileUpload";
import validateRequest from "../../middlewares/validateRequest";
import { visaValidationSchema } from "./visa.validation";
// import { visaValidationSchema } from "./visa.validation";

const router = Router();

const uploadFields = [
  // General Documents
  { name: "passportCopy", maxCount: 1 },
  { name: "passportPhoto", maxCount: 1 },
  { name: "bankStatement", maxCount: 1 },
  { name: "bankSolvency", maxCount: 1 },
  { name: "visitingCard", maxCount: 1 },
  { name: "hotelBooking", maxCount: 1 },
  { name: "airTicket", maxCount: 1 },
  
  // Business Documents
  { name: "tradeLicense", maxCount: 1 },
  { name: "notarizedId", maxCount: 1 },
  { name: "memorandum", maxCount: 1 },
  { name: "officePad", maxCount: 1 },
  
  // Student Documents
  { name: "studentId", maxCount: 1 },
  { name: "travelLetter", maxCount: 1 },
  { name: "birthCertificate", maxCount: 1 },
  
  // Job Holder Documents
  { name: "nocCertificate", maxCount: 1 },
  { name: "officialId", maxCount: 1 },
  { name: "bmdcCertificate", maxCount: 1 },
  { name: "barCouncilCertificate", maxCount: 1 },
  { name: "retirementCertificate", maxCount: 1 },
  
  // Other Documents
  { name: "marriageCertificate", maxCount: 1 }
];

// Create visa application route
router.post(
  "/create",
  handleMultipleFiles(uploadFields),
  validateRequest(visaValidationSchema),
  VisaController.createVisaApplication
);

// Get all visa applications
router.get("/", VisaController.getVisaApplications);

// Get single visa application
router.get("/:id", VisaController.getVisaApplicationById);

export const visaRoutes = router;
